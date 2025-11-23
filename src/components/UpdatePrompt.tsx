import { useState, useEffect } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';

export function UpdatePrompt() {
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  useEffect(() => {
    // Test de connexion Firebase plus intelligent
    const testFirebaseConnection = async () => {
      try {
        // Simplement vérifier si on est en ligne
        const online = navigator.onLine;
        if (!online) {
          setShowOfflineNotice(true);
          setTimeout(() => setShowOfflineNotice(false), 5000);
        }
      } catch (error) {
        console.log('Erreur test connexion');
      }
    };

    // Tester la connexion au démarrage
    testFirebaseConnection();

    // Gérer le statut en ligne/hors ligne
    const handleOnline = () => {
      setShowUpdateSuccess(true);
      console.log('🌐 Connexion rétablie - Synchronisation en cours');

      // Masquer le message après 3 secondes
      setTimeout(() => setShowUpdateSuccess(false), 3000);
    };

    const handleOffline = () => {
      // Ignorer les faux offline (ouverture DevTools)
      // Vérifier plusieurs fois avant d'afficher le message
      let checkCount = 0;
      const intervalId = setInterval(() => {
        checkCount++;

        if (navigator.onLine) {
          // Retour en ligne, annuler
          clearInterval(intervalId);
          return;
        }

        if (checkCount >= 5) {
          // Vraiment hors ligne après 5 vérifications (2.5 secondes)
          clearInterval(intervalId);
          setShowOfflineNotice(true);
          console.warn('📴 Mode hors ligne confirmé');
          setTimeout(() => setShowOfflineNotice(false), 5000);
        }
      }, 500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Notification mode hors ligne */}
      {showOfflineNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-yellow-600 border border-yellow-500 rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-100" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-100">
                  Mode hors ligne
                </p>
                <p className="text-xs text-yellow-200">
                  Vos données seront synchronisées à la reconnexion
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification de reconnexion */}
      {showUpdateSuccess && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-600 border border-green-500 rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-100" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-100">
                  Synchronisé
                </p>
                <p className="text-xs text-green-200">
                  Application mise à jour et synchronisée
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}