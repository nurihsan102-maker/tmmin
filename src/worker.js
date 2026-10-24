import { MUTABLE_KEYS, getDefaultData } from './data.js';
import { askAgent, warRoom, AGENTS, modelName } from './agents.js';

const PREFIX = 'db_';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

const MAX_BODY_BYTES = 1_000_000;   // reject oversized POST bodies early
const AGENT_CALLS_PER_MIN = 20;     // per client IP, per colo (approximate, uses the Cache API, no KV writes)
const SNAPSHOT_TTL_MS = 60_000;     // agents may use a snapshot up to 60 s old (KV reads are the free-tier limit)

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Per-isolate snapshot of the stored collections. Writes made in this isolate patch it in place.
// Other isolates see changes after SNAPSHOT_TTL_MS at most (only used by agent context).
let snapCache = null;

async function loadData(env, { maxAgeMs = 0 } = {}) {
  if (maxAgeMs && snapCache && Date.now() - snapCache.at < maxAgeMs) return snapCache.data;
  const data = getDefaultData(env.PLANT_TZ);
  const stored = [];
  await Promise.all(MUTABLE_KEYS.map(async k => {
    const raw = await env.DB.get(PREFIX + k);
    if (raw) { try { data[k] = JSON.parse(raw); stored.push(k); } catch (e) { /* ignore broken value */ } }
  }));
  data.meta = { storedKeys: stored, loadedAt: new Date().toISOString() };
  snapCache = { at: Date.now(), data };
  return data;
}

async function saveCollection(env, key, value, audit) {
  if (MUTABLE_KEYS.indexOf(key) === -1 || key === 'audit') throw new HttpError(400, 'This collection cannot be edited: ' + key);
  if (value === undefined) throw new HttpError(400, 'Missing value for ' + key);
  await env.DB.put(PREFIX + key, JSON.stringify(value));
  if (snapCache) snapCache.data[key] = value;
  if (audit) await appendAudit(env, audit);
  return true;
}

async function appendAudit(env, a) {
  const raw = await env.DB.get(PREFIX + 'audit');
  let list = null;
  if (raw) { try { list = JSON.parse(raw); } catch (e) { list = null; } }
  if (!Array.isArray(list)) list = getDefaultData(env.PLANT_TZ).audit;
  list.unshift({
    time: new Date().toISOString(),
    user: String(a.user || '').slice(0, 60),
    role: String(a.role || '').slice(0, 40),
    action: String(a.action || '').slice(0, 50),
    detail: String(a.detail || '').slice(0, 120)
  });
  const trimmed = list.slice(0, 60);
  await env.DB.put(PREFIX + 'audit', JSON.stringify(trimmed));
  if (snapCache) snapCache.data.audit = trimmed;
}

async function resetDemoData(env) {
  await Promise.all(MUTABLE_KEYS.map(k => env.DB.delete(PREFIX + k)));
  snapCache = null;
  await appendAudit(env, {
    user: 'Demo user (System Administrator)', role: 'System Administrator',
    action: 'Reset demo data', detail: 'All collections restored to defaults'
  });
  return loadData(env);
}

const RPC = {
  getAppData: env => loadData(env),
  saveCollection: (env, [key, value, audit]) => saveCollection(env, key, value, audit),
  resetDemoData: env => resetDemoData(env)
};

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch (e) {
    return {};
  }
}

/** Keep only well-formed, short history turns; the API rejects anything else. */
function cleanHistory(h) {
  if (!Array.isArray(h)) return [];
  const out = h.slice(-6)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

/** Optional gate: when the ACCESS_CODE secret is set, agent calls must send it in x-access-code. */
function accessOk(request, env) {
  const expected = env.ACCESS_CODE;
  if (!expected) return true;
  const given = request.headers.get('x-access-code') || '';
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Approximate per-IP limit with the Cache API (free, no KV writes). Counts per colo. */
async function overAgentRateLimit(request) {
  const cache = globalThis.caches && caches.default;
  if (!cache) return false;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const minute = Math.floor(Date.now() / 60000);
  const url = `https://ratelimit.internal/agents/${ip}/${minute}`;
  try {
    const hit = await cache.match(url);
    const n = hit ? Number(await hit.text()) || 0 : 0;
    if (n >= AGENT_CALLS_PER_MIN) return true;
    await cache.put(url, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=120' } }));
  } catch (e) { /* limiter is best-effort */ }
  return false;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/') && request.method === 'POST') {
        const len = Number(request.headers.get('content-length') || 0);
        if (len > MAX_BODY_BYTES) throw new HttpError(413, 'Request too large');
      }

      if (path.startsWith('/api/rpc/') && request.method === 'POST') {
        const name = path.slice('/api/rpc/'.length);
        if (!Object.prototype.hasOwnProperty.call(RPC, name)) return json({ error: 'Unknown call: ' + name }, 404);
        const body = await readJson(request);
        const result = await RPC[name](env, Array.isArray(body.args) ? body.args : []);
        return json(result);
      }

      if (path === '/api/agents/status' && request.method === 'GET') {
        return json({ live: !!env.ANTHROPIC_API_KEY, model: modelName(env), agents: Object.entries(AGENTS).map(([id, a]) => ({ id, name: a.name, role: a.role })) });
      }

      if (path === '/api/agents/chat' && request.method === 'POST') {
        if (!accessOk(request, env)) return json({ error: 'Access code required' }, 401);
        if (await overAgentRateLimit(request)) return json({ error: 'Too many agent requests. Try again in a minute.' }, 429);
        const body = await readJson(request);
        const agent = String(body.agent || '');
        if (!AGENTS[agent]) throw new HttpError(400, 'Unknown agent: ' + agent);
        const message = String(body.message || '').trim().slice(0, 2000);
        if (!message) throw new HttpError(400, 'Message is required');
        const snap = await loadData(env, { maxAgeMs: SNAPSHOT_TTL_MS });
        return json(await askAgent(env, snap, agent, message, cleanHistory(body.history)));
      }

      if (path === '/api/agents/war-room' && request.method === 'POST') {
        if (!accessOk(request, env)) return json({ error: 'Access code required' }, 401);
        if (await overAgentRateLimit(request)) return json({ error: 'Too many agent requests. Try again in a minute.' }, 429);
        const body = await readJson(request);
        const question = String(body.question || '').trim().slice(0, 2000);
        if (!question) throw new HttpError(400, 'Question is required');
        const snap = await loadData(env, { maxAgeMs: SNAPSHOT_TTL_MS });
        return json(await warRoom(env, snap, question));
      }

      if (path.startsWith('/api/')) return json({ error: 'Not found' }, 404);
      return env.ASSETS.fetch(request);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      return json({ error: status === 500 ? 'Server error' : err.message }, status);
    }
  }
};
