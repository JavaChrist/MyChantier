import { useState, useEffect } from 'react';
import { MessageCircle, Calendar, FileText, CreditCard, LogOut, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useChantierData } from '../../hooks/useChantierData';
import { ClientChat } from './ClientChat';
import { ClientDocuments } from './ClientDocuments';
import { ClientPlanning } from './ClientPlanning';
import { ClientPaiements } from './ClientPaiements';

interface ClientInterfaceProps {
  userProfile: any;
  chantierId: string;
  onLogout: () => void;
}

export function ClientInterface({ userProfile, chantierId, onLogout }: ClientInterfaceProps) {
  const [currentView, setCurrentView] = useState('overview');
  const { entreprises, devis, commandes, paiements, loading } = useChantierData(chantierId);

  // Debug pour comprendre le problème
  console.log('🔍 DEBUG CLIENT:', {
    userProfile: userProfile,
    chantierId: chantierId,
    userChantierId: userProfile?.chantierId,
    entreprisesCount: entreprises.length,
    devisCount: devis.length,
    commandesCount: commandes.length,
    paiementsCount: paiements.length
  });

  // ALERTE si le client voit des données du chantier principal
  if (chantierId === 'chantier-principal' && userProfile?.chantierId !== 'chantier-principal') {
    console.warn('🚨 PROBLÈME: Client voit le chantier principal au lieu de son chantier!');
    console.warn('Client chantierId:', userProfile?.chantierId);
    console.warn('Interface chantierId:', chantierId);
  }

  // Calculer les stats pour le client
  const stats = {
    entreprises: entreprises.length,
    devisEnAttente: devis.filter(d => d.statut === 'en-attente').length,
    devisValides: devis.filter(d => d.statut === 'valide').length,
    commandesActives: commandes.filter(c => ['commandee', 'en-cours'].includes(c.statut)).length,
    paiementsEnRetard: paiements.filter(p => p.statut === 'prevu' && p.datePrevue < new Date()).length
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <ClientOverview stats={stats} entreprises={entreprises} devis={devis} onNavigate={setCurrentView} />;
      case 'chat':
        return <ClientChat chantierId={chantierId} userProfile={userProfile} />;
      case 'documents':
        // Ajouter le nom d'entreprise aux devis
        const devisAvecEntreprise = devis.map(d => ({
          ...d,
          entrepriseNom: entreprises.find(e => e.id === d.entrepriseId)?.nom || 'Entreprise inconnue'
        }));
        return <ClientDocuments devis={devisAvecEntreprise} />;
      case 'planning':
        return <ClientPlanning chantierId={chantierId} />;
      case 'paiements':
        return <ClientPaiements paiements={paiements} entreprises={entreprises} />;
      default:
        return <ClientOverview stats={stats} entreprises={entreprises} devis={devis} onNavigate={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de votre chantier</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header client */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mon Chantier</h1>
              <p className="text-gray-600">{userProfile.displayName}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation client */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
              { id: 'chat', label: 'Messages', icon: MessageCircle },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'planning', label: 'Planning', icon: Calendar },
              { id: 'paiements', label: 'Paiements', icon: CreditCard }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${currentView === item.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}

// Vue d'ensemble pour le client
function ClientOverview({ stats, entreprises, devis, onNavigate }: any) {
  const progression = Math.round((stats.devisValides / Math.max(stats.devisValides + stats.devisEnAttente, 1)) * 100);

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white p-6">
        <h2 className="text-2xl font-bold mb-2">État d'avancement</h2>
        <p className="text-primary-100 mb-4">Votre chantier progresse bien !</p>

        <div className="bg-white/20 rounded-full h-3 mb-2">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${progression}%` }}
          />
        </div>
        <p className="text-sm text-primary-100">{progression}% des devis validés</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entreprises</p>
              <p className="text-xl font-bold text-gray-800">{stats.entreprises}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-gray-800">{stats.devisEnAttente}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Validés</p>
              <p className="text-xl font-bold text-gray-800">{stats.devisValides}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Commandes</p>
              <p className="text-xl font-bold text-gray-800">{stats.commandesActives}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      {stats.devisEnAttente > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Action requise</h3>
              <p className="text-sm text-yellow-700">
                {stats.devisEnAttente} devis en attente de votre validation
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="w-full md:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Consulter les devis
          </button>
        </div>
      )}

      {/* Guide d'utilisation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Votre espace client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-100 rounded">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Messages</p>
                <p className="text-sm text-gray-600">Communication directe avec votre professionnel</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-100 rounded">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Documents</p>
                <p className="text-sm text-gray-600">Consultez et validez vos devis</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-purple-100 rounded">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Planning</p>
                <p className="text-sm text-gray-600">Suivez les étapes et rendez-vous</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-orange-100 rounded">
                <CreditCard className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Suivi</p>
                <p className="text-sm text-gray-600">Avancement en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

