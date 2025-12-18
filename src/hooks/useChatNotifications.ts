import { useEffect } from 'react';
import { emitGlobalAlert } from '../utils/alertBus';
import { listenToForegroundMessages, registerDeviceForMessaging } from '../firebase/messaging';

type UserProfile = {
  uid: string;
  role: 'professional' | 'client';
  displayName?: string;
  chantierId?: string | null;
};

export function useChatNotifications(userProfile?: UserProfile | null) {
  // Enregistrer le device pour les notifications push
  useEffect(() => {
    if (!userProfile?.uid) return;

    registerDeviceForMessaging({
      uid: userProfile.uid,
      role: userProfile.role,
      chantierId: userProfile.chantierId ?? undefined
    }).catch((error) => {
      console.error('Erreur enregistrement notifications:', error);
    });
  }, [userProfile?.uid, userProfile?.role, userProfile?.chantierId]);

  // Afficher une alerte locale quand l'app est au premier plan
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    listenToForegroundMessages((payload) => {
      const title = payload.notification?.title || 'Nouveau message';
      const body = payload.notification?.body || payload.data?.body || '';
      const url =
        payload.fcmOptions?.link ||
        payload.data?.url ||
        (payload.data as any)?.click_action ||
        '/';

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: payload.notification?.icon || '/logo192.png',
          data: { url }
        });
      } else {
        emitGlobalAlert({
          title,
          message: body || 'Vous avez reçu un nouveau message.',
          type: 'info'
        });
      }
    }).then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
}

