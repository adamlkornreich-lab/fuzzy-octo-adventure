// Shared: Supabase client, nav sign-in state, sign out.
(function () {
  var cfg = window.SITE_CONFIG || {};
  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  window.Site = {
    configured: configured,
    client: client,
    // Absolute URL of a page next to the current one (works under /repo-name/ on GitHub Pages).
    pageUrl: function (name) { return new URL(name, window.location.href).href.split("#")[0].split("?")[0]; },
  };

  function setNav(signedIn) {
    document.querySelectorAll("[data-auth]").forEach(function (el) {
      el.hidden = (el.getAttribute("data-auth") === "in") !== signedIn;
    });
  }

  document.querySelectorAll("[data-signout]").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      btn.disabled = true;
      if (client) {
        var res = await client.auth.signOut();
        if (res.error) {
          // Server-side sign-out failed (e.g. offline); still clear this browser's session.
          var local = await client.auth.signOut({ scope: "local" });
          if (local.error) {
            btn.disabled = false;
            window.alert("Couldn't sign out: " + local.error.message);
            return;
          }
        }
      }
      window.location.href = "./";
    });
  });

  if (!client) { setNav(false); return; }
  client.auth.getSession().then(function (res) { setNav(!!(res.data && res.data.session)); });
  client.auth.onAuthStateChange(function (_event, session) { setNav(!!session); });
})();
