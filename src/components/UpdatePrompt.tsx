import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle, RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  useEffect(() => {
    // Gérer le statut en ligne/hors ligne
    const handleOnline = () => {
      setIsOnline(true);
      setShowUpdateSuccess(true);
      console.log('🌐 Connexion rétablie - Synchronisation en cours');

      // Masquer le message après 3 secondes
      setTimeout(() => setShowUpdateSuccess(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
      console.log('📴 Mode hors ligne');

      // Masquer automatiquement après 5 secondes
      setTimeout(() => setShowOfflineNotice(false), 5000);
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

      {/* Indicateur de statut de connexion (discret) */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all ${isOnline
            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
            : 'bg-red-600/20 text-red-400 border border-red-600/30'
          }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </div>
    </>
  );
}