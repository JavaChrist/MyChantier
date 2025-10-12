import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';

function TestDashboard() {
  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-400 mobile-text">Vue d'ensemble de vos chantiers</p>
      </div>

      <div className="mobile-grid">
        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <span className="text-white text-sm">📊</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Test</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-base md:text-lg font-semibold text-gray-100 mb-4">Test réussi !</h2>
        <p className="text-gray-300">L'interface fonctionne correctement.</p>
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <TestDashboard />;
      case 'entreprises':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Entreprises</h1><p className="text-gray-400 mt-2">Module en test...</p></div>;
      case 'prestations':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-100">Prestations</h1><p className="text-gray-400 mt-2">Module en test...</p></div>;
      default:
        return <TestDashboard />;
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
