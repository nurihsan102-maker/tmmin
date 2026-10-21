/**
 * Haiku agent team for the ATS Smart Factory platform.
 * Every agent calls the same model: claude-haiku-5-5.
 * Case text from the M3C casebook is NOT sent to the model unless CASE_CONTEXT_ENABLED = "true".
 */
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-haiku-5-5';

export const AGENTS = {
  coordinator: {
    name: 'Coordinator', role: 'Routes questions and synthesizes the team',
    prompt: 'You coordinate a team of specialist agents for a factory improvement program. You route questions, reconcile disagreements between specialists, and write the final recommendation for plant leadership. Be concise and decisive. Always say which specialist said what.'
  },
  s1: {
    name: 'Solution 1 · Manufacturing Intelligence', role: 'AI detection, alerts, closed-loop response',
    prompt: 'You are the AI-Augmented Manufacturing Intelligence specialist. You turn plant data (camera detections, machine sensors, production and quality records) into early warnings with location, defect type, probable cause and parameters. You insist on human validation before corrective action, a shadow-mode period before alerts interrupt work, and feedback of false alarms into training data.'
  },
  s2: {
    name: 'Solution 2 · Takumi Copilot', role: 'Knowledge capture, troubleshooting, kaizen time',
    prompt: 'You are the Takumi Copilot specialist for knowledge and engineering. You help capture senior know-how, suggest similar past cases and checks, and plan protected kaizen time. You never answer without a source from the knowledge base; if none exists, say so and propose what to capture. Technical decisions stay with people.'
  },
  s3: {
    name: 'Solution 3 · Simulation & Flexibility', role: 'Digital twin, variant and mix scenarios',
    prompt: 'You are the simulation-based flexible manufacturing specialist. You evaluate line and production-mix scenarios (throughput, bottlenecks, changeover, investment, quality risk, operator workload) before any physical change, and you note where the model needs calibration against real data.'
  },
  quality: {
    name: 'Quality & Inspection', role: 'Defects, root cause, CAPA',
    prompt: 'You are the quality specialist. You focus on defect patterns, escaped defects, scrap, root-cause evidence strength and corrective actions. You flag when evidence is weak.'
  },
  maintenance: {
    name: 'Maintenance & Downtime', role: 'Equipment health, PM, unplanned downtime',
    prompt: 'You are the maintenance and downtime specialist. You prioritize equipment risk, unplanned downtime and preventive maintenance, and you consider safety (lockout/tagout) first.'
  },
  people: {
    name: 'People & Change', role: 'Operator adoption, skills, data privacy',
    prompt: 'You are the people and change specialist. You focus on operator trust and adoption, skill building (AI User, AI Builder, Knowledge Owner tiers), reverse mentoring, and worker data protection (Indonesian Personal Data Protection Law, UU 27/2022) for any camera or worker data.'
  },
  finance: {
    name: 'Finance & Business Impact', role: 'Investment, savings, KPIs',
    prompt: 'You are the finance and business impact specialist. You check whether claims of savings, payback and KPI movement are supported by the stated assumptions, and you state what is still unknown.'
  }
};

const ROUTE_HINTS = {
  s1: /camera|vision|defect|detect|alert|anomal|sensor|inspection|cctv/i,
  s2: /knowledge|senior|expert|troubleshoot|kaizen|idea|copilot|train|skill|document/i,
  s3: /simulat|variant|mix|changeover|line|digital twin|scenario|bev|hev|phev|capacity/i,
  quality: /quality|scrap|paint|gap|rework|capa|root cause|escape/i,
  maintenance: /maintenance|downtime|machine|robot|conveyor|breakdown|pm\b|equipment/i,
  people: /operator|people|adoption|privacy|pdp|worker|team|change/i,
  finance: /cost|saving|npv|payback|invest|budget|roi|money|rp|idr|financial/i
};

/** Optional case text. Off by default; see CASE_CONTEXT_ENABLED in wrangler.jsonc. */
const CASE_SUMMARY = `Case (M3C 2026, TMMIN): conversion cost index 106 vs. new-entrant benchmark 89; scrap 108, downtime 111, escaped defects 103 (2023 = 100); non-value-added operator time 22%; equipment modification 9 months per new variant; 48% of critical processes depend on 1–2 seniors; engineers 65% routine work; 2 of 30 engineers proficient in software and AI.`;

function client(env) {
  return env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
}

function snapshotText(snap) {
  const k = snap.kpis || {};
  const alerts = (snap.alerts || []).filter(a => a.status !== 'Resolved').map(a => `${a.id} [${a.severity}] ${a.title}`).join('; ');
  const eq = (snap.equipment || []).map(e => `${e.id} ${e.name} risk ${e.risk}`).join('; ');
  const kb = (snap.knowledge || []).map(x => `${x.id} ${x.title} (${x.status}; source ${x.source})`).join('; ');
  const ideas = (snap.kaizen || []).map(x => `${x.id} ${x.title} (${x.status})`).join('; ');
  return [
    `Plant KPIs: OEE ${k.oee}%, FPY ${k.fpy}%, downtime ${k.downtime} h, defect rate ${k.defectRate}%, scrap ${k.scrapRate}%.`,
    `Open alerts: ${alerts || 'none'}.`,
    `Equipment risk: ${eq}.`,
    `Knowledge base: ${kb || 'empty'}.`,
    `Kaizen pipeline: ${ideas || 'empty'}.`
  ].join('\n');
}

