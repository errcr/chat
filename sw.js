const CACHE = "chatspace-v2";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Deixa tudo passar pela rede normalmente
self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request));
});
