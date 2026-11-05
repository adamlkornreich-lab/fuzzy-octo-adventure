(function () {
  var client = window.Site.client;
  var posts = document.getElementById("posts");

  function show(html) { posts.innerHTML = html; }

  if (!client) {
    show('<p class="notice">Sign-in isn\'t switched on yet. Add the Supabase settings to <code>config.js</code>.</p>');
    return;
  }

  async function load(session) {
    document.getElementById("who").textContent = session.user.email;

    // A password-reset link lands here signed in; let the member set a new password.
    if (location.hash.indexOf("type=recovery") !== -1) {
      var pw = window.prompt("Choose a new password (at least 8 characters):");
      if (pw && pw.length >= 8) {
        var upd = await client.auth.updateUser({ password: pw });
        window.alert(upd.error ? upd.error.message : "Password updated.");
      }
      history.replaceState(null, "", location.pathname);
    }

    // Row-level security means this only returns rows for signed-in users.
    var res = await client.from("member_posts")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false });
    if (res.error) {
      show('<p class="notice error"></p>');
      posts.querySelector("p").textContent = "Couldn't load posts: " + res.error.message;
      return;
    }
    if (!res.data.length) { show('<p class="muted">No posts yet. Check back soon.</p>'); return; }
    posts.innerHTML = "";
    res.data.forEach(function (p) {
      var el = document.createElement("article");
      el.className = "card";
      el.innerHTML = '<h3></h3><time class="muted"></time><p></p>';
      el.querySelector("h3").textContent = p.title;
      el.querySelector("time").textContent = new Date(p.created_at).toLocaleDateString();
      el.querySelector("p").textContent = p.body || "";
      posts.appendChild(el);
    });
  }

  var started = false;
  function handle(session) {
    if (session && !started) { started = true; load(session); }
  }
  // onAuthStateChange also fires once the session from an email link is parsed.
  client.auth.onAuthStateChange(function (_e, session) { handle(session); });
  client.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session) return handle(session);
    // Give an email-link token in the URL a moment to be processed before redirecting.
    var delay = location.hash.indexOf("access_token") !== -1 ? 1500 : 0;
    setTimeout(function () { if (!started) location.replace("login.html"); }, delay);
  });
})();
