import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, User, MapPin, Phone, AlertCircle } from 'lucide-react';
import { useChantierData } from '../../hooks/useChantierData';
import { unifiedEtapesService, type Etape } from '../../firebase/unified-services';

interface ClientPlanningProps {
  chantierId: string;
}

export function ClientPlanning({ chantierId }: ClientPlanningProps) {
  // Utiliser les vraies données du chantier
  const { rendezVous: vraisRendezVous, commandes, entreprises } = useChantierData(chantierId);

  // DEBUG pour comprendre pourquoi les rendez-vous ne s'affichent pas côté client
  useEffect(() => {
    console.log('🔍 DEBUG CLIENT PLANNING:', {
      chantierId: chantierId,
      rendezVousTotal: vraisRendezVous.length,
      premier: vraisRendezVous[0]
    });

    if (vraisRendezVous.length > 0) {
      console.log('📅 Structure rendez-vous client:', vraisRendezVous.slice(0, 2).map(rv => ({
        titre: rv.titre,
        dateDebut: rv.dateDebut,
        dateHeure: rv.dateHeure,
        date: rv.date
      })));
    }
  }, [vraisRendezVous, chantierId]);

  // Utiliser les vraies données ou données vierges (plus de démo)
  const [rendezVousDemo] = useState([
    {
      id: '1',
      titre: 'Visite de chantier - Début des travaux',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
      heure: '09:00',
      entreprise: 'Plomberie Martin',
      secteur: 'Sanitaire',
      statut: 'planifie',
      notes: 'Début des travaux de plomberie'
    },
    {
      id: '2',
      titre: 'Livraison matériaux',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
      heure: '14:00',
      entreprise: 'Électricité Dupont',
      secteur: 'Électricité',
      statut: 'planifie',
      notes: 'Livraison des équipements électriques'
    },
    {
      id: '3',
      titre: 'Point d\'avancement',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
      heure: '16:00',
      entreprise: 'Réunion',
      secteur: 'Général',
      statut: 'planifie',
      notes: 'Réunion de suivi avec le professionnel'
    }
  ]);

  const [etapes, setEtapes] = useState<any[]>([]);

  // Charger les vraies étapes créées par l'administrateur
  useEffect(() => {
    loadEtapes();
  }, [chantierId, entreprises]);

  const loadEtapes = async () => {
    if (!chantierId) return;

    try {
      console.log(`🔍 Client: Chargement étapes Firebase V2 pour ${chantierId}`);

      const etapesData = await unifiedEtapesService.getByChantier(chantierId);

      // Adapter pour l'affichage client
      const etapesAdaptees = etapesData.map((etape: Etape) => ({
        ...etape,
        entreprise: entreprises.find(e => e.id === etape.entrepriseId)?.nom || 'Non assignée'
      }));

      setEtapes(etapesAdaptees);
      console.log(`✅ Client: ${etapesAdaptees.length} étapes chargées depuis Firebase V2`);
    } catch (error) {
      console.error('Erreur chargement étapes client:', error);
      setEtapes([]);
    }
  };

  const getStatutEtapeColor = (statut: string) => {
    switch (statut) {
      case 'terminee':
        return 'bg-green-500';
      case 'en-cours':
        return 'bg-blue-500';
      case 'planifiee':
      case 'planifie': // Compatibilité
        return 'bg-gray-300';
      case 'en-retard':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatutEtapeIcon = (statut: string) => {
    switch (statut) {
      case 'terminee':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'en-cours':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'planifiee':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const isToday = (date: Date | undefined) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFuture = (date: Date | undefined) => {
    if (!date) return false;
    return date > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Prochains rendez-vous */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Prochains rendez-vous</h2>

        {/* Utiliser vraies données + démo si vide */}
        {(() => {
          const rendezVousAffiches = vraisRendezVous; // Utiliser SEULEMENT les vraies données
          const rdvFuturs = rendezVousAffiches.filter(rdv => isFuture(rdv.dateDebut || rdv.dateHeure || rdv.date));

          return rdvFuturs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun rendez-vous planifié</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rdvFuturs
                .sort((a, b) => (a.dateDebut || a.dateHeure || a.date).getTime() - (b.dateDebut || b.dateHeure || b.date).getTime())
                .map((rdv) => {
                  const rdvDate = rdv.dateDebut || rdv.dateHeure || rdv.date;
                  const entrepriseNom = rdv.entreprise || entreprises.find(e => e.id === rdv.entrepriseId)?.nom || 'Entreprise';
                  return (
                    <div key={rdv.id} className={`border rounded-xl p-4 ${isToday(rdvDate) ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{rdv.titre}</h3>
                          <p className="text-sm text-gray-600">{rdv.notes}</p>
                        </div>
                        {isToday(rdvDate) && (
                          <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                            Aujourd'hui
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            {rdvDate?.toLocaleDateString('fr-FR') || 'Date non définie'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            {rdv.heure || rdvDate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{entrepriseNom}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })()}
      </div>

      {/* Timeline des étapes - Seulement pour les chantiers avec des données */}
      {vraisRendezVous.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Étapes du chantier</h2>

          <div className="space-y-6">
            {etapes.map((etape, index) => (
              <div key={etape.id} className="flex items-start space-x-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full ${getStatutEtapeColor(etape.statut)} flex items-center justify-center`}>
                    {getStatutEtapeIcon(etape.statut)}
                  </div>
                  {index < etapes.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{etape.nom}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${etape.statut === 'terminee' ? 'bg-green-100 text-green-800' :
                      etape.statut === 'en-cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {etape.statut === 'terminee' ? 'Terminée' :
                        etape.statut === 'en-cours' ? 'En cours' : 'Planifiée'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{etape.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Début :</span>
                      <p className="font-medium text-gray-800">
                        {etape.dateDebut.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fin prévue :</span>
                      <p className="font-medium text-gray-800">
                        {etape.dateFin.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Entreprise :</span>
                      <p className="font-medium text-gray-800">{etape.entreprise}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations pratiques */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-green-800 mb-3">Informations pratiques</h3>
        <div className="text-sm text-green-700 space-y-2">
          <p>• <strong>Présence requise :</strong> Votre présence peut être nécessaire pour certaines étapes</p>
          <p>• <strong>Accès au chantier :</strong> Assurez-vous que les entreprises peuvent accéder aux locaux</p>
          <p>• <strong>Modifications :</strong> Toute modification de planning vous sera communiquée</p>
          <p>• <strong>Questions :</strong> N'hésitez pas à contacter votre professionnel via la messagerie</p>
        </div>
      </div>
    </div>
  );
}
