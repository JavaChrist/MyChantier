const CACHE_NAME = "suivi-chantier-v1";
const urlsToCache = [
  "/",
  "/src/main.tsx",
  "/src/style.css",
  "/manifest.json",
  // Icônes
  "/logo16.png",
  "/logo32.png",
  "/logo48.png",
  "/logo96.png",
  "/logo192.png",
  "/logo512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

// Installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installation");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Cache ouvert");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("✅ Fichiers mis en cache");
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activation");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Suppression ancien cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker activé");
        return self.clients.claim();
      })
  );
});

// Interception des requêtes (stratégie Network First pour Firebase)
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes non-GET, Firebase et extensions
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("firebaseapp.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("gstatic.com") ||
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.startsWith("moz-extension://") ||
    event.request.url.startsWith("safari-extension://")
  ) {
    return;
  }

  event.respondWith(
    // Stratégie Network First avec fallback cache
    fetch(event.request)
      .then((response) => {
        // Si la réponse est valide, la mettre en cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log("📦 Réponse depuis le cache:", event.request.url);
            return response;
          }
          // Si pas de cache, retourner une page d'erreur basique
          if (event.request.destination === "document") {
            return new Response(
              `<!DOCTYPE html>
                <html>
                <head>
                  <title>Hors ligne - Suivi de Chantier</title>
                  <style>
                    body { 
                      font-family: system-ui; 
                      text-align: center; 
                      padding: 50px; 
                      background: #111827; 
                      color: #f3f4f6; 
                    }
                    .logo { width: 64px; height: 64px; margin: 20px auto; }
                  </style>
                </head>
                <body>
                  <img src="/logo64.png" alt="Logo" class="logo" />
                  <h1>Mode hors ligne</h1>
                  <p>L'application fonctionne en mode hors ligne.</p>
                  <p>Reconnectez-vous à Internet pour synchroniser vos données.</p>
                  <button onclick="location.reload()">Réessayer</button>
                </body>
                </html>`,
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          }
          throw new Error("Pas de cache disponible");
        });
      })
  );
});

// Gestion des messages du client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener("updatefound", () => {
  console.log("🔄 Mise à jour disponible");
});
