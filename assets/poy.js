/* Pirates of Ybor app layer: accounts, store purchases, score sync, the 21+ gate,
   fresh trivia and the Quartermaster. Loaded in <head> on every page, right after
   poy-config.js. Everything here is optional: if the backend isn't configured or the
   player is offline, every game still plays exactly as before with on-device saves.
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
(function () {
  "use strict";
  var C = window.POY_CONFIG || {};
  var me = document.currentScript;
  var ROOT = me && me.src ? new URL("../", me.src).href : location.origin + "/";
  var Cap = window.Capacitor;
  var NATIVE = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var PLATFORM = NATIVE ? Cap.getPlatform() : "web";
  var STORE = !NATIVE ? "web" : PLATFORM === "ios" ? "apple" : (C.androidStore || "google");
  /* APP mode. "cloud" (the default, and what any unknown value means) uses the real backend.
     "local" is a test mode with no sign-in: a fixed local player, data kept only on this device,
     store items unlocked by a test button. It only switches on at localhost or inside a
     developer build of the app; at thepiratesofybor.com it is ignored and cloud rules apply. */
  var LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === "file:";
  var MODE = C.mode === "local" && (LOCAL_HOST || NATIVE) ? "local" : "cloud";
  var LOCAL = MODE === "local";
  if (C.mode === "local" && !LOCAL && window.console) console.warn("Pirates of Ybor: test mode ignored on " + location.hostname + "; using normal sign-in.");
  // Test unlocks are cached separately, so they can never unlock anything in normal mode.
  var ENT_KEY = LOCAL ? "poy-ent-local" : "poy-ent";
  var ENABLED = LOCAL || !!(C.supabaseUrl && C.supabaseAnonKey);
  var CALLBACK = (C.appScheme || "com.raconsulting.piratesofybor") + "://auth-callback";
  var PATH = location.pathname;

  var PRODUCTS = {
    poy_course_pack: { name: "Ybor Links Back Nine", blurb: "Nine new holes for Andy Seavy Golf Club.", price: "$2.99", type: "NON_SUBSCRIPTION" },
    poy_tournament_entry: { name: "Tournament Entry", blurb: "One ticket into a bar tournament night.", price: "", type: "NON_SUBSCRIPTION" },
    poy_crew_pass_monthly: { name: "Crew Pass", blurb: "Extra trivia packs with new questions every night, plus premium games as they launch. Monthly; cancel any time in your store settings.", price: "", type: "SUBSCRIPTION" }
  };

  /* ---------- small helpers ---------- */
  var mem = {};
  var rawSet = Storage.prototype.setItem;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] == null ? null : mem[k]; } }
  function lsSet(k, v) { mem[k] = String(v); try { rawSet.call(localStorage, k, String(v)); } catch (e) {} }
  function lsJSON(k, d) { try { var v = lsGet(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }
  function err(code, text) { var e = new Error(code); e.code = code; if (text) e.text = text; return e; }
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {} }

  /* ---------- Capacitor plugins without a bundler ---------- */
  function plug(name) {
    return {
      call: function (method, opts) {
        if (!NATIVE) return Promise.reject(err("not_native"));
        var P = Cap.Plugins && Cap.Plugins[name];
        if (P && typeof P[method] === "function") return P[method](opts || {});
        return Cap.nativePromise(name, method, opts || {});
      },
      on: function (eventName, cb) {
        if (!NATIVE) return;
        var P = Cap.Plugins && Cap.Plugins[name];
        if (P && P.addListener) return P.addListener(eventName, cb);
        return Cap.nativeCallback(name, "addListener", { eventName: eventName }, cb);
      }
    };
  }
  var Browser = plug("Browser"), App = plug("App"), Purchases = plug("Purchases"), AppleSignIn = plug("SignInWithApple");

  /* ---------- Supabase client (loaded on demand) ---------- */
  var clientP = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(err("offline")); };
      (document.head || document.documentElement).appendChild(s);
    });
  }
  /* ---------- test mode: a tiny on-device stand-in for Supabase ---------- */
  var LOCAL_USER = { id: "00000000-0000-0000-0000-000000000001", email: "local@localhost", user_metadata: { full_name: "Local Pirate" } };
  var LOCAL_SESSION = { access_token: "local", user: LOCAL_USER };
  function localDb() {
    var KEY = "poy-local-db";
    function load() {
      var d = lsJSON(KEY, null);
      if (!d) d = { profiles: [{ id: LOCAL_USER.id, display_name: "Local Pirate", avatar: "🏴‍☠️", created_at: new Date().toISOString() }], scores: [], entitlements: [], questions: [], admins: [{ user_id: LOCAL_USER.id }] };
      return d;
    }
    function save(d) { lsSet(KEY, JSON.stringify(d)); }
    function bestView(d) {
      var by = {};
      d.scores.forEach(function (r) {
        var b = by[r.game], golfish = r.game.indexOf("golf") === 0;
        if (!b) by[r.game] = { game: r.game, best: r.score, last_played: r.created_at };
        else {
          if (golfish ? r.score < b.best : r.score > b.best) b.best = r.score;
          if (r.created_at > b.last_played) b.last_played = r.created_at;
        }
      });
      return Object.keys(by).map(function (k) { return by[k]; });
    }
    function from(table) {
      var st = { op: "select", payload: null, filters: [], order: null, limit: null, single: false, head: false, count: false };
      var api = {
        select: function (cols, o) { if (o && o.head) st.head = true; if (o && o.count) st.count = true; return api; },
        eq: function (c, v) { st.filters.push(function (r) { return r[c] === v; }); return api; },
        is: function (c, v) { st.filters.push(function (r) { return (r[c] == null ? null : r[c]) === v; }); return api; },
        in: function (c, vs) { st.filters.push(function (r) { return vs.indexOf(r[c]) !== -1; }); return api; },
        order: function (c, o) { st.order = [c, !(o && o.ascending === false)]; return api; },
        limit: function (n) { st.limit = n; return api; },
        maybeSingle: function () { st.single = true; return api; },
        insert: function (p) { st.op = "insert"; st.payload = p; return api; },
        upsert: function (p) { st.op = "upsert"; st.payload = p; return api; },
        update: function (p) { st.op = "update"; st.payload = p; return api; },
        delete: function () { st.op = "delete"; return api; },
        then: function (res, rej) { return Promise.resolve().then(run).then(res, rej); }
      };
      function match(r) { return st.filters.every(function (f) { return f(r); }); }
      function run() {
        var d = load(), now = new Date().toISOString();
        if (table === "my_best_scores") d.my_best_scores = bestView(d);
        var rows = d[table] || (d[table] = []);
        var stamp = function (r) { var x = Object.assign({}, r); if (!x.created_at) x.created_at = now; if (table !== "profiles" && x.user_id === undefined && table !== "questions") x.user_id = LOCAL_USER.id; if (table === "questions" && !x.id) x.id = "local-" + Math.random().toString(36).slice(2); return x; };
        if (st.op === "insert") { [].concat(st.payload).forEach(function (r) { rows.push(stamp(r)); }); save(d); return { data: null, error: null }; }
        if (st.op === "upsert") {
          [].concat(st.payload).forEach(function (r) {
            var k = table === "profiles" ? "id" : "id", i = r[k] != null ? rows.findIndex(function (x) { return x[k] === r[k]; }) : -1;
            if (i >= 0) rows[i] = Object.assign(rows[i], r); else rows.push(stamp(r));
          });
          save(d); return { data: null, error: null };
        }
        if (st.op === "update") { rows.forEach(function (r) { if (match(r)) Object.assign(r, st.payload); }); save(d); return { data: null, error: null }; }
        if (st.op === "delete") { d[table] = rows.filter(function (r) { return !match(r); }); save(d); return { data: null, error: null }; }
        var out = rows.filter(match);
        if (st.order) { var c = st.order[0], asc = st.order[1]; out = out.slice().sort(function (a, b) { return (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1); }); }
        var count = out.length;
        if (st.limit != null) out = out.slice(0, st.limit);
        if (st.head) return { data: null, count: count, error: null };
        return { data: st.single ? (out[0] || null) : out, count: count, error: null };
      }
      return api;
    }
    function rpc(name, args) {
      var d = load(), now = new Date();
      var active = function (r) { return !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > now); };
      if (name === "is_admin") return Promise.resolve({ data: true, error: null });
      if (name === "has_entitlement") return Promise.resolve({ data: d.entitlements.some(function (r) { return r.product_id === args.p_product && active(r); }), error: null });
      if (name === "use_tournament_entry") {
        var t = d.entitlements.filter(function (r) { return r.product_id === "poy_tournament_entry" && active(r); })[0];
        if (t) { t.consumed_at = now.toISOString(); save(d); }
        return Promise.resolve({ data: !!t, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }
    var listeners = [];
    return {
      auth: {
        getSession: function () { return Promise.resolve({ data: { session: LOCAL_SESSION } }); },
        onAuthStateChange: function (cb) { listeners.push(cb); return { data: { subscription: { unsubscribe: function () {} } } }; },
        signOut: function () { return Promise.resolve({ error: null }); },
        exchangeCodeForSession: function () { return Promise.resolve({ error: null }); }
      },
      from: from, rpc: rpc, _reset: function () { lsSet(KEY, ""); }
    };
  }

  function client() {
    if (LOCAL) {
      if (!clientP) {
        var db = localDb();
        clientP = Promise.resolve(db);
        setTimeout(function () { emit("poy:auth", { event: "INITIAL_SESSION", user: LOCAL_USER }); afterSignIn(LOCAL_USER); }, 0);
      }
      return clientP;
    }
    if (!ENABLED) return Promise.reject(err("not_configured"));
    if (clientP) return clientP;
    var src = /^https?:/.test(C.supabaseJs || "") ? C.supabaseJs : ROOT + (C.supabaseJs || "assets/vendor/supabase.js");
    clientP = (window.supabase && window.supabase.createClient ? Promise.resolve() : loadScript(src)).then(function () {
      var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
        auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: !NATIVE, storageKey: "poy-auth" }
      });
      sb.auth.onAuthStateChange(function (event, session) {
        emit("poy:auth", { event: event, user: session ? session.user : null });
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) afterSignIn(session.user);
      });
      return sb;
    });
    clientP.catch(function () { clientP = null; });
    return clientP;
  }
  function session() {
    return client().then(function (sb) { return sb.auth.getSession(); }).then(function (r) { return r.data.session; }).catch(function () { return null; });
  }
  function user() { return session().then(function (s) { return s ? s.user : null; }); }
  function fnUrl(name) { return C.supabaseUrl.replace(/\/$/, "") + "/functions/v1/" + name; }
  function callFn(name, body, opts) {
    if (LOCAL) return Promise.reject(err("local_mode"));
    return session().then(function (s) {
      if (!s) throw err("signin");
      return fetch(fnUrl(name), {
        method: "POST", signal: opts && opts.signal,
        headers: { Authorization: "Bearer " + s.access_token, apikey: C.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
      });
    });
  }

  /* ---------- sign-in ---------- */
  function webRedirect() { return ROOT + "account/index.html"; }
  function randomNonce() {
    var a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function sha256hex(s) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    });
  }
  function signIn(provider) {
    if (LOCAL) return client().then(function () { return LOCAL_USER; });
    if (provider === "tiktok" || provider === "samsung") return Promise.reject(err("unsupported"));
    return client().then(function (sb) {
      // iPhone: native Sign in with Apple sheet, then hand the token to Supabase.
      if (provider === "apple" && PLATFORM === "ios") {
        var raw = randomNonce();
        return sha256hex(raw).then(function (hashed) {
          return AppleSignIn.call("authorize", { clientId: "com.raconsulting.piratesofybor", redirectURI: CALLBACK, scopes: "email name", nonce: hashed });
        }).then(function (r) {
          var resp = r.response || r;
          return sb.auth.signInWithIdToken({ provider: "apple", token: resp.identityToken, nonce: raw }).then(function (out) {
            if (out.error) throw out.error;
            var name = [resp.givenName, resp.familyName].filter(Boolean).join(" ");
            if (name) sb.from("profiles").update({ display_name: name.slice(0, 40) }).eq("id", out.data.user.id).then(function () {});
            return out.data.user;
          });
        });
      }
      if (NATIVE) {
        // Android and other providers: open the provider in the system browser; it returns to the app by deep link.
        return sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: CALLBACK, skipBrowserRedirect: true } }).then(function (r) {
          if (r.error) throw r.error;
          return Browser.call("open", { url: r.data.url, presentationStyle: "popover" });
        });
      }
      return sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: webRedirect() } }).then(function (r) { if (r.error) throw r.error; });
    });
  }
  if (NATIVE && ENABLED && !LOCAL) {
    App.on("appUrlOpen", function (ev) {
      var url = ev && ev.url;
      if (!url || url.indexOf(CALLBACK) !== 0) return;
      var q = new URL(url.replace(CALLBACK, "https://cb.local/"));
      var code = q.searchParams.get("code");
      Browser.call("close").catch(function () {});
      if (!code) { emit("poy:auth-error", { message: q.searchParams.get("error_description") || "Sign-in was cancelled." }); return; }
      client().then(function (sb) { return sb.auth.exchangeCodeForSession(code); }).then(function (r) {
        if (r.error) emit("poy:auth-error", { message: r.error.message });
        else if (PATH.indexOf("/account/") === -1) location.href = ROOT + "account/index.html";
      });
    });
  }
  function signOut() {
    if (LOCAL) return Promise.resolve({ error: null }); // test mode always plays as the local pirate
    return client().then(function (sb) {
      if (NATIVE && rcReady) Purchases.call("logOut").catch(function () {});
      lsSet(ENT_KEY, "[]");
      return sb.auth.signOut();
    });
  }
  function deleteAccount() {
    if (LOCAL) return client().then(function (sb) { sb._reset(); lsSet(ENT_KEY, "[]"); lsSet("poy-synced", "{}"); return true; });
    return callFn("delete-account").then(function (res) {
      if (!res.ok) throw err("delete_failed");
      return client().then(function (sb) { return sb.auth.signOut({ scope: "local" }); }).then(function () {
        lsSet(ENT_KEY, "[]"); lsSet("poy-synced", "{}");
        return true;
      });
    });
  }

  /* ---------- entitlements ---------- */
  function entList() { return lsJSON(ENT_KEY, []); }
  function activeRow(r) { return !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > new Date()); }
  function hasSync(product) { if (C.openPlay && product !== "poy_tournament_entry") return true; return entList().some(function (r) { return r.product_id === product && activeRow(r); }); }
  function tournamentEntries() { return entList().filter(function (r) { return r.product_id === "poy_tournament_entry" && activeRow(r); }).length; }
  function refreshEntitlements() {
    return client().then(function (sb) {
      return sb.from("entitlements").select("product_id,expires_at,consumed_at,source");
    }).then(function (r) {
      if (r.error) throw r.error;
      var rows = r.data || [];
      // Keep anything the store just confirmed that the webhook hasn't written yet.
      entList().forEach(function (x) { if (x.source === "device" && activeRow(x) && !rows.some(function (y) { return y.product_id === x.product_id && activeRow(y); })) rows.push(x); });
      lsSet(ENT_KEY, JSON.stringify(rows)); emit("poy:entitlements", rows); return rows;
    }).catch(function () { return entList(); });
  }
  function mergeCustomerInfo(info) {
    var ci = (info && info.customerInfo) || info || {};
    var rows = entList().filter(function (r) { return r.source !== "device"; });
    var subs = ci.activeSubscriptions || [];
    subs.forEach(function (id) {
      var pid = String(id).split(":")[0];
      var exp = ci.allExpirationDates && ci.allExpirationDates[id];
      rows.push({ product_id: pid, expires_at: exp || null, consumed_at: null, source: "device" });
    });
    (ci.nonSubscriptionTransactions || []).forEach(function (t) {
      if (t.productIdentifier === "poy_course_pack") rows.push({ product_id: "poy_course_pack", expires_at: null, consumed_at: null, source: "device" });
    });
    lsSet(ENT_KEY, JSON.stringify(rows)); emit("poy:entitlements", rows);
  }

  /* ---------- store purchases (RevenueCat) ---------- */
  var rcReady = null;
  function purchasesAvailable() {
    if (LOCAL) return true; // test unlocks, no store and no money
    if (!NATIVE) return false;
    if (STORE === "samsung") return false; // Galaxy Store needs Samsung IAP; not wired up yet.
    var k = C.revenuecat || {};
    return !!(STORE === "apple" ? k.apple : STORE === "amazon" ? k.amazon : k.google);
  }
  function rcInit(uid) {
    if (!purchasesAvailable()) return Promise.reject(err("purchases_unavailable"));
    if (rcReady) return rcReady.then(function () { return uid ? Purchases.call("logIn", { appUserID: uid }) : null; });
    var k = C.revenuecat;
    var key = STORE === "apple" ? k.apple : STORE === "amazon" ? k.amazon : k.google;
    var opts = { apiKey: key }; if (uid) opts.appUserID = uid; if (STORE === "amazon") opts.useAmazon = true;
    rcReady = Purchases.call("configure", opts);
    rcReady.catch(function () { rcReady = null; });
    return rcReady;
  }
  function buy(productId) {
    var p = PRODUCTS[productId]; if (!p) return Promise.reject(err("unknown_product"));
    if (LOCAL) {
      return client().then(function (sb) {
        var exp = p.type === "SUBSCRIPTION" ? new Date(Date.now() + 30 * 86400000).toISOString() : null;
        return sb.from("entitlements").insert({ product_id: productId, source: "test", transaction_id: "test-" + Date.now(), expires_at: exp });
      }).then(refreshEntitlements).then(function () { return true; });
    }
    return user().then(function (u) {
      if (!u) throw err("signin"); // purchases are tied to an account so they follow the player to new devices
      return rcInit(u.id);
    }).then(function () {
      return Purchases.call("getProducts", { productIdentifiers: [productId], type: p.type });
    }).then(function (r) {
      var prod = (r.products || [])[0]; if (!prod) throw err("not_in_store");
      return Purchases.call("purchaseStoreProduct", { product: prod });
    }).then(function (r) {
      mergeCustomerInfo(r);
      if (productId === "poy_tournament_entry") {
        var rows = entList(); rows.push({ product_id: productId, expires_at: null, consumed_at: null, source: "device" });
        lsSet(ENT_KEY, JSON.stringify(rows));
      }
      setTimeout(refreshEntitlements, 4000);
      return true;
    }).catch(function (e) {
      if (e && (e.userCancelled || e.code === "1" || /cancel/i.test(e.message || ""))) throw err("cancelled");
      throw e;
    });
  }
  function restore() {
    if (LOCAL) return refreshEntitlements();
    return user().then(function (u) {
      if (!u) throw err("signin");
      return rcInit(u.id);
    }).then(function () { return Purchases.call("restorePurchases"); }).then(function (r) {
      mergeCustomerInfo(r); return refreshEntitlements();
    });
  }
  function useTournamentEntry() {
    return client().then(function (sb) { return sb.rpc("use_tournament_entry"); }).then(function (r) {
      if (r.error) throw r.error; refreshEntitlements(); return !!r.data;
    });
  }
  function prices() {
    if (LOCAL) { var t = {}; Object.keys(PRODUCTS).forEach(function (id) { t[id] = "(test, free)"; }); return Promise.resolve(t); }
    if (!purchasesAvailable()) return Promise.resolve({});
    return rcInit().then(function () {
      return Promise.all(Object.keys(PRODUCTS).map(function (id) {
        return Purchases.call("getProducts", { productIdentifiers: [id], type: PRODUCTS[id].type }).then(function (r) {
          var p = (r.products || [])[0]; return [id, p ? p.priceString : ""];
        }).catch(function () { return [id, ""]; });
      }));
    }).then(function (pairs) { var o = {}; pairs.forEach(function (p) { o[p[0]] = p[1]; }); return o; }).catch(function () { return {}; });
  }

  /* ---------- score sync: on-device saves → scores table when signed in ---------- */
  var GAME_KEYS = { "agc-best": "golf", "wak-best": "kraken", "pour-best": "pour-off", "poy-best": "trivia", "doubloons": "arcade-doubloons" };
  function scoresFrom(key, value) {
    var game = GAME_KEYS[key], out = [], v = value;
    try { v = JSON.parse(value); } catch (e) {}
    if (typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(+v))) out.push([game, +v]);
    else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { if (typeof v[k] === "number") out.push([game + ":" + k, v[k]]); });
    return out.filter(function (s) { return isFinite(s[1]); });
  }
  var pending = {}, flushT = null, signedIn = false;
  // Golf is strokes to par (lower wins); doubloons are a balance, so any change counts.
  function better(game, a, b) { return game === "arcade-doubloons" ? a !== b : game.indexOf("golf") === 0 ? a < b : a > b; }
  function queueScores(key, value) {
    if (!GAME_KEYS[key]) return;
    scoresFrom(key, value).forEach(function (s) { pending[s[0]] = s[1]; });
    if (signedIn) { clearTimeout(flushT); flushT = setTimeout(flushScores, 1500); }
  }
  function flushScores() {
    var synced = lsJSON("poy-synced", {}), rows = [];
    Object.keys(pending).forEach(function (g) {
      if (synced[g] == null || better(g, pending[g], synced[g])) rows.push({ game: g.slice(0, 80), score: pending[g] });
      else delete pending[g];
    });
    if (!rows.length) return Promise.resolve();
    return client().then(function (sb) { return sb.from("scores").insert(rows); }).then(function (r) {
      if (r.error) return;
      rows.forEach(function (x) { synced[x.game] = x.score; delete pending[x.game]; });
      lsSet("poy-synced", JSON.stringify(synced));
    }).catch(function () {});
  }
  Storage.prototype.setItem = function (k, v) {
    rawSet.apply(this, arguments);
    try { if (this === window.localStorage) queueScores(k, String(v)); } catch (e) {}
  };
  var OBJ_KEYS = { "poy-best": 1, "pour-best": 1 }; // saved as { category or player: best }
  function pullScores() {
    // A new device, or a better score made elsewhere: bring the best one here.
    return client().then(function (sb) { return sb.from("my_best_scores").select("game,best"); }).then(function (r) {
      if (r.error || !r.data) return;
      var synced = lsJSON("poy-synced", {}), objs = {}, changed = {};
      Object.keys(OBJ_KEYS).forEach(function (k) { var v = lsJSON(k, null); objs[k] = v && typeof v === "object" ? v : {}; });
      r.data.forEach(function (row) {
        var best = +row.best, cut = row.game.indexOf(":"), base = cut < 0 ? row.game : row.game.slice(0, cut), sub = cut < 0 ? "" : row.game.slice(cut + 1);
        synced[row.game] = best;
        var key = Object.keys(GAME_KEYS).filter(function (k) { return GAME_KEYS[k] === base; })[0];
        if (!key) return;
        if (OBJ_KEYS[key]) {
          if (!sub) return;
          var o = objs[key];
          if (typeof o[sub] !== "number" || better(row.game, best, o[sub])) { o[sub] = best; changed[key] = 1; }
          return;
        }
        if (sub) return;
        var local = scoresFrom(key, lsGet(key) == null ? "" : lsGet(key))[0];
        if (!local || (base !== "arcade-doubloons" && better(row.game, best, local[1]))) lsSet(key, String(best));
      });
      Object.keys(changed).forEach(function (k) { lsSet(k, JSON.stringify(objs[k])); });
      lsSet("poy-synced", JSON.stringify(synced));
    }).catch(function () {});
  }
  function afterSignIn(u) {
    if (signedIn) return; signedIn = true;
    Object.keys(GAME_KEYS).forEach(function (k) { var v = lsGet(k); if (v != null) queueScores(k, v); });
    pullScores().then(flushScores);
    refreshEntitlements();
    if (purchasesAvailable() && !LOCAL) rcInit(u.id).then(function () { return Purchases.call("getCustomerInfo"); }).then(mergeCustomerInfo).catch(function () {});
  }
  // Wake the session on every page so saves sync quietly in the background.
  if (ENABLED && (LOCAL || lsGet("poy-auth"))) setTimeout(function () { client().catch(function () {}); }, 400);

  /* ---------- 21+ gate for drink-themed games ---------- */
  var GATED = /\/(pour-off|tavern|tavern-hall|tavern-arcade|tournament)\/|\/games\/(pour-off|tavern-games)\.html$/;
  function is21() { return lsGet("poy-21") === "yes"; }
  function ageGate(onPass) {
    if (is21()) { if (onPass) onPass(); return; }
    ready(function () {
      if (document.getElementById("poy-gate")) return;
      var d = document.createElement("div"); d.id = "poy-gate"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "poy-gate-h");
      d.innerHTML = '<div class="poy-gate-card"><img src="' + ROOT + 'assets/watermark.png" alt="" width="96" height="98">' +
        '<h2 id="poy-gate-h">Are you 21 or older?</h2><p>This game is about pouring drinks and bar games. It is for adults 21 and up. Please play responsibly.</p>' +
        '<div class="poy-gate-btns"><button type="button" data-y>Yes, I\'m 21+</button><button type="button" data-n>No, take me back</button></div></div>';
      document.body.appendChild(d);
      d.querySelector("[data-y]").focus();
      d.querySelector("[data-y]").onclick = function () { lsSet("poy-21", "yes"); d.remove(); if (onPass) onPass(); };
      d.querySelector("[data-n]").onclick = function () { location.href = ROOT + "index.html"; };
    });
  }
  if (GATED.test(PATH)) ageGate();

  /* ---------- fresh trivia from the questions table ---------- */
  var Q_KEY = "poy-q-cache", Q_TTL = 12 * 3600 * 1000;
  var EMOJI = { "Movies": "🎬", "Science": "🔬", "Famous People": "⭐", "World": "🌍", "Sports": "⚽", "History": "📜", "Animals": "🐾", "Pirates": "🏴‍☠️", "Florida Pirate Trail": "🌴", "Silver Screen Deep Cuts": "🎞️", "Ybor After Dark": "🌙" };
  function bare(k) { return String(k).replace(/^[^A-Za-z]+/, "").trim().toLowerCase(); }
  function refreshQuestions(force) {
    var c = lsJSON(Q_KEY, null);
    if (!force && c && Date.now() - c.at < Q_TTL) return Promise.resolve(c.items);
    return client().then(function (sb) {
      return sb.from("questions").select("id,category,question,options,correct_index,explanation,tone,premium").eq("status", "approved").order("created_at", { ascending: false }).limit(600);
    }).then(function (r) {
      if (r.error) throw r.error;
      lsSet(Q_KEY, JSON.stringify({ at: Date.now(), items: r.data || [] })); return r.data || [];
    }).catch(function () { return c ? c.items : []; });
  }
  var trivia = {
    /* Adds approved server questions to a page's built-in deck, synchronously from the cache.
       D is { "🎬 Movies": [[question, correct, [wrong, wrong, wrong]], ...], ... } */
    extend: function (D) {
      var c = lsJSON(Q_KEY, null); if (!c || !c.items) return D;
      var keys = {}; Object.keys(D).forEach(function (k) { keys[bare(k)] = k; });
      c.items.forEach(function (q) {
        if (q.tone === "flirty" && !is21()) return;
        var opts = q.options || [], right = opts[q.correct_index];
        if (opts.length !== 4 || right == null) return;
        var key = keys[bare(q.category)];
        if (!key) { key = (EMOJI[q.category] || "🎟️") + " " + q.category; keys[bare(q.category)] = key; D[key] = []; }
        var item = [q.question, right, opts.filter(function (o, i) { return i !== q.correct_index; })];
        item.poyId = q.id; D[key].push(item);
      });
      return D;
    },
    answered: function (item, correct) {
      if (!item || !item.poyId || !ENABLED) return;
      client().then(function (sb) { return sb.rpc("record_answer", { p_question: item.poyId, p_correct: !!correct }); }).catch(function () {});
    },
    refresh: refreshQuestions
  };
  if (ENABLED && /\/(trivia|game-deck|play)\/|\/index\.html$|\/$/.test(PATH)) setTimeout(function () { refreshQuestions(false); }, 1200);

  /* ---------- Andy Seavy Golf Club course pack ---------- */
  var golf = {
    course: function () {
      var want = new URLSearchParams(location.search).get("course");
      return want === "ybor-links" && hasSync("poy_course_pack") ? "ybor-links" : "skull-cove";
    }
  };
  if (/\/golf\/|andy-golf-club\.html$/.test(PATH)) ready(function () {
    var owned = hasSync("poy_course_pack"), on = golf.course() === "ybor-links";
    var a = document.createElement("a"); a.className = "poy-course";
    if (on) { a.href = location.pathname; a.textContent = "⛳ Playing Ybor Links · switch to Skull Cove"; }
    else if (owned) { a.href = location.pathname + "?course=ybor-links"; a.textContent = "⛳ Play the Ybor Links Back Nine"; }
    else { a.href = ROOT + "account/index.html#shop"; a.textContent = "⛳ Ybor Links Back Nine 🔒"; }
    document.body.appendChild(a);
    // Out of the way once the round starts: the first tap anywhere else hides it.
    document.addEventListener("pointerdown", function hide(e) {
      if (e.target === a) return;
      a.remove(); document.removeEventListener("pointerdown", hide, true);
    }, true);
  });

  /* ---------- the Quartermaster on /play, through the Pirates of Ybor server ---------- */
  function makeSample() {
    var sample = function (messages, opts) {
      opts = opts || {};
      var text = "";
      return callFn("ask-quartermaster", { mode: "chat", messages: messages }, { signal: opts.signal }).then(function (res) {
        if (res.status === 401) throw err("signin");
        if (res.status === 429) throw err("rate_limited");
        if (!res.ok || !res.body) throw err("network");
        var reader = res.body.getReader(), dec = new TextDecoder();
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return { text: text };
            text += dec.decode(r.value, { stream: true });
            if (opts.onText) opts.onText({ text: text });
            return pump();
          });
        }
        return pump();
      }).catch(function (e) {
        if (e && e.name === "AbortError") throw err("cancelled", text);
        if (e && e.code) { if (text && !e.text) e.text = text; throw e; }
        throw err("network", text);
      });
    };
    sample.json = function (prompt, opts) {
      return callFn("ask-quartermaster", { mode: "json", prompt: prompt }, opts).then(function (res) {
        if (res.status === 401) throw err("signin");
        if (res.status === 429) throw err("rate_limited");
        if (!res.ok) throw err("network");
        return res.json();
      }).then(function (d) {
        var t = String(d.text || "").replace(/```(?:json)?/g, "").trim();
        var s = t.search(/[\[{]/), e = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
        try { return JSON.parse(t.slice(s, e + 1)); } catch (x) { throw err("invalid_json"); }
      });
    };
    return sample;
  }
  if (ENABLED && !LOCAL && !window.poyAssistant && /\/play\//.test(PATH)) {
    window.POY_SERVER_AI = true;
    window.poyAssistant = {
      use: function (name) { return name === "sample" ? Promise.resolve(makeSample()) : Promise.reject(err("not_granted")); }
    };
  }

  /* ---------- shared styles for the gate, course pill and store badges ---------- */
  var css = ".poy-testmode{position:fixed;left:0;top:22%;z-index:2147483100;writing-mode:vertical-rl;transform:rotate(180deg);background:#7a1f1f;color:#fff;border-radius:0 8px 8px 0;padding:10px 4px;font:700 10px/1 system-ui,sans-serif;letter-spacing:.08em;pointer-events:none;opacity:.9}" +
    "#poy-gate{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:rgba(5,12,18,.92);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
    ".poy-gate-card{max-width:380px;width:100%;text-align:center;background:#0f2433;border:1px solid #e0b05666;border-radius:18px;padding:22px 18px;color:#f3ead7;font:17px/1.5 Georgia,serif;box-shadow:0 20px 60px #000a}" +
    ".poy-gate-card h2{margin:6px 0;color:#e0b056;font:400 1.8rem/1.1 'Pirata One',Georgia,serif}.poy-gate-card p{margin:0 0 14px;color:#d9ceb6}" +
    ".poy-gate-btns{display:grid;gap:10px}.poy-gate-btns button{min-height:48px;border-radius:12px;border:0;font:700 1rem Georgia,serif;cursor:pointer}" +
    ".poy-gate-btns [data-y]{background:#e0b056;color:#1b1305}.poy-gate-btns [data-n]{background:transparent;color:#f3ead7;border:1px solid #28495b}" +
    ".poy-gate-btns button:focus-visible{outline:3px solid #3fb6a8;outline-offset:2px}" +
    ".poy-course{position:fixed;left:50%;transform:translateX(-50%);top:calc(72px + env(safe-area-inset-top,0px));z-index:2147482400;background:rgba(8,20,30,.9);color:#e0b056;border:1px solid #e0b05666;border-radius:999px;padding:8px 14px;font:600 13px/1.2 Georgia,serif;text-decoration:none;white-space:nowrap;max-width:calc(100vw - 150px);overflow:hidden;text-overflow:ellipsis}";
  var st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  /* ---------- test-mode badge, so it can never be mistaken for the real thing ---------- */
  if (LOCAL) ready(function () {
    var b = document.createElement("div"); b.className = "poy-testmode"; b.setAttribute("role", "note");
    b.textContent = "🧪 TEST MODE"; b.title = "Test mode: no sign-in, nothing leaves this device";
    document.body.appendChild(b);
  });

  window.POY = {
    mode: MODE, localUser: LOCAL ? LOCAL_USER : null,
    config: C, root: ROOT, native: NATIVE, platform: PLATFORM, store: STORE, enabled: ENABLED,
    products: PRODUCTS, client: client, session: session, user: user,
    signIn: signIn, signOut: signOut, deleteAccount: deleteAccount,
    hasSync: hasSync, tournamentEntries: tournamentEntries, refreshEntitlements: refreshEntitlements,
    purchasesAvailable: purchasesAvailable, buy: buy, restore: restore, prices: prices, useTournamentEntry: useTournamentEntry,
    is21: is21, ageGate: ageGate, trivia: trivia, golf: golf, flushScores: flushScores
  };
})();

/* Load the shared audio experience on every web page and in the native app. */
(function () {
  var me = document.currentScript;
  if (!me || !me.src || document.querySelector('script[data-poy-audio]')) return;
  var s = document.createElement('script');
  s.src = new URL('./poy-audio.js', me.src).href;
  s.setAttribute('data-poy-audio', '');
  (document.head || document.documentElement).appendChild(s);
})();
