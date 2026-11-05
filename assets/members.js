(function () {
  var client = window.Site.client;
  var posts = document.getElementById("posts");
  var who = document.getElementById("who");

  function show(html) { posts.innerHTML = html; }

  if (!client) {
    show('<p class="notice">Sign-in isn\'t switched on yet. Add the Supabase settings to <code>config.js</code>.</p>');
    return;
  }

  var loaded = false;
  var recoveryHandled = false;

  // Supabase consumes the URL hash while it starts up, so a password-reset link
  // is detected from the PASSWORD_RECOVERY auth event, not from location.hash.
  async function handleRecovery() {
    if (recoveryHandled) return;
    recoveryHandled = true;
    var pw = window.prompt("Choose a new password (at least 8 characters):");
    if (pw === null) return;
    if (pw.length < 8) { window.alert("Password must be at least 8 characters. Use Forgot password to try again."); return; }
    var upd = await client.auth.updateUser({ password: pw });
    window.alert(upd.error ? "Couldn't update password: " + upd.error.message : "Password updated.");
  }

  async function load(session) {
    loaded = true;
    who.textContent = session.user.email;
    // Row-level security means this only returns rows for signed-in users.
    var res = await client.from("member_posts")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false });
    if (!loaded) return; // signed out while loading
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

  // Session gone (signed out here or in another tab, or refresh failed):
  // remove member content from the page before leaving it.
  function lost() {
    loaded = false;
    who.textContent = "crew";
    show("");
    location.replace("login.html");
  }

  client.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY") setTimeout(handleRecovery, 0);
    if (event === "SIGNED_OUT" || (!session && loaded)) return lost();
    if (session && !loaded) load(session);
  });

  client.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session) { if (!loaded) load(session); return; }
    // Give an email-link token in the URL a moment to be processed before redirecting.
    var delay = location.hash.indexOf("access_token") !== -1 ? 1500 : 0;
    setTimeout(function () { if (!loaded) location.replace("login.html"); }, delay);
  });
})();
