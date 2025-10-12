import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';

// Données de test simples (sans base de données pour l'instant)
const mockData = {
  entreprises: [
    { id: '1', nom: 'Plomberie Martin', secteur: 'sanitaire' },
    { id: '2', nom: 'Électricité Dupont', secteur: 'electricite' },
    { id: '3', nom: 'Carrelage Plus', secteur: 'carrelage' },
  ],
  prestations: [
    { id: '1', nom: 'Rénovation salle de bain', statut: 'en-cours' },
    { id: '2', nom: 'Installation électrique', statut: 'devis-recus' },
  ]
};

function TestEntreprises() {
  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Gestion des Entreprises</h1>
        <p className="text-gray-400 mobile-text">Gérez vos entreprises partenaires</p>
      </div>

      <div className="mobile-grid">
        {mockData.entreprises.map(entreprise => (
          <div key={entreprise.id} className="card-mobile">
            <h3 className="font-semibold text-gray-100">{entreprise.nom}</h3>
            <p className="text-sm text-gray-400 mt-1">{entreprise.secteur}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestPrestations() {
  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Gestion des Prestations</h1>
        <p className="text-gray-400 mobile-text">Gérez vos prestations par corps de métier</p>
      </div>

      <div className="mobile-grid">
        {mockData.prestations.map(prestation => (
          <div key={prestation.id} className="card-mobile">
            <h3 className="font-semibold text-gray-100">{prestation.nom}</h3>
            <p className="text-sm text-gray-400 mt-1">{prestation.statut}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'entreprises':
        return <TestEntreprises />;
      case 'prestations':
        return <TestPrestations />;
      case 'devis':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Devis</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      case 'commandes':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Gestion des Commandes</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
      case 'planning':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Planning des Travaux</h1><p className="text-gray-400 mt-2">Module en cours de développement...</p></div>;
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
