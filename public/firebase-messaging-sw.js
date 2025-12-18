/* Service worker dédié aux notifications Firebase Cloud Messaging.
 * Il fonctionne sur un scope séparé pour éviter les conflits avec le SW PWA généré par Vite.
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

let messagingInstance = null;

function showNotificationFromPayload(payload) {
  const notification = payload.notification || payload.data || {};
  const title = notification.title || 'Nouveau message';
  const options = {
    body: notification.body || 'Vous avez reçu un nouveau message.',
    icon: notification.icon || '/logo192.png',
    badge: notification.badge || '/logo96.png',
    data: {
      url: notification.click_action || notification.url || '/',
      ...notification
    }
  };

  return self.registration.showNotification(title, options);
}

function initMessaging(firebaseConfig) {
  if (messagingInstance || !firebaseConfig) return;

  firebase.initializeApp(firebaseConfig);
  messagingInstance = firebase.messaging();

  messagingInstance.onBackgroundMessage((payload) => {
    showNotificationFromPayload(payload);
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FIREBASE_MESSAGING') {
    initMessaging(event.data.firebaseConfig);
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(showNotificationFromPayload(payload));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

