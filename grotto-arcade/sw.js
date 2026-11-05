/* Gaspar's Grotto Arcade service worker: makes the arcade installable to the home screen.
   It does not cache anything, so players always get the latest games.
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function () {});
