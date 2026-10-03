/// <reference lib="webworker" />

// @ts-ignore - prevent typescript errors for self
declare const self: ServiceWorkerGlobalScope;

// next-pwa injects workbox methods and configuration here

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    // Default options for incoming call or message
    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png", // Small icon for Android status bar
      vibrate: [400, 200, 400, 200, 400],
      data: data.data || {},
      tag: data.tag || "antigravity-notification",
      requireInteraction: true, // Keep notification visible until user interacts
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
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
    urlToOpen = data.url;
  }

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
