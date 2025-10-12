import React from 'react';
import { Building2, FileText, ShoppingCart, Calendar, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { testFirebaseSetup } from '../utils/testFirebase';

export function Dashboard() {
  // Mock data - sera remplacé par les vraies données de la DB
  const stats = {
    entreprises: 12,
    prestationsEnCours: 5,
    devisEnAttente: 8,
    commandesActives: 3,
    paiementsEnRetard: 2,
    tachesTerminees: 15
  };

  const recentActivity = [
    { type: 'devis', message: 'Nouveau devis reçu de Plomberie Martin', date: '2024-01-15' },
    { type: 'commande', message: 'Commande validée pour Électricité Dupont', date: '2024-01-14' },
    { type: 'paiement', message: 'Paiement en retard - Carrelage Plus', date: '2024-01-13' },
    { type: 'tache', message: 'Tâche terminée: Démontage carrelage existant', date: '2024-01-12' },
  ];

  const handleTestFirebase = async () => {
    console.log('🔧 Test Firebase déclenché depuis le Dashboard');
    await testFirebaseSetup();
  };

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100 mb-2">Dashboard</h1>
          <p className="text-gray-400 mobile-text">Vue d'ensemble de vos chantiers</p>
        </div>
        <button
          onClick={handleTestFirebase}
          className="btn-secondary flex items-center space-x-2 text-sm"
          title="Tester la configuration Firebase"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Test Firebase</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="mobile-grid">
        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Entreprises</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.entreprises}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Devis en attente</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.devisEnAttente}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Commandes actives</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.commandesActives}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Prestations en cours</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.prestationsEnCours}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Paiements en retard</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.paiementsEnRetard}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Tâches terminées</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.tachesTerminees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Activité récente</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="mt-1">
                {activity.type === 'devis' && <FileText className="w-4 h-4 text-blue-400" />}
                {activity.type === 'commande' && <ShoppingCart className="w-4 h-4 text-green-400" />}
                {activity.type === 'paiement' && <AlertCircle className="w-4 h-4 text-red-400" />}
                {activity.type === 'tache' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-100 text-sm">{activity.message}</p>
                <p className="text-gray-400 text-xs mt-1">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
