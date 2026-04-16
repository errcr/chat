const CACHE_NAME = "secret-chat-e84d69ba";
const APP_SHELL = [
  "/",
  "/index.html",
  "/admin.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Nunito:wght@400;600;700;800&display=swap"
];

// Responde ao postMessage SKIP_WAITING vindo do cliente
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Instala e salva o shell do app
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Estratégias de cache
self.addEventListener("fetch", function (event) {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisições que não são GET
  if (request.method !== "GET") return;

  // Ignora extensões do Firebase e outros requests não-cacheáveis
  if (
    url.protocol.indexOf("http") !== 0 ||
    url.pathname.startsWith("/__/")
  ) {
    return;
  }

  // HTML: sempre rede primeiro, nunca serve cache direto
  // Safari/iOS é muito agressivo com cache de SW — forçar network garante
  // que o usuário sempre receba a versão mais recente do app
  if (request.mode === "navigate" || (request.headers.get("accept") && request.headers.get("accept").includes("text/html"))) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(function (response) {
          if (response && response.status === 200) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // Ícones, css, js e imagens: cache first, depois rede
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;

        return fetch(request).then(function (response) {
          if (!response || response.status !== 200) return response;

          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
          return response;
        });
      })
    );
    return;
  }

  // Padrão: tenta rede, se falhar usa cache
  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (!response || response.status !== 200) return response;

        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});

// Push notification
self.addEventListener("push", function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Secret Chat", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Secret Chat", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "secret-chat",
      renotify: true
    })
  );
});

// Clique na notificação
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});