export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      const reg = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker enregistré avec succès :', reg.scope);
    } catch (err) {
      console.error('Échec enregistrement Service Worker :', err);
    }
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;

  let perm = Notification.permission;

  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }

  return perm === 'granted';
}

export async function sendNativeNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;

      await reg.showNotification(title, {
        body,
        icon: `${import.meta.env.BASE_URL}favicon.ico`,
        badge: `${import.meta.env.BASE_URL}favicon.ico`,
        vibrate: [200, 100, 200],
        tag: 'school-test',
        renotify: true,
      });
    } else {
      new Notification(title, {
        body,
        icon: `${import.meta.env.BASE_URL}favicon.ico`,
      });
    }
  } catch (err) {
    console.error('Erreur lors de l’envoi de la notification :', err);
  }
}
