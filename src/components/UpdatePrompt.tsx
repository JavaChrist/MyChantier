import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, X, AlertTriangle } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker enregistré avec succès');

      // Vérifier les mises à jour toutes les 30 secondes
      if (r) {
        setInterval(() => {
          r.update();
        }, 30000);
      }
    },
    onRegisterError(error) {
      console.error('❌ Erreur Service Worker:', error);
    },
    onOfflineReady() {
      console.log('📴 Application prête pour le mode hors ligne');
      setOfflineReady(true);
    },
    onNeedRefresh() {
      console.log('🔄 Mise à jour disponible');
      setNeedRefresh(true);
      setShowUpdatePrompt(true);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  // Auto-update après 10 secondes si l'utilisateur ne répond pas
  useEffect(() => {
    if (needRefresh) {
      const timer = setTimeout(() => {
        console.log('🔄 Mise à jour automatique après 10 secondes');
        updateServiceWorker(true);
        setShowUpdatePrompt(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [needRefresh, updateServiceWorker]);

  return (
    <>
      {/* Notification de mise à jour disponible */}
      {showUpdatePrompt && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-primary-600 border border-primary-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Mise à jour disponible
                </h3>
                <p className="text-xs text-blue-100 mb-3">
                  Une nouvelle version de l'application est disponible avec des améliorations et corrections.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-white hover:bg-gray-100 rounded text-xs text-primary-600 font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Mettre à jour</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-blue-200">
                  Mise à jour automatique dans 10 secondes...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification mode hors ligne */}
      {offlineReady && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-600/90 text-green-100 rounded-lg shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Mode hors ligne activé</span>
            <button
              onClick={() => setOfflineReady(false)}
              className="text-green-200 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
