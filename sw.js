// Service worker: keeps the app working offline.
// Bump VERSION after changing index.html so phones pick up the new version.
const VERSION = "minus-v1";
const CHART_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // Chart.js comes from a CDN; cache it too, but don't fail install if offline.
    try { await cache.add(new Request(CHART_URL, { mode: "cors" })); } catch (e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && req.url !== CHART_URL) return;

  // Pages: network first (fresh version when online), cache when offline.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put("./index.html", res.clone());
        return res;
      } catch (e) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first, then network (and remember it).
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) {
        const cache = await caches.open(VERSION);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      return Response.error();
    }
  })());
});
