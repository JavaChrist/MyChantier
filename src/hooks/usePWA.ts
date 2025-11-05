import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Workbox gère automatiquement les mises à jour maintenant

    // Gérer l'événement d'installation PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('📱 PWA installable détectée');
    };

    // Détecter si l'app est déjà installée
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('✅ PWA installée');
    };

    // Gérer le statut en ligne/hors ligne
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Connexion rétablie');
    };

  const handleOffline = () => {
    // Ignorer les faux événements offline (ouverture DevTools, etc.)
    // Vérifier après un délai si on est vraiment offline
    setTimeout(() => {
      if (!navigator.onLine) {
        setIsOnline(false);
        console.warn('📴 Mode hors ligne détecté');
      }
    }, 500);
  };

    // Vérifier si l'app est déjà installée
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('✅ PWA déjà installée');
    }

    // Ajouter les event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('✅ Utilisateur a accepté l\'installation');
          setIsInstalled(true);
        } else {
          console.log('❌ Utilisateur a refusé l\'installation');
        }

        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('❌ Erreur lors de l\'installation:', error);
      }
    }
  };

  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour Service Worker:', error);
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateServiceWorker
  };
}
