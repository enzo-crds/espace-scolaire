// Enregistre le Service Worker au démarrage
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', reg.scope);
    } catch (err) {
      console.error('Échec enregistrement Service Worker:', err);
    }
  }
}

// Demande la permission à l'utilisateur (DOIT être appelé sur un clic bouton, ex: Paramètres)
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  return permission === 'granted';
}

// Déclenche une notification système immédiate via le Service Worker
export async function sendNativeNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'school-reminder',
      renotify: true
    });
  } else {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}
