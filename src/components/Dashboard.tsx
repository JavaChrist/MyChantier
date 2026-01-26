import { useState, useEffect } from 'react';
import { FileText, ShoppingCart, Calendar, AlertCircle, CheckCircle, CreditCard, Clock, AlertTriangle, Wrench } from 'lucide-react';
import { ChantierChat } from './chat/ChantierChat';
import { useChantier } from '../contexts/ChantierContext';
import { useChantierData } from '../hooks/useChantierData';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { chantierId, chantierActuel, budgetActuel } = useChantier();
  const {
    entreprises,
    devis,
    commandes,
    paiements,
    documents,
    rendezVous,
    loading: dataLoading
  } = useChantierData(chantierId);

  const [stats, setStats] = useState({
    entreprises: 0,
    devisEnAttente: 0,
    devisValides: 0,
    commandesActives: 0,
    paiementsEnRetard: 0,
    documentsExpires: 0,
    rendezVousProchains: 0
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'devis' | 'commande' | 'paiement' | 'document' | 'rendez-vous';
    message: string;
    date: string;
    entrepriseNom?: string;
  }>>([]);

  // Recalculer les stats quand les données changent
  useEffect(() => {
    if (!dataLoading && entreprises.length >= 0) {
      calculateStats();
    }
  }, [entreprises, devis, commandes, paiements, documents, rendezVous, dataLoading]);

  const calculateStats = () => {
    try {
      // Calculer les statistiques avec les données du chantier actuel
      const maintenant = new Date();

      // Ajouter nom entreprise aux données
      const tousDevis = devis.map(d => ({
        ...d,
        entrepriseNom: entreprises.find(e => e.id === d.entrepriseId)?.nom || 'Entreprise inconnue'
      }));

      const toutesCommandes = commandes.map(c => ({
        ...c,
        entrepriseNom: entreprises.find(e => e.id === c.entrepriseId)?.nom || 'Entreprise inconnue'
      }));

      const tousPaiements = paiements.map(p => ({
        ...p,
        entrepriseNom: entreprises.find(e => e.id === p.entrepriseId)?.nom || 'Entreprise inconnue'
      }));

      const tousDocuments = documents.map(doc => ({
        ...doc,
        entrepriseNom: entreprises.find(e => e.id === doc.entrepriseId)?.nom || 'Entreprise inconnue'
      }));

      const paiementsEnRetard = tousPaiements.filter(p =>
        p.statut === 'prevu' && p.datePrevue < maintenant
      ).length;

      const documentsExpires = tousDocuments.filter(doc => {
        if (!doc.dateFin) return false;
        return doc.dateFin < maintenant;
      }).length;

      // Calculer les rendez-vous des 7 prochains jours
      const dans7Jours = new Date(maintenant);
      dans7Jours.setDate(dans7Jours.getDate() + 7);

      const rendezVousProchains = rendezVous.filter(rdv => {
        const dateDebut = rdv.dateDebut ?? rdv.dateFin;
        if (!dateDebut) return false;
        return (
          dateDebut >= maintenant &&
          dateDebut <= dans7Jours &&
          (rdv.statut === 'planifie' || rdv.statut === 'confirme')
        );
      }).length;

      setStats({
        entreprises: entreprises.length,
        devisEnAttente: tousDevis.filter(d => d.statut === 'en-attente').length,
        devisValides: tousDevis.filter(d => d.statut === 'valide').length,
        commandesActives: toutesCommandes.filter(c => ['commandee', 'en-cours'].includes(c.statut)).length,
        paiementsEnRetard,
        documentsExpires,
        rendezVousProchains
      });

      // Créer l'activité récente du chantier
      const activites: typeof recentActivity = [];

      // Activité basée sur les données du chantier actuel
      tousDevis.slice(0, 3).forEach(devis => {
        activites.push({
          type: 'devis',
          message: `Devis ${devis.statut} - ${devis.prestationNom}`,
          date: devis.dateRemise.toLocaleDateString(),
          entrepriseNom: devis.entrepriseNom
        });
      });

      toutesCommandes.slice(0, 2).forEach(commande => {
        activites.push({
          type: 'commande',
          message: `Commande ${commande.statut} - ${commande.prestationNom}`,
          date: commande.dateCommande.toLocaleDateString(),
          entrepriseNom: commande.entrepriseNom
        });
      });

      // Trier par date et prendre les plus récents
      activites.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activites.slice(0, 6));

    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
    }
  };

  const handleCardClick = (cardType: string) => {
    if (onNavigate) {
      switch (cardType) {
        case 'entreprises':
          onNavigate('entreprises');
          break;
        case 'devis':
          onNavigate('prestations');
          break;
        case 'commandes':
          onNavigate('prestations');
          break;
        case 'paiements':
          onNavigate('paiements');
          break;
        case 'documents':
          onNavigate('assurances');
          break;
        case 'planning':
          onNavigate('planning');
          break;
        default:
          break;
      }
    }
  };

  if (dataLoading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">
          Chargement des données {chantierActuel ? `du chantier "${chantierActuel.nom}"` : ''}...
        </div>
      </div>
    );
  }


  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-400 mobile-text">
          {chantierActuel
            ? `Vue d'ensemble du chantier "${chantierActuel.nom}"`
            : 'Vue d\'ensemble de vos chantiers'
          }
        </p>
      </div>

      {/* Statistiques */}
      <div className="mobile-grid">
        {chantierActuel && (
          <div
            className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
            onClick={() => handleCardClick('paiements')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-xs md:text-sm">Budget actif</p>
                <p className="text-xl md:text-2xl font-bold text-gray-100">
                  {(budgetActuel ?? chantierActuel.budget ?? 0).toLocaleString()} €
                </p>
              </div>
            </div>
          </div>
        )}
        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('entreprises')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Wrench className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Entreprises</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.entreprises}</p>
            </div>
          </div>
        </div>

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('devis')}
        >
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

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('commandes')}
        >
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

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('devis')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Devis validés</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.devisValides}</p>
            </div>
          </div>
        </div>

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('paiements')}
        >
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

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('documents')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Documents expirés</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.documentsExpires}</p>
            </div>
          </div>
        </div>

        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('planning')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs md:text-sm">RDV prochains (7j)</p>
              <p className="text-xl md:text-2xl font-bold text-gray-100">{stats.rendezVousProchains}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Activité récente</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune activité récente</h3>
            <p className="text-gray-500 mb-4">
              Commencez par créer des entreprises et ajouter des devis
            </p>
            <button
              onClick={() => handleCardClick('entreprises')}
              className="btn-primary"
            >
              Créer une entreprise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className="mt-1">
                  {activity.type === 'devis' && <FileText className="w-4 h-4 text-blue-400" />}
                  {activity.type === 'commande' && <ShoppingCart className="w-4 h-4 text-green-400" />}
                  {activity.type === 'paiement' && <CreditCard className="w-4 h-4 text-yellow-400" />}
                  {activity.type === 'document' && <FileText className="w-4 h-4 text-purple-400" />}
                  {activity.type === 'rendez-vous' && <Calendar className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-100 text-sm">{activity.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-400 text-xs">{activity.date}</p>
                    {activity.entrepriseNom && (
                      <p className="text-gray-500 text-xs">{activity.entrepriseNom}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module de dialogue client */}
      <div className="card">
        <ChantierChat />
      </div>
    </div>
  );
}
