import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';
import { EntrepriseList } from './components/entreprises/EntrepriseList';
import { PrestationList } from './components/prestations/PrestationList';
import { PlanningView } from './components/planning/PlanningView';
import { seedDatabase } from './utils/seedData';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Initialiser la base de données avec des données de test
    seedDatabase();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'entreprises':
        return <EntrepriseList />;
      case 'prestations':
        return <PrestationList />;
      case 'devis':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Devis</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      case 'commandes':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Commandes</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      case 'planning':
        return <PlanningView />;
      case 'paiements':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Paiements</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      case 'assurances':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Assurances</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation mobile */}
      <MobileNavigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Layout desktop/mobile */}
      <div className="flex">
        {/* Navigation desktop - cachée sur mobile */}
        <div className="hidden lg:block">
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
