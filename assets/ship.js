/* Pirates of Ybor shared ship bar + watermark.
   Add to any page with: <script src="/assets/ship.js" defer></script>
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
(function () {
  var here = location.pathname.replace(/index\.html$/, "");
  var me = document.currentScript;
  var root = (me && me.getAttribute("data-root")) || "/";
  var gameMode = me && me.getAttribute("data-mode") === "game";
  var links = [
    ["arcade/", "Games"], ["broadside/", "Broadside 3D"], ["play/", "Movies"], ["grotto-arcade/", "Gaspar's Grotto"],
    ["crew/", "The Crew"], ["app/", "The App"]
  ];
    var css =
    ".poy-bar{position:sticky;top:0;z-index:2147482000;display:flex;align-items:center;gap:4px;overflow-x:auto;" +
    "padding:calc(env(safe-area-inset-top,0px) + 6px) 10px 6px;background:rgba(8,20,30,.94);border-bottom:1px solid #d6a84a55;" +
    "font:600 14px/1 Georgia,serif;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);scrollbar-width:none}" +
    ".poy-bar::-webkit-scrollbar{display:none}" +
    ".poy-bar a{color:#f1e6cc;text-decoration:none;padding:8px 10px;border-radius:8px;white-space:nowrap}" +
    ".poy-bar a:hover,.poy-bar a:focus-visible{background:#d6a84a33;outline:none}" +
    ".poy-bar a.on{background:#d6a84a;color:#1b1305}" +
    ".poy-bar .poy-brand{color:#d6a84a;font-size:15px;margin-right:4px}" +
    ".pp-wm{position:fixed;right:12px;bottom:12px;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;" +
    "align-items:center;gap:2px;filter:drop-shadow(0 0 8px rgba(255,214,120,.55));animation:pp-glow 4s ease-in-out infinite}" +
    ".pp-wm img{width:min(96px,20vw);height:auto}" +
    ".pp-wm span{font:600 10px/1.2 Georgia,serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.85);text-align:center;max-width:min(200px,55vw)}" +
    ".poy-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147482500;width:34px;height:60px;border:0;" +
    "border-radius:0 12px 12px 0;background:rgba(8,20,30,.88);color:#e0b056;font-size:20px;cursor:pointer;box-shadow:0 2px 10px #0008}" +
    ".poy-tab:focus-visible{outline:3px solid #3fb6a8}" +
    ".poy-bar.float{position:fixed;left:0;right:0;top:0;display:none}.poy-bar.float.open{display:flex}" +
    "@keyframes pp-glow{0%,100%{opacity:.45}50%{opacity:.7}}" +
    "@media (prefers-reduced-motion:reduce){.pp-wm{animation:none;opacity:.55}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function ready(fn) { document.body ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var bar = document.createElement("nav");
    bar.className = "poy-bar"; bar.setAttribute("aria-label", "Pirates of Ybor");
    var html = '<a class="poy-brand" href="' + root + 'index.html">⚓ Pirates of Ybor</a>';
    links.forEach(function (l) {
      var href = root + l[0] + "index.html";
      var on = l[0] && here.indexOf("/" + l[0]) !== -1;
      html += '<a href="' + href + '"' + (on ? ' class="on" aria-current="page"' : "") + ">" + l[1] + "</a>";
    });
    bar.innerHTML = html;
    if (gameMode) {
      bar.classList.add("float");
      bar.innerHTML += '<a href="#" data-close aria-label="Close menu">✕</a>';
      var tab = document.createElement("button");
      tab.className = "poy-tab"; tab.type = "button"; tab.textContent = "⚓";
      tab.setAttribute("aria-label", "Pirates of Ybor menu"); tab.setAttribute("aria-expanded", "false");
      tab.onclick = function () { var o = bar.classList.toggle("open"); tab.setAttribute("aria-expanded", o ? "true" : "false"); };
      bar.querySelector("[data-close]").onclick = function (e) { e.preventDefault(); bar.classList.remove("open"); tab.setAttribute("aria-expanded", "false"); };
      document.body.appendChild(bar); document.body.appendChild(tab);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    if (/\/arcade\//.test(here) && !gameMode) {
      var nw = document.createElement("a"); nw.href = root + "crew-games/index.html#spinoff";
      nw.style.cssText = "display:block;background:#ffc94d;color:#1b1305;font:700 15px/1.35 Georgia,serif;text-align:center;text-decoration:none;padding:12px 14px";
      nw.textContent = "New: Boucher & Lita's Spin-Off and 8 more Crew Games";
      bar.parentNode.insertBefore(nw, bar.nextSibling);
    }
    // Footer links the stores and the no-endorsement notice need, on every non-game page that lacks them.
    if (!gameMode && !document.querySelector("[data-poy-legal]") && !document.querySelector('a[href*="no-endorsement"]')) {
      var f = document.createElement("p"); f.setAttribute("data-poy-legal", "");
      f.style.cssText = "max-width:720px;margin:24px auto calc(130px + env(safe-area-inset-bottom,0px));padding:0 16px;font:13px/1.6 Georgia,serif;color:#a9bcc0;text-align:center";
      var L = [["privacy/", "Privacy"], ["support/", "Support"], ["delete-my-data/", "Delete My Data"], ["no-endorsement/", "No Endorsement"]];
      f.innerHTML = L.map(function (l) { return '<a style="color:#e0b056" href="' + root + l[0] + 'index.html">' + l[1] + "</a>"; }).join(" · ");
      document.body.appendChild(f);
    }

    if (!document.querySelector(".pp-wm,.wm,.wmart")) {
      var d = document.createElement("div"); d.className = "pp-wm"; d.setAttribute("aria-hidden", "true");
      d.innerHTML = '<img src="' + root + 'assets/watermark.png" alt=""><span>© 2026 Adam Kornreich / R.A. Consulting ❤ Pops &amp; Pippy</span>';
      document.body.appendChild(d);
    }
  });
})();
