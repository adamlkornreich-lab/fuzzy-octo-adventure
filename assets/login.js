(function () {
  var client = window.Site.client;
  var form = document.getElementById("auth-form");
  var submit = document.getElementById("submit");
  var forgot = document.getElementById("forgot");
  var msg = document.getElementById("msg");
  var mode = location.hash === "#signup" ? "signup" : "signin";

  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle("error", !!isError);
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll("[data-tab]").forEach(function (t) {
      t.setAttribute("aria-selected", String(t.dataset.tab === mode));
    });
    submit.textContent = mode === "signup" ? "Create account" : "Sign in";
    form.password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    forgot.hidden = mode === "signup";
    say("");
  }

  document.querySelectorAll("[data-tab]").forEach(function (t) {
    t.addEventListener("click", function () { setMode(t.dataset.tab); });
  });
  setMode(mode);

  if (!client) {
    document.getElementById("not-configured").hidden = false;
    form.querySelectorAll("input, button").forEach(function (el) { el.disabled = true; });
    return;
  }

  // Already signed in → straight to the members page.
  client.auth.getSession().then(function (res) {
    if (res.data && res.data.session) location.href = "members.html";
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    var password = form.password.value;
    if (!email || !form.email.checkValidity()) return say("Enter a valid email address.", true);
    if (password.length < 8) return say("Password must be at least 8 characters.", true);

    submit.disabled = true;
    say(mode === "signup" ? "Creating your account…" : "Signing in…");
    try {
      if (mode === "signup") {
        var up = await client.auth.signUp({
          email: email, password: password,
          options: { emailRedirectTo: window.Site.pageUrl("members.html") },
        });
        if (up.error) throw up.error;
        if (up.data.session) { location.href = "members.html"; return; }
        say("Check your email for a confirmation link to finish signing up.");
      } else {
        var res = await client.auth.signInWithPassword({ email: email, password: password });
        if (res.error) throw res.error;
        location.href = "members.html";
      }
    } catch (err) {
      say(err.message || "Something went wrong. Try again.", true);
    } finally {
      submit.disabled = false;
    }
  });

  forgot.addEventListener("click", async function () {
    var email = form.email.value.trim();
    if (!email || !form.email.checkValidity()) return say("Enter your email above, then click Forgot password.", true);
    var res = await client.auth.resetPasswordForEmail(email, { redirectTo: window.Site.pageUrl("members.html") });
    say(res.error ? res.error.message : "If that email has an account, a reset link is on its way.", !!res.error);
  });
})();
