import { MUTABLE_KEYS, getDefaultData } from './data.js';
import { askAgent, warRoom, MODEL, AGENTS } from './agents.js';

const PREFIX = 'db_';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

async function loadData(env) {
  const data = getDefaultData(env.PLANT_TZ);
  const stored = [];
  await Promise.all(MUTABLE_KEYS.map(async k => {
    const raw = await env.DB.get(PREFIX + k);
    if (raw) { try { data[k] = JSON.parse(raw); stored.push(k); } catch (e) { /* ignore broken value */ } }
  }));
  data.meta = { storedKeys: stored, loadedAt: new Date().toISOString() };
  return data;
}

async function saveCollection(env, key, value, audit) {
  if (MUTABLE_KEYS.indexOf(key) === -1 || key === 'audit') throw new Error('This collection cannot be edited: ' + key);
  await env.DB.put(PREFIX + key, JSON.stringify(value));
  if (audit) await appendAudit(env, audit);
  return true;
}

async function appendAudit(env, a) {
  const raw = await env.DB.get(PREFIX + 'audit');
  const list = raw ? JSON.parse(raw) : getDefaultData(env.PLANT_TZ).audit;
  list.unshift({
    time: new Date().toISOString(),
    user: String(a.user || '').slice(0, 60),
    role: String(a.role || '').slice(0, 40),
    action: String(a.action || '').slice(0, 50),
    detail: String(a.detail || '').slice(0, 120)
  });
  await env.DB.put(PREFIX + 'audit', JSON.stringify(list.slice(0, 60)));
}

async function resetDemoData(env) {
  await Promise.all(MUTABLE_KEYS.map(k => env.DB.delete(PREFIX + k)));
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
  try { return await request.json(); } catch (e) { return {}; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/rpc/') && request.method === 'POST') {
        const name = path.slice('/api/rpc/'.length);
        if (!RPC[name]) return json({ error: 'Unknown call: ' + name }, 404);
        const body = await readJson(request);
        const result = await RPC[name](env, body.args || []);
        return json(result);
      }

      if (path === '/api/agents/status' && request.method === 'GET') {
        return json({ live: !!env.ANTHROPIC_API_KEY, model: MODEL, agents: Object.entries(AGENTS).map(([id, a]) => ({ id, name: a.name, role: a.role })) });
      }

      if (path === '/api/agents/chat' && request.method === 'POST') {
        const body = await readJson(request);
        const snap = await loadData(env);
        return json(await askAgent(env, snap, body.agent, String(body.message || '').slice(0, 2000), body.history || []));
      }

      if (path === '/api/agents/war-room' && request.method === 'POST') {
        const body = await readJson(request);
        const snap = await loadData(env);
        return json(await warRoom(env, snap, String(body.question || '').slice(0, 2000)));
      }

      if (path.startsWith('/api/')) return json({ error: 'Not found' }, 404);
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || 'Server error' }, 500);
    }
  }
};
