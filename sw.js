const IZLEKAZAN_CACHE = "izlekazan-pwa-v20260518021";
const CORE_ASSETS = ["/", "/index.html", "/style.css", "/app.js", "/site-update.js", "/manifest.json", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/film-afisleri-vitrin.png", "/assets/top-film-01.png", "/assets/top-film-02.png", "/assets/top-film-03.png", "/assets/top-film-04.png", "/assets/top-film-05.png", "/assets/top-film-06.png", "/assets/top-film-07.png", "/assets/top-film-08.png", "/assets/top-film-09.png", "/assets/top-film-10.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(IZLEKAZAN_CACHE).then(cache => cache.addAll(CORE_ASSETS).catch(() => null)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== IZLEKAZAN_CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(IZLEKAZAN_CACHE).then(cache => cache.put(req, copy)).catch(() => null);
    return res;
  }).catch(() => caches.match(req).then(cached => cached || caches.match("/index.html"))));
});
