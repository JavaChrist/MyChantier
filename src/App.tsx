import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';
import { EntreprisesManager } from './components/entreprises/EntreprisesManager';
import { PrestationsManager } from './components/prestations/PrestationsManager';
import { CalendarPlanning } from './components/planning/CalendarPlanning';
import { EtapesManager } from './components/etapes/EtapesManager';
import { PaiementsGlobaux } from './components/paiements/PaiementsGlobaux';
import { AssurancesManager } from './components/assurances/AssurancesManager';
import { UsersManager } from './components/admin/UsersManager';
import { PWAPrompt } from './components/PWAPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ChantierProvider, useChantier } from './contexts/ChantierContext';
import { ChantierSelector } from './components/chantiers/ChantierSelector';
import { ChantierHeader } from './components/chantiers/ChantierHeader';
import { LoginForm } from './components/auth/LoginForm';
import { useAuth } from './hooks/useAuth';
import { ClientInterface } from './components/client/ClientInterface';
// Importer les outils de diagnostic et nettoyage
import './utils/migrateDevisToV2';
import './utils/fixDevisEntreprises';
import './utils/cleanupDevis';
import './utils/cleanupEtapes';
import './utils/addSecondaryEmail';
import { GlobalAlertListener } from './components/GlobalAlertListener';

function AppContent({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const { chantierActuel } = useChantier();

  // Si aucun chantier sélectionné, afficher le sélecteur
  if (!chantierActuel) {
    return (
      <>
        <ChantierSelector
          professionalId={userProfile?.uid || 'professional-1'}
          professionalName={userProfile?.displayName || 'Professionnel'}
          onLogout={onLogout}
        />
        <PWAPrompt />
        <UpdatePrompt />
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'entreprises':
        return <EntreprisesManager />;
      case 'prestations':
        return <PrestationsManager />;
      case 'planning':
        return <CalendarPlanning />;
      case 'etapes':
        return <EtapesManager />;
      case 'paiements':
        return <PaiementsGlobaux />;
      case 'assurances':
        return <AssurancesManager />;
      case 'users':
        return <UsersManager />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden max-w-full">
      {/* Header chantier */}
      <ChantierHeader userProfile={userProfile} onLogout={onLogout} onNavigate={setCurrentView} />

      {/* Navigation mobile */}
      <MobileNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        userProfile={userProfile}
        onLogout={onLogout}
      />

      {/* Layout desktop/mobile */}
      <div className="flex max-w-full">
        {/* Navigation desktop - cachée sur mobile */}
        <div className="hidden lg:block">
          <Navigation
            currentView={currentView}
            onViewChange={setCurrentView}
            userProfile={userProfile}
            onLogout={onLogout}
          />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto max-w-full">
          {renderContent()}
        </main>
      </div>

      {/* Composants PWA et mises à jour */}
      <PWAPrompt />
      <UpdatePrompt />
    </div>
  );
}

// Composant App principal avec authentification Firebase
function App() {
  // Système d'authentification Firebase
  const { userProfile, loading, error, success, login, signup, resetPassword, logout, isAuthenticated } = useAuth();
  const globalAlerts = <GlobalAlertListener />;


  // Afficher l'écran de chargement pendant la vérification de l'auth
  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Suivi de Chantier</h2>
            <p className="text-gray-400">Vérification de votre accès...</p>
          </div>
        </div>
        {globalAlerts}
      </>
    );
  }

  // Afficher le formulaire de connexion si pas authentifié
  if (!isAuthenticated) {
    return (
      <>
        <LoginForm
          onLogin={login}
          onSignUp={signup}
          onResetPassword={resetPassword}
          loading={loading}
          error={error}
          success={success}
        />
        <PWAPrompt />
        <UpdatePrompt />
        {globalAlerts}
      </>
    );
  }

  // Utilisateur connecté - déterminer le type d'accès
  return (
    <ChantierProvider>
      <AuthenticatedApp
        userProfile={userProfile}
        onLogout={logout}
      />
      {globalAlerts}
    </ChantierProvider>
  );
}

// Composant pour les utilisateurs authentifiés
function AuthenticatedApp({
  userProfile,
  onLogout
}: {
  userProfile: any;
  onLogout: () => void;
}) {
  // Redirection selon le rôle
  if (userProfile?.role === 'client') {
    return <ClientApp userProfile={userProfile} onLogout={onLogout} />;
  }

  // Professionnel - afficher le sélecteur de chantier
  return <ProfessionalApp userProfile={userProfile} onLogout={onLogout} />;
}

// Interface client (accès à UN seul chantier)
function ClientApp({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  // Le client n'a accès qu'à SON chantier spécifique
  const clientChantierId = userProfile?.chantierId;

  // Si le client n'a pas de chantier assigné, afficher une erreur
  if (!clientChantierId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100 mb-2">Aucun chantier assigné</h1>
            <p className="text-gray-400 mb-4">
              Votre compte client n'est associé à aucun chantier.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Contactez votre professionnel pour qu'il vous associe à un chantier.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="btn-primary w-full"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Tous les chantiers sont maintenant valides avec la structure V2
  // Plus besoin de vérifier si le chantier existe, la structure V2 gère cela automatiquement

  // Les clients n'ont PAS besoin de ChantierProvider car leur chantier est fixe
  return (
    <ClientInterface
      userProfile={userProfile}
      chantierId={clientChantierId}
      onLogout={onLogout}
    />
  );
}

// Interface professionnel (accès à TOUS les chantiers)
function ProfessionalApp({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  return <AppContent userProfile={userProfile} onLogout={onLogout} />;
}

export default App;
