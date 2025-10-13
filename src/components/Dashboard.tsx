import React, { useState, useEffect } from 'react';
import { Building2, FileText, ShoppingCart, Calendar, AlertCircle, CheckCircle, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { entreprisesService, devisService, commandesService, paiementsService } from '../firebase/entreprises';
import { documentsService } from '../firebase/documents';
import { rendezVousService } from '../firebase/calendar';
import type { Entreprise, Devis, Commande, Paiement } from '../firebase/entreprises';
import type { DocumentOfficiel } from '../firebase/documents';
import type { RendezVous } from '../firebase/calendar';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger toutes les données
      const entreprises = await entreprisesService.getAll();

      // Charger les rendez-vous
      const rendezVous = await rendezVousService.getAll();

      let tousDevis: (Devis & { entrepriseNom: string })[] = [];
      let toutesCommandes: (Commande & { entrepriseNom: string })[] = [];
      let tousPaiements: (Paiement & { entrepriseNom: string })[] = [];
      let tousDocuments: (DocumentOfficiel & { entrepriseNom: string })[] = [];

      // Charger les données pour chaque entreprise
      for (const entreprise of entreprises) {
        if (entreprise.id) {
          const [devis, commandes, paiements, documents] = await Promise.all([
            devisService.getByEntreprise(entreprise.id),
            commandesService.getByEntreprise(entreprise.id),
            paiementsService.getByEntreprise(entreprise.id),
            documentsService.getByEntreprise(entreprise.id)
          ]);

          tousDevis.push(...devis.map(d => ({ ...d, entrepriseNom: entreprise.nom })));
          toutesCommandes.push(...commandes.map(c => ({ ...c, entrepriseNom: entreprise.nom })));
          tousPaiements.push(...paiements.map(p => ({ ...p, entrepriseNom: entreprise.nom })));
          tousDocuments.push(...documents.map(doc => ({ ...doc, entrepriseNom: entreprise.nom })));
        }
      }

      // Calculer les statistiques
      const maintenant = new Date();
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

      const rendezVousProchains = rendezVous.filter(rdv =>
        rdv.dateHeure >= maintenant &&
        rdv.dateHeure <= dans7Jours &&
        rdv.statut === 'planifie'
      ).length;

      setStats({
        entreprises: entreprises.length,
        devisEnAttente: tousDevis.filter(d => d.statut === 'en-attente').length,
        devisValides: tousDevis.filter(d => d.statut === 'valide').length,
        commandesActives: toutesCommandes.filter(c => ['commandee', 'en-cours'].includes(c.statut)).length,
        paiementsEnRetard,
        documentsExpires,
        rendezVousProchains
      });

      // Créer l'activité récente (derniers 10 événements)
      const activites: typeof recentActivity = [];

      // Devis récents
      tousDevis
        .sort((a, b) => b.dateRemise.getTime() - a.dateRemise.getTime())
        .slice(0, 3)
        .forEach(devis => {
          activites.push({
            type: 'devis',
            message: `Devis ${devis.statut} - ${devis.prestationNom}`,
            date: devis.dateRemise.toLocaleDateString(),
            entrepriseNom: devis.entrepriseNom
          });
        });

      // Commandes récentes
      toutesCommandes
        .sort((a, b) => b.dateCommande.getTime() - a.dateCommande.getTime())
        .slice(0, 3)
        .forEach(commande => {
          activites.push({
            type: 'commande',
            message: `Commande ${commande.statut} - ${commande.prestationNom}`,
            date: commande.dateCommande.toLocaleDateString(),
            entrepriseNom: commande.entrepriseNom
          });
        });

      // Paiements récents
      tousPaiements
        .filter(p => p.dateReglement || p.datePrevue < new Date())
        .sort((a, b) => {
          const dateA = a.dateReglement || a.datePrevue;
          const dateB = b.dateReglement || b.datePrevue;
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 2)
        .forEach(paiement => {
          const message = paiement.statut === 'regle'
            ? `Paiement reçu (${paiement.type})`
            : `Paiement en retard (${paiement.type})`;
          const date = paiement.dateReglement || paiement.datePrevue;

          activites.push({
            type: 'paiement',
            message,
            date: date.toLocaleDateString(),
            entrepriseNom: paiement.entrepriseNom
          });
        });

      // Documents récents
      tousDocuments
        .sort((a, b) => b.dateUpload.getTime() - a.dateUpload.getTime())
        .slice(0, 2)
        .forEach(document => {
          activites.push({
            type: 'document',
            message: `Document ajouté - ${document.nom}`,
            date: document.dateUpload.toLocaleDateString(),
            entrepriseNom: document.entrepriseNom
          });
        });

      // Rendez-vous récents et à venir
      rendezVous
        .filter(rdv => rdv.statut === 'planifie' && rdv.dateHeure >= maintenant)
        .sort((a, b) => a.dateHeure.getTime() - b.dateHeure.getTime())
        .slice(0, 3)
        .forEach(rdv => {
          const entreprise = entreprises.find(e => e.id === rdv.entrepriseId);
          activites.push({
            type: 'rendez-vous',
            message: `RDV prévu - ${rdv.titre}`,
            date: rdv.dateHeure.toLocaleDateString(),
            entrepriseNom: entreprise?.nom
          });
        });

      // Trier toute l'activité par date et prendre les 8 plus récents
      activites.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activites.slice(0, 8));

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      // En cas d'erreur, garder les données par défaut
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">Chargement du dashboard...</div>
      </div>
    );
  }


  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-400 mobile-text">Vue d'ensemble de vos chantiers</p>
      </div>

      {/* Statistiques */}
      <div className="mobile-grid">
        <div
          className="card-mobile hover:bg-gray-750 cursor-pointer transition-colors"
          onClick={() => handleCardClick('entreprises')}
        >
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
    </div>
  );
}
