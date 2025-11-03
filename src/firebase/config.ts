import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Configuration Firebase avec les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Vérifier que toutes les variables sont présentes
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

// Variables d'environnement chargées
if (import.meta.env.DEV) {
  console.log('🔧 Firebase configuré avec succès');
}

if (missingVars.length > 0) {
  console.warn('⚠️ Variables d\'environnement Firebase manquantes:', missingVars);
  console.warn('📋 Créez un fichier .env.local avec vos clés Firebase');
  console.warn('🔧 Guide: https://firebase.google.com/docs/web/setup');
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const dbInstance = getFirestore(app);

// Activer la persistance offline avec gestion d'erreurs
// Cela évite les erreurs ERR_INTERNET_DISCONNECTED
try {
  enableIndexedDbPersistence(dbInstance, {
    forceOwnership: false
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistance désactivée : plusieurs onglets ouverts');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Persistance non supportée par ce navigateur');
    }
  });
} catch (error) {
  console.warn('⚠️ Persistance offline désactivée');
}

export const db = dbInstance;
export const storage = getStorage(app);
export const auth = getAuth(app);

// Export de la config pour debug
export { firebaseConfig };

export default app;
