/* Agents page: ask one Haiku specialist, or run the war room where specialists discuss. */
(function () {
  var AGENT_IDS = ['coordinator', 's1', 's2', 's3', 'quality', 'maintenance', 'people', 'finance'];
  var NAMES = {};
  var state = { mode: 'war', agent: 's1', log: [], busy: false, live: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function para(s) { return '<p>' + esc(s).replace(/\n/g, '<br>') + '</p>'; }

  function api(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.statusText); return j; }); });
  }

  function render() {
    var el = document.getElementById('agentBody');
    if (!el) return;
    var chips = AGENT_IDS.map(function (id) {
      return '<button class="btn sm' + (state.agent === id ? ' primary' : '') + '" onclick="agentPick(\'' + id + '\')">' + esc(NAMES[id] || id) + '</button>';
    }).join('');
    var log = state.log.map(function (m) {
      return '<div class="msg ' + (m.who === 'user' ? 'user' : 'bot') + '">' + m.html + '</div>';
    }).join('');
    var prev = document.getElementById('agentQ');
    var draft = prev ? prev.value : '';
    var hadFocus = !!prev && document.activeElement === prev;
    el.innerHTML = liveBadge() +
      '<div class="card chat"><div class="chat-sug">' +
      '<button class="btn sm' + (state.mode === 'war' ? ' primary' : '') + '" onclick="agentMode(\'war\')">War room (all discuss)</button>' +
      '<button class="btn sm' + (state.mode === 'one' ? ' primary' : '') + '" onclick="agentMode(\'one\')">Ask one agent</button></div>' +
      (state.mode === 'one' ? '<div class="chat-sug">' + chips + '</div>' : '') +
      '<div class="chat-log" id="agentLog">' + (log || '<div class="msg bot"><p>Ask a question about inspection, downtime, knowledge, line flexibility or cost.</p></div>') + (state.busy ? busyHtml() : '') + '</div>' +
      '<div class="chat-in"><input id="agentQ" placeholder="Ask the team…" onkeydown="if(event.key===\'Enter\')agentSend()"><button class="btn primary" onclick="agentSend()"' + (state.busy ? ' disabled' : '') + '>' + (state.busy ? 'Thinking…' : 'Send') + '</button></div></div>' +
      '<p class="small muted mt">Answers are based on simulated data.</p>';
    var log2 = document.getElementById('agentLog'); if (log2) log2.scrollTop = log2.scrollHeight;
    var input = document.getElementById('agentQ');
    if (input) { input.value = draft; if (hadFocus) input.focus(); }
  }

  function pushBot(html) { state.log.push({ who: 'bot', html: html }); }

  function liveBadge() {
    var m = state.live === true ? '<span class="badge b-green">Live · Haiku answers</span>'
      : state.live === false ? '<span class="badge b-amber">Offline · stored data only</span>'
      : '<span class="badge">Checking mode…</span>';
    return '<div class="row" style="margin-bottom:10px">' + m + '</div>';
  }

  function busyHtml() {
    var t = state.mode === 'war' ? 'War room: specialists are answering and discussing' : 'Agent is thinking';
    return '<div class="msg bot" role="status" aria-live="polite"><p><b>' + t + '…</b></p>' +
      '<div class="progress"><span class="indet"></span></div><p class="small muted mt">Usually 10–30 seconds.</p></div>';
  }

  window.agentMode = function (m) { state.mode = m; render(); };
  window.agentPick = function (id) { state.agent = id; state.mode = 'one'; render(); };

  window.agentSend = function () {
    var q = (document.getElementById('agentQ') || {}).value || '';
    q = q.trim();
    if (!q || state.busy) return;
    var input = document.getElementById('agentQ'); if (input) input.value = '';
    state.log.push({ who: 'user', html: esc(q) });
    state.busy = true; render();
    var req = state.mode === 'war'
      ? api('/api/agents/war-room', { question: q }).then(function (r) {
          state.live = r.live;
          var parts = r.rounds.answers.map(function (a) {
            var d = (r.rounds.discussion || []).find(function (x) { return x.agent === a.agent; });
            return '<p><b>' + esc(NAMES[a.agent] || a.agent) + '</b><br>' + esc(a.reply).replace(/\n/g, '<br>') +
              (d && d.reply ? '<br><span class="muted">Discussion: ' + esc(d.reply) + '</span>' : '') + '</p>';
          }).join('');
          pushBot('<p class="small muted">Route: ' + esc(r.route.map(function (x) { return x.name; }).join(' · ')) + '</p>' + parts +
            '<p><b>Coordinator synthesis</b><br>' + esc(r.synthesis).replace(/\n/g, '<br>') + '</p>');
        })
      : api('/api/agents/chat', { agent: state.agent, message: q, history: [] }).then(function (r) {
          state.live = r.live;
          pushBot('<p><b>' + esc(NAMES[r.agent] || r.agent) + '</b></p>' + para(r.reply));
        });
    req.catch(function (e) { pushBot('<p class="muted">Could not get an answer: ' + esc(e.message) + '</p>'); })
      .then(function () { state.busy = false; render(); });
  };

  window.renderAgentsPage = function () {
    return pageHead('AI agent team', 'Haiku specialists for Solutions 1–3, quality, maintenance, people and finance. Use the war room to have them discuss a question.') +
      '<div id="agentBody"></div>';
  };

  fetch('/api/agents/status').then(function (r) { return r.json(); }).then(function (j) {
    j.agents.forEach(function (a) { NAMES[a.id] = a.name; });
    state.live = j.live;
    render();
  }).catch(function () {});

  // PAGES is a top-level const in index.html, so it is not on window; reference it by name.
  PAGES.agents = function () { var html = renderAgentsPage(); setTimeout(render, 0); return html; };
})();
