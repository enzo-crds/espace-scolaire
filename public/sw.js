self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Écoute des messages envoyés depuis l'application React
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    self.registration.showNotification(title, {
      body: body,
      tag: 'school-notification',
      renotify: true,
      vibrate: [200, 100, 200],
    });
  }
});

// Écoute Push Serveur (si serveur configuré plus tard)
self.addEventListener('push', (event) => {
  let data = { title: 'Rappel Scolaire', body: 'Un événement approche !' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: 'school-notification',
      renotify: true,
      vibrate: [200, 100, 200],
    })
  );
});

// Clic sur la notification -> Réouvre/focus l'application PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
