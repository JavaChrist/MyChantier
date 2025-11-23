import React from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export function PWAPrompt() {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable && !isInstalled) {
      // Afficher le prompt d'installation après 10 secondes
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      // Masquer automatiquement après 5 secondes
      const timer = setTimeout(() => {
        setShowOfflineNotice(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    await installApp();
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Prompt d'installation PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-100 mb-1">
                  Installer l'application
                </h3>
                <p className="text-xs text-gray-300 mb-3">
                  Installez Suivi de Chantier sur votre appareil pour un accès rapide et une utilisation hors ligne.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 rounded text-xs text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Installer</span>
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de statut hors ligne */}
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
              <button
                onClick={() => setShowOfflineNotice(false)}
                className="text-yellow-200 hover:text-yellow-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
