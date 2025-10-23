import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';
import { EntreprisesManager } from './components/entreprises/EntreprisesManager';
import { PrestationsManager } from './components/prestations/PrestationsManager';
import { CalendarPlanning } from './components/planning/CalendarPlanning';
import { PaiementsGlobaux } from './components/paiements/PaiementsGlobaux';
import { AssurancesManager } from './components/assurances/AssurancesManager';
import { PWAPrompt } from './components/PWAPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ChantierProvider, useChantier } from './contexts/ChantierContext';
import { ChantierSelector } from './components/chantiers/ChantierSelector';
import { ChantierHeader } from './components/chantiers/ChantierHeader';
import { LoginForm } from './components/auth/LoginForm';
import { useAuth } from './hooks/useAuth';
import { ClientInterface } from './components/client/ClientInterface';

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
      case 'paiements':
        return <PaiementsGlobaux />;
      case 'assurances':
        return <AssurancesManager />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header chantier */}
      <ChantierHeader />

      {/* Navigation mobile */}
      <MobileNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        userProfile={userProfile}
        onLogout={onLogout}
      />

      {/* Layout desktop/mobile */}
      <div className="flex">
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
        <main className="flex-1 overflow-auto">
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



  // Afficher l'écran de chargement pendant la vérification de l'auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Suivi de Chantier</h2>
          <p className="text-gray-400">Vérification de votre accès...</p>
        </div>
      </div>
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
  // Si c'est un client, rediriger vers son chantier spécifique
  if (userProfile?.role === 'client') {
    return <ClientApp userProfile={userProfile} onLogout={onLogout} />;
  }

  // Si c'est un professionnel, afficher le sélecteur de chantier
  return <ProfessionalApp userProfile={userProfile} onLogout={onLogout} />;
}

// Interface client (accès à UN seul chantier)
function ClientApp({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  // Le client n'a accès qu'à SON chantier spécifique
  const clientChantierId = userProfile?.chantierId || 'chantier-principal';

  return (
    <ChantierProvider>
      <ClientInterface
        userProfile={userProfile}
        chantierId={clientChantierId}
        onLogout={onLogout}
      />
    </ChantierProvider>
  );
}

// Interface professionnel (accès à TOUS les chantiers)
function ProfessionalApp({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  return <AppContent userProfile={userProfile} onLogout={onLogout} />;
}

export default App;
