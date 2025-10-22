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

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { chantierActuel } = useChantier();

  console.log('🔍 AppContent render - chantierActuel:', chantierActuel?.nom || 'null');

  // Si aucun chantier sélectionné, afficher le sélecteur
  if (!chantierActuel) {
    return (
      <>
        <ChantierSelector
          professionalId="professional-1"
          professionalName="Christian"
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
      />

      {/* Layout desktop/mobile */}
      <div className="flex">
        {/* Navigation desktop - cachée sur mobile */}
        <div className="hidden lg:block">
          <Navigation
            currentView={currentView}
            onViewChange={setCurrentView}
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

// Composant App principal avec Provider
function App() {
  return (
    <ChantierProvider>
      <AppContent />
    </ChantierProvider>
  );
}

export default App;
