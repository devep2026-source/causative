/* auth.js · shared sign-in / sign-up UI for all three pages — ES5. */
(function (w, d) {
  'use strict';
  var listeners = [];
  var prof = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function on(el, ev, fn) { if (el && el.addEventListener) el.addEventListener(ev, fn, false); }
  function qs(s, r) { return (r || d).querySelector(s); }

  function notify() {
    var u = (w.sb && sb.user()) ? sb.user() : null;
    var i;
    for (i = 0; i < listeners.length; i++) {
      try { listeners[i](u, prof); } catch (e) {}
    }
  }

  function formHTML(mode, context) {
    var up = mode === 'up';
    var where = context === 'teacher' ? 'Teacher area' : 'Causative';
    return '' +
      '<div class="auth-head"><span class="auth-brand">' + esc(where) + '</span>' +
      '<span class="auth-tabs">' +
      '<button type="button" class="auth-tab' + (up ? '' : ' on') + '" data-mode="in">Sign in</button>' +
      '<button type="button" class="auth-tab' + (up ? ' on' : '') + '" data-mode="up">Create account</button>' +
      '</span></div>' +
      '<form class="auth-form" novalidate>' +
      '<label>' + (up ? 'School email' : 'Email') +
      '<input type="email" name="email" autocomplete="username" required placeholder="you@school.com"></label>' +
      '<label class="auth-namelab"' + (up ? '' : ' hidden') + '>Full name' +
      '<input type="text" name="name" autocomplete="name" placeholder="Ana Torres"' + (up ? '' : ' disabled') + '></label>' +
      '<label>' + (up ? 'Choose your access code' : 'Access code') +
      '<input type="password" name="password" autocomplete="' + (up ? 'new-password' : 'current-password') +
      '" required placeholder="the code your teacher gave you" minlength="4"></label>' +
      '<button type="submit" class="btn auth-submit">' + (up ? 'Create my account' : 'Sign in') + '</button>' +
      '<p class="auth-msg" role="status" aria-live="polite"></p>' +
      '<p class="auth-help">The access code <b>is</b> your password. Your progress is saved only for your account.</p>' +
      '</form>';
  }

  function signedInHTML(p) {
    var name = (p && p.full_name) || (w.sb && sb.user() && sb.user().email) || 'Student';
    var email = (p && p.email) || (w.sb && sb.user() && sb.user().email) || '';
    var role = p && p.role === 'teacher' ? '<span class="auth-role">teacher</span>' : '';
    return '<span class="auth-who"><b>' + esc(name) + '</b> <small>' + esc(email) + '</small>' + role + '</span>' +
      '<button type="button" class="auth-out">Sign out</button>';
  }

  function msg(el, text, kind) {
    var m = qs('.auth-msg', el);
    if (!m) return;
    m.className = 'auth-msg' + (kind ? ' ' + kind : '');
    m.textContent = text || '';
  }

  function bindForm(el, context, after) {
    var form = qs('.auth-form', el);
    if (!form) return;
    var mode = 'in';
    eachTab(el, function (tab) {
      tab.onclick = function () {
        mode = getA(tab, 'data-mode') || 'in';
        var box = el.querySelector('.auth-tabs');
        var tabs = box ? box.querySelectorAll('.auth-tab') : [];
        var i;
        for (i = 0; i < tabs.length; i++) {
          tabs[i].className = 'auth-tab' + (tabs[i] === tab ? ' on' : '');
        }
        var lab = qs('.auth-namelab', form);
        var inp = lab ? qs('input', lab) : null;
        if (lab) {
          if (mode === 'up') { lab.removeAttribute('hidden'); if (inp) inp.removeAttribute('disabled'); }
          else { lab.setAttribute('hidden', ''); if (inp) inp.setAttribute('disabled', ''); }
        }
        var pw = qs('input[name=password]', form);
        if (pw) pw.setAttribute('autocomplete', mode === 'up' ? 'new-password' : 'current-password');
        var sub = qs('.auth-submit', form);
        if (sub) sub.textContent = mode === 'up' ? 'Create my account' : 'Sign in';
        msg(el, '');
      };
    });
    form.onsubmit = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      var email = (qs('input[name=email]', form).value || '').replace(/^\s+|\s+$/g, '');
      var pass = qs('input[name=password]', form).value || '';
      var nameEl = qs('input[name=name]', form);
      var name = nameEl ? (nameEl.value || '').replace(/^\s+|\s+$/g, '') : '';
      var sub = qs('.auth-submit', form);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg(el, 'Please write a valid email.', 'bad'); return false; }
      if (pass.length < 4) { msg(el, 'The access code needs at least 4 characters.', 'bad'); return false; }
      if (mode === 'up' && !name) { msg(el, 'Please write your full name.', 'bad'); return false; }
      if (sub) { sub.disabled = true; sub.textContent = 'Working…'; }
      msg(el, '');
      var done = function () {
        if (sub) { sub.disabled = false; sub.textContent = mode === 'up' ? 'Create my account' : 'Sign in'; }
      };
      if (mode === 'up') {
        sb.signUp(email, pass, name).then(function (r) {
          done();
          if (r.confirmed) { msg(el, 'Welcome, ' + name + '!', 'ok'); refresh(after); }
          else msg(el, 'Almost there! We sent a confirmation email to ' + email +
            '. Open it, confirm, then sign in here.', 'ok');
        }, function (err) {
          done();
          msg(el, friendly(err), 'bad');
        });
      } else {
        sb.signIn(email, pass).then(function () {
          done();
          msg(el, 'Signed in.', 'ok');
          refresh(after);
        }, function (err) {
          done();
          msg(el, friendly(err), 'bad');
        });
      }
      return false;
    };
  }

  function eachTab(el, fn) {
    var tabs = el.querySelectorAll('.auth-tab'), i;
    for (i = 0; i < tabs.length; i++) fn(tabs[i]);
  }
  function getA(el, n) { return el.getAttribute(n); }

  function friendly(err) {
    var s = err && err.status;
    if (s === 400 || s === 401 || s === 403) return 'Email or access code is wrong.';
    if (s === 422) return (err && err.message) || 'That email is already registered.';
    if (s === 429) return 'Too many attempts. Wait a minute and try again.';
    if (err && /Failed to fetch|NetworkError|fetch/i.test(err.message || '')) return 'No connection. Check your internet.';
    return (err && err.message) || 'Something went wrong.';
  }

  function refresh(after) {
    sb.getProfile(true).then(function (p) {
      prof = p;
      notify();
      if (after) after(p);
    });
  }

  function mount(el, opts) {
    opts = opts || {};
    var u = (w.sb && sb.user()) ? sb.user() : null;
    if (u) {
      el.innerHTML = signedInHTML(prof);
      var out = qs('.auth-out', el);
      if (out) out.onclick = function () {
        out.disabled = true;
        sb.signOut().then(function () {
          prof = null;
          el.innerHTML = '';
          notify();
          if (opts.onSignOut) opts.onSignOut();
          else mount(el, opts);
        }, function () {
          out.disabled = false;
        });
      };
      if (!prof) refresh(opts.after);
    } else {
      el.innerHTML = formHTML(opts.mode || 'in', opts.context);
      bindForm(el, opts.context, opts.after);
    }
  }

  function gate(o) {
    var el = o.el, apps = o.apps || (o.app ? [o.app] : []), ready = false;
    function setApps(h) {
      var i;
      for (i = 0; i < apps.length; i++) if (apps[i]) apps[i].hidden = h;
    }
    function showForm(reason) {
      setApps(true);
      if (el) {
        el.hidden = false;
        mount(el, {
          context: o.context || 'teacher',
          after: function (p) { decide(p); },
          onSignOut: function () { ready = false; showForm(); }
        });
        if (reason) {
          var box = d.createElement('p');
          box.className = 'auth-note';
          box.textContent = reason;
          el.insertBefore(box, el.firstChild);
        }
      }
    }
    function decide(p) {
      if (!p) { showForm(); return; }
      if (o.role && p.role !== o.role) {
        setApps(true);
        if (el) {
          el.hidden = false;
          el.innerHTML = '<div class="auth-denied"><p><b>' +
            (o.role === 'teacher' ? 'This page is for teachers.' : 'This page is for students.') +
            '</b></p><p>Signed in as ' + esc(p.email) + ' (' + esc(p.role) + ').</p>' +
            '<button type="button" class="btn auth-out">Sign out</button></div>';
          var out = qs('.auth-out', el);
          if (out) out.onclick = function () { sb.signOut().then(function () { prof = null; notify(); showForm(); }); };
        }
        return;
      }
      prof = p;
      if (el) {
        if (o.keepAuth) {
          el.hidden = false;
          mount(el, {
            context: o.context || 'teacher',
            after: function (np) { decide(np); },
            onSignOut: function () { ready = false; showForm(); }
          });
        } else {
          el.hidden = true;
        }
      }
      setApps(false);
      notify();
      if (!ready) { ready = true; if (o.onReady) o.onReady(p); }
    }
    if (!w.sb || !sb.configured) {
      showForm('Configuration missing: config.js was not loaded.');
      return;
    }
    if (!sb.user()) { showForm(o.reason); return; }
    sb.getProfile().then(decide, function () { showForm('Could not reach the server.'); });
  }

  w.Auth = {
    profile: function () { return prof; },
    onChange: function (fn) { listeners.push(fn); return function () {}; },
    mount: mount,
    gate: gate,
    refresh: refresh,
    friendly: friendly
  };
})(window, document);
