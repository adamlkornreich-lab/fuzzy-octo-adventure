/* Pirates of Ybor: shared sound system for the website and Capacitor apps.
   Original, synthesized sea ambience and UI cues, plus the owner's supplied dog chorus.
   Audio is unlocked by a user gesture (iOS, Android and browser autoplay rules).
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
(function () {
  "use strict";
  if (window.POYAudio) return;
  var here = document.currentScript && document.currentScript.src;
  var barkURL = here ? new URL("pippy-pirate-howls.mp3", here).href : "assets/pippy-pirate-howls.mp3";
  var KEY = "poy-audio-v1";
  var enabled = true;
  try { var saved = localStorage.getItem(KEY); if (saved === "off") enabled = false; } catch (_) {}
  var OWN = /\/(golf|pour-off|kraken|playhouse|crew-games)\/|\/games\/(andy-golf-club|pour-off|whack-a-kraken)\.html/i;
  var GAMEPAGE = /\/(arcade|classics|game-deck|play|tavern|tavern-arcade|tavern-hall|tournament|trivia|grotto-arcade)(\/|$)|\/games\//i;
  var MKEY = "poy-music-v1", music = "west", musicBtn = null, mGain = null, mTimer = null, mStep = 0, mNext = 0;
  try { var sm = localStorage.getItem(MKEY); if (sm === "west" || sm === "east" || sm === "off") music = sm; } catch (_) {}
  var LABEL = { west: "West Coast", east: "East Coast", off: "Off" };
  function mTone(f1, f2, dur, vol, type, at) { var c = ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f1, at); o.frequency.exponentialRampToValueAtTime(f2, at + dur); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(g); g.connect(mGain); o.start(at); o.stop(at + dur + 0.02); }
  var nBuf = null;
  function mNoise(dur, freq, vol, type, at) { var c = ctx; if (!nBuf) { nBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); var d = nBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = nBuf; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f); f.connect(g); g.connect(mGain); s.start(at); s.stop(at + dur + 0.02); }
  function mStepPlay(s, at) { var i = s % 16, bar;
    if (music === "west") { bar = Math.floor(s / 16) % 4; if (i === 0 || i === 7 || i === 10) mTone(120, 40, 0.22, 0.5, "sine", at); if (i === 4 || i === 12) mNoise(0.12, 1800, 0.28, "bandpass", at); if (i % 2 === 0) mNoise(0.05, 7000, 0.06, "highpass", at);
      var b = { 0: 55, 3: 55, 6: 65.4, 8: 49, 11: 49, 14: 58.3 }[i]; if (b) { var q = bar === 3 ? 0.89 : 1; mTone(b * q, b * q, 0.28, 0.3, "sine", at); }
      var l = { 0: 880, 6: 988, 8: 1047, 12: 880 }[i]; if (bar % 2 === 1 && l) mTone(l, l * 1.06, 0.5, 0.035, "sine", at);
    } else { bar = Math.floor(s / 16) % 2; if (i === 0 || i === 5 || i === 10 || (bar && i === 15)) mTone(120, 40, 0.22, 0.5, "sine", at); if (i === 4 || i === 12) mNoise(0.16, 2600, 0.24, "highpass", at); if (i % 2 === 0 || i === 7) mNoise(0.05, 7000, i === 6 ? 0.09 : 0.05, "highpass", at);
      if (i === 0 || i === 3 || (bar && i === 8)) [220, 261.6, 329.6].forEach(function (f) { mTone(f, f * 0.995, 0.3, 0.05, "triangle", at); }); if (i === 0 || i === 10) mTone(55, 52, 0.3, 0.3, "sine", at); } }
  function startMusic() { if (OWN.test(location.pathname) || /\/(account|admin|privacy|support|delete-my-data|no-endorsement)(\/|\.html)/.test(location.pathname) || !enabled || !unlocked || music === "off" || mTimer || document.hidden) return; var c = getContext(); if (!c) return;
    if (!mGain) { mGain = c.createGain(); mGain.connect(c.destination); } mGain.gain.value = GAMEPAGE.test(location.pathname) ? 0.5 : 0.28; mNext = c.currentTime + 0.1;
    mTimer = setInterval(function () { var dur = 60 / (music === "west" ? 92 : 88) / 4; while (mNext < c.currentTime + 0.25) { try { mStepPlay(mStep, mNext); } catch (_) {} mStep++; mNext += dur; } }, 60); }
  function stopMusic() { if (mTimer) { clearInterval(mTimer); mTimer = null; } if (mGain && ctx) { mGain.gain.value = 0; mGain = null; } }
  function cycleMusic() { music = music === "west" ? "east" : music === "east" ? "off" : "west"; try { localStorage.setItem(MKEY, music); } catch (_) {} stopMusic(); if (enabled) unlock(); startMusic(); update(); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) stopMusic(); else startMusic(); });
  var quiet = null;
  function iosUnlock() { try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (_) {}
    if (quiet) return; try { var n = 8000, b = new ArrayBuffer(44 + n), v = new DataView(b), w = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }; w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true); for (var i = 0; i < n; i++) v.setUint8(44 + i, 128);
      quiet = new Audio(URL.createObjectURL(new Blob([b], { type: "audio/wav" }))); quiet.loop = true; quiet.setAttribute("playsinline", ""); var r = quiet.play(); if (r && r.catch) r.catch(function () {}); } catch (_) {} }
  var lastTap = 0, lastCue = 0, GOOD = /\b(correct|aye|you win|wins|winner|checkmate|bingo|strike|bullseye|treasure|well done|nice)\b/i, BAD = /\b(wrong|walk the plank|you lose|lost|miss|gutter|game over|try again)\b/i;
  function watchGames() { if (OWN.test(location.pathname) || !GAMEPAGE.test(location.pathname) || !window.MutationObserver) return;
    new MutationObserver(function (list) { var now = Date.now(); if (now - lastTap > 1500 || now - lastCue < 400) return; for (var i = 0; i < list.length; i++) { var txt = (list[i].target.textContent || "").slice(0, 90); if (list[i].target.id === "poy-sound-widget") continue; if (BAD.test(txt)) { lastCue = now; chime("fail"); return; } if (GOOD.test(txt)) { lastCue = now; chime("success"); return; } } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  var ctx = null, sea = null, seaFilter = null, seaGain = null, dog = null, status = null, toggle = null;
  var unlocked = false;
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  function getContext() {
    if (!AudioContextClass) return null;
    if (!ctx) { try { ctx = new AudioContextClass(); } catch (_) { return null; } }
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    return ctx;
  }
  function unlock() {
    if (!enabled) return;
    var c = getContext();
    if (!c) return;
    unlocked = true;
    iosUnlock();
    startSea();
    startMusic();
    update();
  }
  function startSea() {
    var c = getContext();
    if (!c || !enabled || !unlocked) return;
    if (sea) { if (seaGain) seaGain.gain.setTargetAtTime(0.015, c.currentTime, 0.4); return; }
    // Soft, locally generated ocean surf; no streaming, no external music.
    var frames = Math.max(1024, c.sampleRate * 3);
    var b = c.createBuffer(1, frames, c.sampleRate), a = b.getChannelData(0), last = 0;
    for (var i = 0; i < frames; i++) { last = (last + 0.015 * (Math.random() * 2 - 1)) / 1.001; a[i] = last; }
    sea = c.createBufferSource(); sea.buffer = b; sea.loop = true;
    seaFilter = c.createBiquadFilter(); seaFilter.type = "lowpass"; seaFilter.frequency.value = 380;
    seaGain = c.createGain(); seaGain.gain.value = 0;
    sea.connect(seaFilter); seaFilter.connect(seaGain); seaGain.connect(c.destination); sea.start();
    seaGain.gain.setTargetAtTime(0.015, c.currentTime, 0.6);
  }
  function stopSea() {
    if (seaGain && ctx) seaGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  }
  function chime(kind) {
    if (!enabled || !unlocked) return;
    var c = getContext(); if (!c) return;
    try {
      var now = c.currentTime, o = c.createOscillator(), v = c.createGain();
      o.type = kind === "success" ? "sine" : kind === "fail" ? "sawtooth" : "triangle";
      var pitch = kind === "success" ? 620 : kind === "fail" ? 200 : 370;
      o.frequency.setValueAtTime(pitch, now);
      if (kind === "success") o.frequency.exponentialRampToValueAtTime(900, now + 0.12);
      else o.frequency.exponentialRampToValueAtTime(240, now + 0.07);
      v.gain.setValueAtTime(0.0001, now);
      v.gain.exponentialRampToValueAtTime(kind === "success" ? 0.04 : 0.015, now + 0.014);
      v.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "success" ? 0.21 : 0.095));
      o.connect(v); v.connect(c.destination); o.start(now); o.stop(now + 0.24);
    } catch (_) {}
  }
  function playHowls() {
    if (!enabled) { setEnabled(true); }
    unlock();
    try {
      if (!dog) { dog = new Audio(barkURL); dog.preload = "none"; dog.volume = 0.55; }
      dog.currentTime = 0;
      var result = dog.play();
      if (result && result.catch) result.catch(function () { setStatus("Audio unavailable; tap again."); });
    } catch (_) { setStatus("Audio unavailable on this device."); }
  }
  function setStatus(s) { if (status) status.textContent = s; }
  function update() {
    if (!toggle) return;
    toggle.textContent = enabled ? "🔊 Sound on" : "🔇 Sound off";
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.title = enabled ? "Mute Pirates of Ybor shared sound effects and sea ambience" : "Enable Pirates of Ybor sound";
    if (musicBtn) musicBtn.textContent = "♫ Music: " + LABEL[music];
    setStatus(enabled ? (unlocked ? "Sound is playing" : "Tap to start audio") : "Sound is muted");
  }
  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (_) {}
    if (enabled) unlock();
    else {
      stopSea();
      stopMusic();
      if (dog) { dog.pause(); dog.currentTime = 0; }
    }
    update();
  }
  function makeControls() {
    if (!document.body || document.getElementById("poy-sound-widget")) return;
    var css = document.createElement("style");
    css.textContent = "#poy-sound-widget{position:fixed;z-index:2147482200;left:max(10px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:5px;align-items:flex-start;font:600 12px/1.2 system-ui,-apple-system,sans-serif;color:#f4ead2;max-width:calc(100vw - 18px)}" +
      "#poy-sound-widget button{all:revert;box-sizing:border-box;min-height:36px;padding:6px 11px;border:1px solid #e0b056;border-radius:999px;background:#0b1a26ed;color:#f3ead7;box-shadow:0 2px 12px #0009;font:600 12px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}" +
      "#poy-sound-widget button:focus-visible{outline:3px solid #3fb6a8;outline-offset:2px}" +
      "#poy-sound-widget .poy-audio-panel{display:none;max-width:180px;background:#0b1a26ee;border:1px solid #e0b05677;padding:8px;border-radius:11px;box-shadow:0 8px 28px #0009}" +
      "#poy-sound-widget[data-open='yes'] .poy-audio-panel{display:flex;flex-direction:column;gap:7px}" +
      "#poy-sound-widget .poy-audio-panel small{font:11px/1.35 system-ui,sans-serif;color:#d7c9ac}" +
      "body.poy-immersive #poy-sound-widget{bottom:calc(148px + env(safe-area-inset-bottom,0px))}";
    document.head.appendChild(css);
    var w = document.createElement("div"); w.id = "poy-sound-widget"; w.setAttribute("aria-label", "Pirates of Ybor sound controls");
    var panel = document.createElement("div"); panel.className = "poy-audio-panel";
    toggle = document.createElement("button"); toggle.type = "button";
    var howls = document.createElement("button"); howls.type = "button"; howls.textContent = "🐾 Play pirate pup howls";
    status = document.createElement("small"); status.setAttribute("aria-live", "polite");
    var show = document.createElement("button"); show.type = "button"; show.textContent = "♫ Audio options";
    show.title = "Open sound options"; show.setAttribute("aria-expanded", "false");
    show.addEventListener("click", function () {
      var open = w.getAttribute("data-open") === "yes";
      w.setAttribute("data-open", open ? "no" : "yes"); show.setAttribute("aria-expanded", String(!open));
      if (!open && enabled) unlock();
    });
    toggle.addEventListener("click", function () { setEnabled(!enabled); });
    howls.addEventListener("click", playHowls);
    if (!OWN.test(location.pathname)) { musicBtn = document.createElement("button"); musicBtn.type = "button"; musicBtn.addEventListener("click", cycleMusic); panel.appendChild(musicBtn); }
    panel.appendChild(toggle); panel.appendChild(howls); panel.appendChild(status);
    w.appendChild(show); w.appendChild(panel); document.body.appendChild(w);
    if (/\/(golf|pour-off|kraken)\/|\/games\/(andy-golf-club|pour-off|whack-a-kraken)\.html/i.test(location.pathname)) document.body.classList.add("poy-immersive");
    update();
    watchGames();
  }
  // The first deliberate user interaction unlocks audio. Never attempt autoplay on load.
  document.addEventListener("pointerdown", function (event) {
    if (!enabled) return;
    if (event.target && event.target.closest && event.target.closest("#poy-sound-widget")) { iosUnlock(); return; }
    unlock(); lastTap = Date.now();
    var clickable = event.target && event.target.closest && event.target.closest("button,a,[role=button],[role=link]");
    if (clickable) chime(/(win|complete|success|score|treasure|finish|victory)/i.test(clickable.textContent || "") ? "success" : "click");
  }, true);
  document.addEventListener("keydown", function (event) {
    if (!enabled || (event.key !== "Enter" && event.key !== " ") || event.repeat) return;
    var el = event.target;
    if (!el || !el.matches || !el.matches("button,a,[role=button]")) return;
    unlock(); lastTap = Date.now(); chime("click");
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", makeControls);
  else makeControls();
  window.POYAudio = { enable: setEnabled, play: chime, playHowls: playHowls, isEnabled: function () { return enabled; } };
})();