function systemFor(id, env, snap) {
  const a = AGENTS[id];
  const parts = [
    a.prompt,
    'Answer in the same language as the user (Indonesian or English). Keep replies under 180 words. Cite sources or data IDs when you use them. If data is missing, say so.',
    'Live plant data (simulated demo, not actual TMMIN data):\n' + snapshotText(snap)
  ];
  if (env.CASE_CONTEXT_ENABLED === 'true') parts.push(CASE_SUMMARY);
  return parts.join('\n\n');
}

async function callHaiku(env, system, messages, maxTokens = 600) {
  const c = client(env);
  if (!c) return null;
  const res = await c.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages
  });
  return res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

/** Offline demo answer used when no API key is configured. */
function offlineReply(id, question, snap) {
  const words = question.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3);
  const hit = (txt) => words.some(w => String(txt).toLowerCase().includes(w));
  const kb = (snap.knowledge || []).filter(x => hit(x.title + ' ' + x.symptom + ' ' + x.rootCause)).slice(0, 2);
  const al = (snap.alerts || []).filter(a => a.status !== 'Resolved' && hit(a.title + ' ' + a.line)).slice(0, 2);
  let out = `[Offline mode: no API key set. ${AGENTS[id].name} is using stored data only.]\n`;
  if (kb.length) out += 'Related knowledge: ' + kb.map(x => `${x.id} ${x.title} (source: ${x.source})`).join('; ') + '.\n';
  if (al.length) out += 'Related alerts: ' + al.map(a => `${a.id} ${a.title}`).join('; ') + '.\n';
  if (!kb.length && !al.length) out += 'No matching records in the stored data. Add the API key to get a live answer.';
  return out.trim();
}

export async function askAgent(env, snap, id, message, history = []) {
  if (!AGENTS[id]) throw new Error('Unknown agent: ' + id);
  const msgs = [...history.slice(-6), { role: 'user', content: message }];
  const reply = await callHaiku(env, systemFor(id, env, snap), msgs);
  return { agent: id, live: !!reply, reply: reply || offlineReply(id, message, snap) };
}

/**
 * War room: coordinator routes the question; chosen specialists answer in parallel,
 * then each sees the others' answers and responds once (discussion round);
 * coordinator writes the synthesis.
 */
export async function warRoom(env, snap, question) {
  const live = !!client(env);
  const picked = Object.keys(ROUTE_HINTS).filter(id => ROUTE_HINTS[id].test(question));
  const team = picked.length ? picked.slice(0, 3) : ['s1', 's2', 's3'];

  const round1 = await Promise.all(team.map(async id => {
    const reply = await callHaiku(env, systemFor(id, env, snap), [{ role: 'user', content: question }]);
    return { agent: id, reply: reply || offlineReply(id, question, snap) };
  }));

  let round2 = [];
  if (live) {
    round2 = await Promise.all(round1.map(async me => {
      const others = round1.filter(o => o.agent !== me.agent)
        .map(o => `${AGENTS[o.agent].name}: ${o.reply}`).join('\n\n');
      const reply = await callHaiku(
        env,
        systemFor(me.agent, env, snap),
        [{ role: 'user', content: `Question: ${question}\n\nYour first answer:\n${me.reply}\n\nOther specialists:\n${others}\n\nIn at most 60 words: do you agree or disagree with anyone, and what must change in your view? If nothing changes, say "No change."` }],
        200
      );
      return { agent: me.agent, reply: reply || '' };
    }));
  }

  let synthesis = '';
  if (live) {
    const transcript = round1.map(r => {
      const d = round2.find(x => x.agent === r.agent);
      return `${AGENTS[r.agent].name}\nAnswer: ${r.reply}\nDiscussion: ${d ? d.reply : ''}`;
    }).join('\n\n');
    synthesis = await callHaiku(
      env,
      AGENTS.coordinator.prompt + '\nWrite a short recommendation for plant leadership: the decision, the first 3 actions with owners, and the open risks. Use the same language as the question.',
      [{ role: 'user', content: `Question: ${question}\n\nTeam transcript:\n${transcript}` }],
      700
    );
  } else {
    synthesis = '[Offline mode: set ANTHROPIC_API_KEY to enable the discussion and synthesis.] Routed to: ' + team.map(id => AGENTS[id].name).join(', ') + '.';
  }

  return { live, route: team.map(id => ({ id, name: AGENTS[id].name })), rounds: { answers: round1, discussion: round2 }, synthesis };
}
