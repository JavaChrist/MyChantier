import { useState, useEffect } from 'react';
import { MessageCircle, Calendar, FileText, CreditCard, LogOut, User, Clock, CheckCircle, AlertCircle, Menu, X } from 'lucide-react';
import { useChantierData } from '../../hooks/useChantierData';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { ClientChat } from './ClientChat';
import { ClientEntreprises } from './ClientEntreprises';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chantierNom, setChantierNom] = useState('Mon Chantier');
  const { entreprises, devis, commandes, paiements, loading, reloadData } = useChantierData(chantierId);
  
  // Compter les messages non lus
  const unreadMessagesCount = useUnreadMessages(chantierId, 'client');
  
  // Charger le nom du chantier
  useEffect(() => {
    const loadChantierNom = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        const chantierDoc = await getDoc(doc(db, 'chantiers', chantierId));
        if (chantierDoc.exists()) {
          setChantierNom(chantierDoc.data().nom || 'Mon Chantier');
        }
      } catch (error) {
        console.error('Erreur chargement nom chantier:', error);
      }
    };
    loadChantierNom();
  }, [chantierId]);

  // Système de chargement des données via useChantierData

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
        return <ClientOverview stats={stats} onNavigate={setCurrentView} />;
      case 'entreprises':
        return <ClientEntreprises entreprises={entreprises} onNavigate={setCurrentView} />;
      case 'chat':
        return <ClientChat chantierId={chantierId} userProfile={userProfile} />;
      case 'documents':
        // Ajouter le nom d'entreprise aux devis
        const devisAvecEntreprise = devis.map(d => ({
          ...d,
          entrepriseNom: entreprises.find(e => e.id === d.entrepriseId)?.nom || 'Entreprise inconnue'
        }));
        return <ClientDocuments devis={devisAvecEntreprise} chantierId={chantierId} onReload={reloadData} entreprises={entreprises} />;
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

  const navItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'paiements', label: 'Paiements', icon: CreditCard }
  ];

  const handleNavChange = (viewId: string) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden max-w-full">
      {/* Header client */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 max-w-full" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="max-w-7xl mx-auto px-3 md:px-4 pb-3 md:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Bouton menu mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{chantierNom}</h1>
                <p className="text-sm text-gray-600">{userProfile.displayName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Badge messages non lus */}
              {unreadMessagesCount > 0 && (
                <button
                  onClick={() => setCurrentView('chat')}
                  className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title={`${unreadMessagesCount} nouveau${unreadMessagesCount > 1 ? 'x' : ''} message${unreadMessagesCount > 1 ? 's' : ''}`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                </button>
              )}
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation desktop (cachée sur mobile) */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {navItems.map(item => {
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

      {/* Menu mobile overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-2rem)] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header menu mobile */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Mon Chantier</h2>
                  <p className="text-sm text-gray-600">{userProfile.displayName}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation mobile */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer menu mobile */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 max-w-full overflow-x-hidden">
        {/* Message si aucune donnée disponible */}
        {!loading && entreprises.length === 0 && devis.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">Chantier en cours de configuration</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Votre chantier est en cours de configuration par votre professionnel.
                  Les entreprises, devis et autres informations apparaîtront ici une fois qu'ils auront été ajoutés.
                </p>
                <p className="text-xs text-yellow-600">
                  Chantier ID: <code className="bg-yellow-100 px-2 py-1 rounded">{chantierId}</code>
                </p>
              </div>
            </div>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

// Vue d'ensemble pour le client
function ClientOverview({ stats, onNavigate }: any) {
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
        <button
          onClick={() => onNavigate('entreprises')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entreprises</p>
              <p className="text-xl font-bold text-gray-800">{stats.entreprises}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('documents')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-yellow-200 transition-all cursor-pointer w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-gray-800">{stats.devisEnAttente}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('documents')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-green-200 transition-all cursor-pointer w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Validés</p>
              <p className="text-xl font-bold text-gray-800">{stats.devisValides}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('paiements')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Commandes</p>
              <p className="text-xl font-bold text-gray-800">{stats.commandesActives}</p>
            </div>
          </div>
        </button>
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

