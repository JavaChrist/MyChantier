import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from './config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
// Le scope doit être égal ou au-dessus du chemin du service worker. Ici on le place à la racine.
const SERVICE_WORKER_SCOPE = '/';

async function getMessagingInstance() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Notifications push non supportées sur ce navigateur.');
      return null;
    }
    return getMessaging();
  } catch (error) {
    console.error('Erreur initialisation Firebase Messaging:', error);
    return null;
  }
}

async function ensureServiceWorker() {
  // Enregistre un service worker dédié aux notifications sans écraser le SW PWA existant
  await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: SERVICE_WORKER_SCOPE
  });

  const readyRegistration = await navigator.serviceWorker.ready;

  // Transmet la configuration Firebase au SW pour qu'il puisse afficher les notifications en arrière-plan
  readyRegistration.active?.postMessage({
    type: 'INIT_FIREBASE_MESSAGING',
    firebaseConfig
  });

  return readyRegistration;
}

async function saveToken(uid: string, role: 'professional' | 'client', chantierId: string | undefined, token: string) {
  const tokenRef = doc(db, 'users', uid, 'fcmTokens', token);

  await setDoc(tokenRef, {
    token,
    role,
    chantierId: chantierId ?? null,
    userAgent: navigator.userAgent,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Demande la permission, récupère le token FCM et le sauvegarde côté Firestore.
 * Retourne le token ou null si non disponible.
 */
export async function registerDeviceForMessaging(userProfile: { uid: string; role: 'professional' | 'client'; chantierId?: string | null }) {
  if (!userProfile?.uid) return null;
  if (typeof window === 'undefined') return null;
  if (!VAPID_KEY) {
    console.warn('VAPID key manquante (VITE_FIREBASE_VAPID_KEY). Notifications push désactivées.');
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Permission de notification refusée.');
    return null;
  }

  const serviceWorkerRegistration = await ensureServiceWorker();

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration
  });

  if (token) {
    await saveToken(userProfile.uid, userProfile.role, userProfile.chantierId ?? undefined, token);
    console.log('✅ Token FCM enregistré pour', userProfile.uid);
  } else {
    console.warn('Aucun token FCM obtenu.');
  }

  return token;
}

/**
 * Ecoute les notifications reçues quand l'app est ouverte (foreground)
 */
export async function listenToForegroundMessages(callback: (payload: MessagePayload) => void) {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    callback(payload);
  });

  return unsubscribe;
}

