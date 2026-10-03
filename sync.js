/* sync.js · student progress and extra assignments <-> Supabase (index.html) — ES5.
   Local storage is always written first (works offline), the cloud is a mirror. */
(function (w, d) {
  'use strict';
  var BASE = 'vip.';
  var timer = null;
  var inflight = false;
  var pending = false;

  function uid() { var s = w.sb && sb.session(); return s && s.user ? s.user.id : null; }
  function pfx() { return BASE + (uid() ? uid() + '.' : 'guest.'); }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function get(k) { return lsGet(pfx() + k); }

  function set(k, v) {
    lsSet(pfx() + k, '' + v);
    schedule();
  }

  function state() {
    var out = {}, pre = pfx(), i, k;
    try {
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (k && k.indexOf(pre) === 0) out[k.substring(pre.length)] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }

  /* ---- merge rules: never lose progress, never inflate it ---- */
  function better(key, cur, inc) {
    if (cur === null || cur === undefined || cur === '') return inc;
    if (inc === null || inc === undefined || inc === '') return cur;
    if (key === 'pts' || key === 'tw' || key.indexOf('w.') === 0) {
      var a = parseInt(cur, 10) || 0, b = parseInt(inc, 10) || 0;
      return String(b > a ? b : a);
    }
    if (key === 'done') {
      var seen = {}, list = [], all = String(cur).split(','), part = String(inc).split(','), i;
      var join = all.concat(part);
      for (i = 0; i < join.length; i++) {
        var kk = join[i];
        if (kk && !seen[kk]) { seen[kk] = 1; list.push(kk); }
      }
      return list.join(',');
    }
    if (key === 'story' || key === 'c6t') return String(cur).length >= String(inc).length ? cur : inc;
    if (inc === '1') return '1';
    return cur;
  }

  function mergeInto(ns, prefix) {
    var k;
    for (k in ns) {
      if (!ns.hasOwnProperty(k)) continue;
      var cur = lsGet(prefix + k);
      lsSet(prefix + k, better(k, cur, ns[k]));
    }
  }

  function adoptGuest() {
    var me = uid();
    if (!me) return;
    var guestPre = BASE + 'guest.', keys = [], i;
    try {
      for (i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(guestPre) === 0) keys.push(k);
      }
    } catch (e) {}
    var moved = {};
    for (i = 0; i < keys.length; i++) {
      moved[keys[i].substring(guestPre.length)] = localStorage.getItem(keys[i]);
    }
    mergeInto(moved, BASE + me + '.');
    /* the copy now lives under the student's own key: drop the shared guest data
       so the next student who signs in on this device does not inherit it */
    try { for (i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]); } catch (e) {}
  }

  /* ---- cloud ---- */
  function schedule() {
    if (!uid()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!uid() || !w.sb || !sb.configured) return;
    if (inflight) { pending = true; return; }
    inflight = true;
    var st = state();
    var pts = parseInt(st.pts || '0', 10) || 0;
    sb.from('progress')
      .upsert({ student_id: uid(), state: st, points: pts, updated_at: new Date().toISOString() })
      .onConflict('student_id')
      .then(done, done);
    function done() { inflight = false; if (pending) { pending = false; flush(); } }
  }

  function pull() {
    if (!uid()) return w.Promise ? Promise.resolve(null) : null;
    return sb.from('progress')
      .select('state,points,updated_at')
      .eq('student_id', uid())
      .limit(1)
      .then(function (rows) {
        var row = rows && rows.length ? rows[0] : null;
        if (row && row.state) mergeInto(row.state, pfx());
        rehydrate();
        return row;
      })['catch'](function () { return null; });
  }

  function rehydrate() {
    if (typeof w.__rehydrate === 'function') {
      try { w.__rehydrate(); } catch (e) {}
    }
  }

  /* ---- extra assignments ---- */
  function renderExtra(rows) {
    var sec = d.getElementById('extra');
    var list = d.getElementById('extra-list');
    var link = d.getElementById('nav-extra');
    if (!sec || !list) return;
    if (!rows || !rows.length) {
      sec.setAttribute('hidden', '');
      if (link) link.setAttribute('hidden', '');
      return;
    }
    sec.removeAttribute('hidden');
    if (link) link.removeAttribute('hidden');
    var html = '', i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<article class="card extra-card" data-id="' + r.id + '">' +
        '<h3>' + esc(r.title) + '</h3>' +
        (r.floor ? '<span class="badge">Floor ' + esc(r.floor) + '</span>' : '') +
        '<div class="extra-body">' + (r.body || '') + '</div>' +
        '<p><button type="button" class="btn extra-done">I finished it</button></p>' +
        '</article>';
    }
    list.innerHTML = html;
    var btns = list.querySelectorAll('.extra-done'), j;
    for (j = 0; j < btns.length; j++) {
      btns[j].onclick = function () {
        var card = this;
        while (card && !hasClass(card, 'extra-card')) card = card.parentNode;
        if (!card) return;
        var id = card.getAttribute('data-id');
        this.disabled = true;
        sb.from('assignments').update({ status: 'done' }).eq('id', id).then(function () {
          if (card.parentNode) card.parentNode.removeChild(card);
          if (!list.children.length) renderExtra([]);
        }, function () { card.innerHTML = '<p class="auth-msg bad">Could not save. Try again.</p>'; });
      };
    }
  }

  function hasClass(el, c) { return (' ' + (el.className || '') + ' ').indexOf(' ' + c + ' ') > -1; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pullAssignments() {
    if (!uid()) { renderExtra([]); return; }
    sb.from('assignments')
      .select('id,floor,title,body,created_at')
      .eq('student_id', uid())
      .eq('status', 'assigned')
      .order('created_at')
      .then(function (rows) { renderExtra(rows || []); })['catch'](function () {});
  }

  /* ---- boot ---- */
  function start() {
    if (started) return;
    started = true;
    if (!w.sb || !sb.configured) return;
    if (uid()) {
      pull();
      pullAssignments();
      sb.getProfile();
    }
    if (w.addEventListener) {
      w.addEventListener('beforeunload', flush, false);
      w.addEventListener('pagehide', flush, false);
    }
    if (d.addEventListener) {
      d.addEventListener('visibilitychange', function () {
        if (d.visibilityState === 'hidden') flush();
      }, false);
    }
    if (w.Auth && w.Auth.onChange) {
      w.Auth.onChange(function (user) {
        if (user) {
          adoptGuest();
          pull();
          pullAssignments();
          if (w.__rehydrate) rehydrate();
        } else {
          if (timer) { clearTimeout(timer); timer = null; }
          renderExtra([]);
        }
      });
    }
  }

  w.Progress = {
    uid: uid,
    get: get,
    set: set,
    state: state,
    flush: flush,
    pull: pull,
    pullAssignments: pullAssignments,
    start: start
  };
})(window, document);
