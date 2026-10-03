/* sb.js · minimal Supabase client (auth + PostgREST) — ES5, no dependencies.
   Everything is protected by Row Level Security on the server. */
(function (w) {
  'use strict';
  var cfg = w.APP_CONFIG || {};
  var BASE = cfg.SUPABASE_URL || '';
  var KEY = cfg.SUPABASE_ANON_KEY || '';
  var SESSION_KEY = 'causative.session';
  var session = null;
  var profile = null;

  function fail(msg, status) { var e = new Error(msg); e.status = status || 0; return e; }

  function bodyError(status, body) {
    var msg = (body && (body.message || body.msg || body.error_description || body.error)) || ('HTTP ' + status);
    if (body && body.error_code) msg = body.msg || body.error_code;
    return fail(msg, status);
  }

  function http(method, path, data, token, prefer) {
    var headers = { 'apikey': KEY, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (prefer) headers.Prefer = prefer;
    return fetch(BASE + path, {
      method: method,
      headers: headers,
      body: (data === undefined || data === null) ? undefined : JSON.stringify(data)
    }).then(function (res) {
      return res.text().then(function (text) {
        var body = null;
        if (text) { try { body = JSON.parse(text); } catch (e) { body = { message: text }; } }
        if (!res.ok) throw bodyError(res.status, body);
        return body;
      });
    });
  }

  function loadSession() {
    if (session) return session;
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (raw) session = JSON.parse(raw);
    } catch (e) { session = null; }
    return session;
  }

  function saveSession(s) {
    session = s;
    if (!s) profile = null;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function sessionFrom(data) {
    var now = Math.floor(new Date().getTime() / 1000);
    var exp = data.expires_at || (now + (parseInt(data.expires_in, 10) || 3600));
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: exp,
      user: data.user || null
    };
  }

  function expiresAt(s) { return (s && s.expires_at ? s.expires_at : 0) * 1000; }

  function ensureFresh() {
    var s = loadSession();
    if (!s || !s.access_token) return Promise.resolve(s);
    if (expiresAt(s) - new Date().getTime() > 60000) return Promise.resolve(s);
    if (!s.refresh_token) return Promise.resolve(s);
    return http('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token })
      .then(function (data) { saveSession(sessionFrom(data)); return session; })
      .catch(function () { saveSession(null); return null; });
  }

  function signIn(email, password) {
    return http('POST', '/auth/v1/token?grant_type=password', { email: email, password: password })
      .then(function (data) { saveSession(sessionFrom(data)); return session; });
  }

  function signUp(email, password, fullName) {
    return http('POST', '/auth/v1/signup', {
      email: email,
      password: password,
      data: { full_name: fullName || '' }
    }).then(function (data) {
      var hasSession = !!(data && data.access_token);
      if (hasSession) saveSession(sessionFrom(data));
      return { confirmed: hasSession, user: (data && data.user) || null };
    });
  }

  function signOut() {
    var s = loadSession();
    var clear = function () { saveSession(null); };
    if (!s || !s.access_token) { clear(); return Promise.resolve(); }
    return http('POST', '/auth/v1/logout', null, s.access_token).then(clear, clear);
  }

  function getProfile(force) {
    var s = loadSession();
    if (!s || !s.user) return Promise.resolve(null);
    if (profile && !force) return Promise.resolve(profile);
    return ensureFresh().then(function (ss) {
      if (!ss) return null;
      return http('GET', '/rest/v1/profiles?select=id,email,full_name,role&id=eq.' +
        encodeURIComponent(s.user.id), null, ss.access_token)
        .then(function (rows) { profile = (rows && rows[0]) || null; return profile; })
        .catch(function () { return profile; });
    });
  }

  /* ---- tiny PostgREST query builder (thenable) ---- */
  function from(table) {
    var q = { table: table, cols: '*', filters: [], order: null, limit: null, method: 'GET', body: null, onConflict: null, prefer: null };
    var api = {
      select: function (cols) { q.method = 'GET'; q.cols = cols || '*'; return api; },
      eq: function (c, v) { q.filters.push(encodeURIComponent(c) + '=eq.' + encodeURIComponent(v)); return api; },
      in: function (c, arr) {
        var vals = [], i;
        for (i = 0; i < arr.length; i++) vals.push(encodeURIComponent(arr[i]));
        q.filters.push(encodeURIComponent(c) + '.=in.(' + vals.join(',') + ')');
        return api;
      },
      order: function (c, desc) { q.order = encodeURIComponent(c) + (desc ? '.desc' : '.asc'); return api; },
      limit: function (n) { q.limit = n; return api; },
      onConflict: function (cols) { q.onConflict = cols; return api; },
      insert: function (rows) {
        q.method = 'POST'; q.body = rows;
        q.prefer = 'return=representation';
        return api;
      },
      upsert: function (rows) {
        q.method = 'POST'; q.body = rows;
        q.prefer = 'return=representation,resolution=merge-duplicates';
        return api;
      },
      update: function (patch) {
        if (q.method === 'GET') q.method = 'PATCH';
        q.body = patch;
        if (!q.prefer) q.prefer = 'return=representation';
        return api;
      },
      'delete': function () { q.method = 'DELETE'; return api; },
      then: function (ok, bad) { return exec(q).then(ok, bad); },
      'catch': function (bad) { return exec(q)['catch'](bad); }
    };
    return api;
  }

  function exec(q) {
    if (!q.filters.length && (q.method === 'PATCH' || q.method === 'DELETE')) {
      return Promise.reject(fail('Refusing to run "' + q.method + '" without filters.', 0));
    }
    return ensureFresh().then(function (s) {
      if (!s || !s.access_token) throw fail('Please sign in.', 401);
      var path = '/rest/v1/' + q.table + '?select=' + encodeURIComponent(q.cols);
      if (q.onConflict) path += '&on_conflict=' + encodeURIComponent(q.onConflict);
      if (q.filters.length) path += '&' + q.filters.join('&');
      if (q.order) path += '&order=' + q.order;
      if (q.limit) path += '&limit=' + q.limit;
      var method = q.method;
      if (method === 'GET') method = 'GET';
      return http(method, path, q.body, s.access_token, q.prefer);
    });
  }

  w.sb = {
    configured: !!(BASE && KEY),
    session: function () { return loadSession(); },
    user: function () { var s = loadSession(); return s ? s.user : null; },
    ensureFresh: ensureFresh,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    getProfile: getProfile,
    from: from,
    loadSession: loadSession,
    saveSession: saveSession
  };
})(window);
