/* teacher.js · helpers shared by aula.html and taller.html — ES5. */
(function (w, d) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function el(id) { return d.getElementById(id); }
  function qs(s, r) { return (r || d).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function txt(e, s) { if (!e) return; if ('textContent' in e) e.textContent = s; else e.innerText = s; }

  function bar(pct, thin) {
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    return '<span class="meter' + (thin ? ' thin' : '') + '"><i style="width:' + pct + '%"></i></span>';
  }

  function fmtWhen(iso) {
    if (!iso) return 'no activity yet';
    var t = new Date(iso);
    if (isNaN(t.getTime())) return 'no activity yet';
    var now = new Date();
    var sameDay = t.toDateString() === now.toDateString();
    var hh = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
    if (sameDay) return 'today ' + hh;
    var yest = new Date(now.getTime() - 86400000);
    if (t.toDateString() === yest.toDateString()) return 'yesterday ' + hh;
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return t.getDate() + ' ' + M[t.getMonth()] + ', ' + hh;
  }

  function loadData() {
    return sb.from('profiles')
      .select('id,email,full_name,role')
      .order('full_name')
      .then(function (profiles) {
        profiles = profiles || [];
        return sb.from('progress')
          .select('student_id,state,points,updated_at')
          .then(function (rows) {
            rows = rows || [];
            var byId = {}, i;
            for (i = 0; i < profiles.length; i++) {
              byId[profiles[i].id] = { profile: profiles[i], progress: null };
            }
            for (i = 0; i < rows.length; i++) {
              if (byId[rows[i].student_id]) byId[rows[i].student_id].progress = rows[i];
            }
            return { profiles: profiles, byId: byId };
          });
      });
  }

  function loadAssignments() {
    return sb.from('assignments')
      .select('id,student_id,floor,title,body,source,status,created_at,completed_at')
      .order('created_at', true)
      .then(function (rows) { return rows || []; })['catch'](function () { return []; });
  }

  function students(data) {
    var out = [], i;
    for (i = 0; i < data.profiles.length; i++) {
      if (data.profiles[i].role === 'student') out.push(data.profiles[i]);
    }
    return out;
  }

  function stateOf(data, id) {
    var rec = data.byId[id];
    return (rec && rec.progress && rec.progress.state) ? rec.progress.state : {};
  }

  function pointsOf(data, id) {
    var rec = data.byId[id];
    return (rec && rec.progress && rec.progress.points) ? rec.progress.points : 0;
  }

  function updatedOf(data, id) {
    var rec = data.byId[id];
    return (rec && rec.progress && rec.progress.updated_at) ? rec.progress.updated_at : null;
  }

  /* list of wrong answers: [{section, floor, item, misses}] */
  function wrongList(st) {
    var out = [], k;
    st = st || {};
    for (k in st) {
      if (!k || k.indexOf('w.') !== 0) continue;
      var n = parseInt(st[k], 10) || 0;
      if (!n) continue;
      var parts = k.split('.');
      out.push({ floor: parts[1], item: parts[2], misses: n });
    }
    out.sort(function (a, b) { return b.misses - a.misses; });
    return out;
  }

  function floorLabel(floor) {
    var i, s = w.Curriculum.sections;
    for (i = 0; i < s.length; i++) {
      if (s[i].quiz && s[i].quiz.hasOwnProperty(floor)) return s[i].badge;
    }
    return 'Floor ' + floor;
  }

  function gate(o) {
    w.Auth.gate({
      el: o.el,
      app: o.app,
      role: 'teacher',
      context: 'teacher',
      reason: o.reason || 'Sign in with your teacher account to continue.',
      onReady: o.onReady
    });
  }

  function msg(e, text, kind) {
    if (!e) return;
    e.className = 'msg' + (kind ? ' ' + kind : '');
    txt(e, text);
  }

  w.T = {
    esc: esc, el: el, qs: qs, qsa: qsa, txt: txt, bar: bar, fmtWhen: fmtWhen,
    loadData: loadData, loadAssignments: loadAssignments, students: students,
    stateOf: stateOf, pointsOf: pointsOf, updatedOf: updatedOf,
    wrongList: wrongList, floorLabel: floorLabel, gate: gate, msg: msg
  };
})(window, document);
