self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install Event processing");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate Event processing");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Service Worker simple passe-plat (pour permettre l'installation PWA)
  // Une logique de cache avancée (offline) n'est pas recommandée pour un softphone temps réel.
  return;
});
