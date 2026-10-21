/* Routes the existing google.script.run calls to the Cloudflare Worker (/api/rpc/*). */
(function () {
  function makeRun() {
    var ok = null, fail = null;
    var run = {
      withSuccessHandler: function (f) { ok = f; return run; },
      withFailureHandler: function (f) { fail = f; return run; }
    };
    ['getAppData', 'saveCollection', 'resetDemoData'].forEach(function (name) {
      run[name] = function () {
        var s = ok, f = fail, args = Array.prototype.slice.call(arguments);
        fetch('/api/rpc/' + name, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ args: args }) })
          .then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j.error || res.statusText); return j; }); })
          .then(function (j) { if (s) s(j); })
          .catch(function (e) { if (f) f(e); });
      };
    });
    return run;
  }
  window.google = { script: {} };
  Object.defineProperty(window.google.script, 'run', { get: makeRun });
})();
