/// <reference lib="webworker" />

// On utilise un cast forcé pour que TypeScript accepte les événements ServiceWorker
// sans modifier le tsconfig.json global (qui est configuré pour le DOM/Next.js)
const sw = self as unknown as ServiceWorkerGlobalScope;

// next-pwa injects workbox methods and configuration here

// Remove the former generic runtime caches, which could contain authenticated
// pages/API payloads. Current static caches use separate app-* names.
const legacyRuntimeCaches = new Set([
  "apis", "cross-origin", "dev", "google-fonts-stylesheets", "google-fonts-webfonts",
  "next-data", "next-image", "next-static-js-assets", "pages", "pages-rsc",
  "pages-rsc-prefetch", "start-url", "static-audio-assets", "static-data-assets",
  "static-font-assets", "static-image-assets", "static-js-assets",
  "static-style-assets", "static-video-assets",
]);
sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(caches.keys().then(names =>
    Promise.all(names.filter(name => legacyRuntimeCaches.has(name)).map(name => caches.delete(name)))
  ));
});


sw.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options: any = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png", // Small icon for Android status bar
      vibrate: [400, 200, 400, 200, 400],
      data: data.data || {},
      tag: data.tag || "antigravity-notification",
      requireInteraction: true, // Keep notification visible until user interacts
      actions: data.actions || [],
    };

    event.waitUntil(sw.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  // Handle specific actions (e.g. "Answer" or "Decline" call)
  if (action === "decline") {
    // We could make an API call to decline here, or just let it close
    return;
  }

  // Find URL to open
  let urlToOpen = "/dashboard";
  if (data && data.url) {
    try {
      const target = new URL(data.url, sw.location.origin);
      if (target.origin === sw.location.origin && (target.pathname === "/dashboard" || target.pathname.startsWith("/dashboard/"))) urlToOpen = target.href;
    } catch { /* Invalid notification URL: open the dashboard. */ }
  }

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    sw.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList: readonly WindowClient[]) => {
        for (const client of clientList) {
          if (client.url === new URL(urlToOpen, sw.location.origin).href && "focus" in client) {
            return client.focus();
          }
        }
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen);
        }
      })
  );
});
