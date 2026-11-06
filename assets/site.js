/* Shared chrome for The Pirates of Ybor: header, footer, watermark, sign-in stub.
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
(function(){
  var NAV=[["index.html","Home"],["arcade.html","Arcade"],["world.html","Open World"],["crew.html","Crew"],["merch.html","Merch"],["plank-bar.html","Plank Bar"]];
  var here=location.pathname.split("/").pop()||"index.html";
  var skull='<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="30" r="20" fill="#f6d67a"/><circle cx="24" cy="28" r="5" fill="#0b0e14"/><circle cx="40" cy="28" r="5" fill="#0b0e14"/><path d="M28 40h8l-4 6z" fill="#0b0e14"/><rect x="22" y="46" width="20" height="6" rx="2" fill="#f6d67a"/><path d="M8 14 L56 50 M56 14 L8 50" stroke="#f6d67a" stroke-width="5" stroke-linecap="round"/><path d="M12 24c6-16 34-16 40 0-10-6-30-6-40 0z" fill="#b5532a"/></svg>';
  var header='<header class="top"><div class="wrap"><a class="brand" href="index.html">'+skull+'The Pirates of Ybor</a><nav class="main">'+
    NAV.map(function(n){return '<a href="'+n[0]+'"'+(here===n[0]?' class="active"':'')+'>'+n[1]+'</a>';}).join("")+
    '<a href="#" id="signinLink">⚓ Sign in</a><button id="soundBtn" type="button"></button></nav></div></header>';
  var footer='<footer class="site"><div>Built by R.A. Consulting · Gaspar\'s Grotto · Ybor City, Tampa FL · <a href="crew.html">Credits</a> · <a href="legal.html">Legal &amp; Privacy</a> · <a href="mailto:adamlkornreich@gmail.com">Contact</a></div>'+
    '<div class="copy">© 2026 Adam Kornreich / R.A. Consulting ❤ Pops &amp; Pippy. All rights reserved.</div></footer>';
  /* Official Pops & Pippy art, blended in with sparkles and the copyright line. */
  var wm='<div class="pp-watermark" aria-hidden="true"><img src="assets/brand-watermark.png" alt=""><i class="sparkle">✦</i><i class="sparkle s2">✦</i><i class="sparkle s3">✦</i><small>© 2026 Adam Kornreich / R.A. Consulting ❤ Pops &amp; Pippy</small></div>';
  var modal='<div class="modal" id="signinModal"><div class="box"><span class="close" id="signinClose">✕</span><h3>⚓ Crew Sign-in</h3>'+
    '<p>Email &amp; password accounts are coming aboard soon. For now every game is free to play — no sign-in needed.</p>'+
    '<label>Email</label><input type="email" placeholder="you@example.com" disabled><label>Password</label><input type="password" placeholder="••••••••" disabled>'+
    '<p style="margin:14px 0 0"><button class="btn" disabled>Sign in — coming soon</button></p>'+
    '<p style="color:var(--mute);font-size:.85rem;margin-top:12px">All Access membership: $1.00 / year plus tax and processing fees. Launching with the app-store release.</p></div></div>';
  if(document.body.hasAttribute("data-bare")){document.body.insertAdjacentHTML("beforeend",wm);return;}
  document.body.insertAdjacentHTML("afterbegin",header);
  document.body.insertAdjacentHTML("beforeend",footer+wm+modal);
  var m=document.getElementById("signinModal");
  document.getElementById("signinLink").addEventListener("click",function(e){e.preventDefault();m.classList.add("open");});
  document.getElementById("signinClose").addEventListener("click",function(){m.classList.remove("open");});
  m.addEventListener("click",function(e){if(e.target===m)m.classList.remove("open");});
  var slot=document.getElementById("heroArt");if(slot){slot.innerHTML='<img class="hero-art" src="assets/pops-pippy-official.jpg" alt="Pops the bar cat and Pippy the pirate chihuahua">';}
  /* simple local high-score helper */
  window.PY={best:function(key,val){try{var k="py_"+key,b=parseFloat(localStorage.getItem(k)||"0");if(val!==undefined&&val>b){localStorage.setItem(k,val);b=val;}return b;}catch(e){return val||0;}}};
  /* Sound and celebration: small sounds made in the browser, only after a tap */
  var muted=false,actx=null;try{muted=localStorage.getItem("py_mute")==="1";}catch(e){}
  function tone(f,t,d,v){if(muted)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain(),s=actx.currentTime+t;o.type="triangle";o.frequency.value=f;g.gain.setValueAtTime(v||.05,s);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(g);g.connect(actx.destination);o.start(s);o.stop(s+d);}catch(e){}}
  var sb=document.getElementById("soundBtn");function sl(){sb.textContent=muted?"🔇 Sound off":"🔊 Sound on";sb.setAttribute("aria-pressed",String(!muted));}sl();
  sb.addEventListener("click",function(){muted=!muted;try{localStorage.setItem("py_mute",muted?"1":"0");}catch(e){}sl();});
  document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("button,.btn,.choice,.opt"))tone(520,0,.07,.025);});
  window.PY.celebrate=function(){[523,659,784,1047].forEach(function(f,i){tone(f,i*.11,.28,.06);});
    if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    for(var i=0;i<34;i++){var c=document.createElement("div");c.className="coin";c.textContent=i%5?"🪙":"✨";c.style.left=Math.random()*100+"vw";c.style.animationDuration=(1.3+Math.random()*1.5)+"s";c.style.animationDelay=Math.random()*.5+"s";document.body.appendChild(c);(function(n){setTimeout(function(){n.remove();},3600);})(c);}};
})();
