// Gestionnaire des mises à jour de l'application

export class UpdateManager {
  private static instance: UpdateManager;
  private updateCheckInterval: number | null = null;
  private lastUpdateCheck: number = 0;

  static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  // Démarrer la vérification automatique des mises à jour
  startUpdateCheck() {
    // Vérifier toutes les 5 minutes
    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);

    // Première vérification immédiate
    this.checkForUpdates();
  }

  // Arrêter la vérification automatique
  stopUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  // Vérifier s'il y a des mises à jour
  async checkForUpdates() {
    const now = Date.now();

    // Éviter les vérifications trop fréquentes (max 1 par minute)
    if (now - this.lastUpdateCheck < 60000) {
      return;
    }

    this.lastUpdateCheck = now;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          // Forcer la vérification d'une mise à jour
          await registration.update();

          // Vérifier s'il y a un nouveau Service Worker en attente
          if (registration.waiting) {
            console.log('🔄 Nouvelle version détectée et prête');
            this.notifyUpdateAvailable();
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de mise à jour:', error);
    }
  }

  // Notifier qu'une mise à jour est disponible
  private notifyUpdateAvailable() {
    // Cette fonction sera appelée par le composant UpdatePrompt
    const event = new CustomEvent('app-update-available');
    window.dispatchEvent(event);
  }

  // Appliquer la mise à jour
  async applyUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration?.waiting) {
          // Dire au nouveau SW de prendre le contrôle
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });

          // Recharger la page pour appliquer les changements
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'application de la mise à jour:', error);
    }
  }

  // Obtenir des informations sur la version
  getVersionInfo() {
    return {
      buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };
  }
}

// Instance globale
export const updateManager = UpdateManager.getInstance();
