export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // S'assure de trouver sw.js à la racine relative du domaine
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      const reg = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker enregistré avec succès :', reg.scope);
    } catch (err) {
      console.error('Échec enregistrement Service Worker :', err);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  return perm === 'granted';
}

export async function sendNativeNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      // Attend que le Service Worker soit totalement prêt
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: 'school-test',
        renotify: true,
      } as NotificationOptions);
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  } catch (err) {
    console.error('Erreur lors de l’envoi de la notification :', err);
  }
}
