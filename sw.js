const IZLEKAZAN_CACHE = "izlekazan-pwa-v20260518022";
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


// İzleKazan v2026.05.18-022: Push notification listener
self.addEventListener("push", (event) => {
  let payload = { title: "İzleKazan", body: "Yeni bildiriminiz var.", url: "/?page=panel", tag: "izlekazan" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    payload.body = event.data ? event.data.text() : payload.body;
  }
  const options = {
    body: payload.body || payload.message || "Yeni bildiriminiz var.",
    icon: payload.icon || "/assets/icon-192.png",
    badge: payload.badge || "/assets/icon-192.png",
    tag: payload.tag || payload.id || "izlekazan-notification",
    renotify: true,
    data: { url: payload.url || "/?page=panel", id: payload.id || "" }
  };
  event.waitUntil(self.registration.showNotification(payload.title || "İzleKazan", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || "/?page=panel", self.location.origin).href;
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus();
        if ("navigate" in client) return client.navigate(targetUrl);
        return;
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
