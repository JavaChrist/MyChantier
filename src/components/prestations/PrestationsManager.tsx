import { useState, useEffect } from 'react';
import { Search, Users, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Icon } from '../Icon';
import type { Entreprise, Devis, Commande } from '../../firebase/unified-services';
import { useChantier } from '../../contexts/ChantierContext';
import { useChantierData } from '../../hooks/useChantierData';
import { Modal } from '../Modal';
import { DevisManager } from '../entreprises/DevisManager';

// Interface pour une prestation avec statut calculé
interface PrestationWithStatus {
  id: string;
  nom: string;
  description: string;
  secteur: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  entreprises: Entreprise[];
  statut: 'en-cours' | 'devis-recus' | 'commandes-actives' | 'termine';
  devis: Devis[];
  commandes: Commande[];
  dateCreation: Date;
}

export function PrestationsManager() {
  const { chantierId, chantierActuel } = useChantier();
  const { entreprises, devis, commandes, loading: dataLoading } = useChantierData(chantierId);

  const [prestations, setPrestations] = useState<PrestationWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [selectedEntrepriseForDevis, setSelectedEntrepriseForDevis] = useState<{ id: string; nom: string } | null>(null);

  const secteurs = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  const statuts = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'en-cours', label: 'En cours' },
    { value: 'devis-recus', label: 'Devis reçus' },
    { value: 'commandes-actives', label: 'Commandes actives' },
    { value: 'termine', label: 'Terminé' }
  ];

  useEffect(() => {
    if (!dataLoading && entreprises.length >= 0) {
      calculatePrestations();
    }
  }, [entreprises, devis, commandes, dataLoading]);

  const calculatePrestations = () => {
    try {
      // Créer les prestations basées sur les données du chantier actuel
      const prestationsMap = new Map<string, PrestationWithStatus>();

      // Grouper par prestation en utilisant les données filtrées
      devis.forEach(devisItem => {
        const entreprise = entreprises.find(e => e.id === devisItem.entrepriseId);
        if (!entreprise) return;

        const prestationKey = `${entreprise.id}-${entreprise.secteurActivite}`;

        if (!prestationsMap.has(prestationKey)) {
          prestationsMap.set(prestationKey, {
            id: prestationKey,
            nom: entreprise.nom,
            description: devisItem.description || devisItem.prestationNom || '',
            secteur: entreprise.secteurActivite,
            entreprises: [entreprise],
            statut: 'en-cours',
            devis: [devisItem],
            commandes: [],
            dateCreation: devisItem.dateRemise
          });
        } else {
          const prestation = prestationsMap.get(prestationKey)!;
          prestation.devis.push(devisItem);
          if (devisItem.dateRemise < prestation.dateCreation) {
            prestation.dateCreation = devisItem.dateRemise;
          }
          if (!prestation.description && devisItem.description) {
            prestation.description = devisItem.description;
          }
        }
      });

      // Ajouter les commandes aux prestations correspondantes
      commandes.forEach(commande => {
        const entreprise = entreprises.find(e => e.id === commande.entrepriseId);
        if (!entreprise) return;

        const prestationKey = `${entreprise.id}-${entreprise.secteurActivite}`;
        const prestation = prestationsMap.get(prestationKey);
        if (prestation) {
          prestation.commandes.push(commande);
        }
      });

      // Calculer les statuts automatiquement
      const prestationsArray = Array.from(prestationsMap.values()).map(prestation => {
        const statut = calculatePrestationStatus(prestation.devis, prestation.commandes);
        return { ...prestation, statut };
      });

      setPrestations(prestationsArray);
    } catch (error) {
      console.error('Erreur calcul prestations:', error);
      setPrestations([]);
    }
  };

  // Calculer le statut d'une prestation basé sur ses devis et commandes
  const calculatePrestationStatus = (devis: Devis[], commandes: Commande[]): PrestationWithStatus['statut'] => {
    const devisValides = devis.filter(d => d.statut === 'valide');
    const commandesLiees = commandes.filter(c => devis.some(d => d.id === c.devisId));

    if (commandesLiees.length === 0) {
      if (devisValides.length > 0) return 'devis-recus';
      return devis.length > 0 ? 'devis-recus' : 'en-cours';
    }

    // Il y a des commandes
    const commandesTerminees = commandesLiees.filter(c => c.statut === 'terminee');
    const commandesActives = commandesLiees.filter(c => ['commandee', 'en-cours'].includes(c.statut));

    if (commandesTerminees.length === commandesLiees.length) {
      return 'termine';
    }

    if (commandesActives.length > 0) {
      return 'commandes-actives';
    }

    return 'devis-recus';
  };

  const filteredPrestations = prestations.filter(prestation => {
    const matchesSearch = prestation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSecteur = selectedSecteur === 'all' || prestation.secteur === selectedSecteur;
    const matchesStatut = selectedStatut === 'all' || prestation.statut === selectedStatut;
    return matchesSearch && matchesSecteur && matchesStatut;
  });

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
  };

  const getStatutLabel = (statut: string) => {
    const statutObj = statuts.find(s => s.value === statut);
    return statutObj?.label || statut;
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en-cours':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'devis-recus':
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'commandes-actives':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'termine':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleVoirDevis = (entreprise: Entreprise) => {
    setSelectedEntrepriseForDevis({ id: entreprise.id!, nom: entreprise.nom });
    setShowDevisModal(true);
  };

  if (dataLoading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">
          Chargement des prestations {chantierActuel ? `du chantier "${chantierActuel.nom}"` : ''}...
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Gestion des Prestations</h1>
          <p className="text-gray-400 mobile-text">
            {chantierActuel
              ? `Prestations du chantier "${chantierActuel.nom}"`
              : 'Vue d\'ensemble de vos prestations par corps de métier'
            }
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une prestation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="input-field"
            >
              {secteurs.map(secteur => (
                <option key={secteur.value} value={secteur.value}>
                  {secteur.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="input-field"
            >
              {statuts.map(statut => (
                <option key={statut.value} value={statut.value}>
                  {statut.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuts.slice(1).map(statut => {
          const count = prestations.filter(p => p.statut === statut.value).length;
          return (
            <div key={statut.value} className="card-mobile">
              <div className="flex items-center space-x-2">
                {getStatutIcon(statut.value)}
                <div>
                  <p className="text-xs text-gray-400">{statut.label}</p>
                  <p className="text-lg font-bold text-gray-100">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liste des prestations */}
      <div className="mobile-grid">
        {filteredPrestations.map((prestation) => (
          <div key={prestation.id} className="card-mobile hover:bg-gray-750 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100">{prestation.nom}</h3>
                  <p className="text-sm text-gray-400">{getSecteurLabel(prestation.secteur)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {getStatutIcon(prestation.statut)}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300 line-clamp-2">
                {prestation.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Statut:</span>
                  <p className="text-gray-300 font-medium">{getStatutLabel(prestation.statut)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Entreprises:</span>
                  <p className="text-gray-300">{prestation.entreprises.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Devis:</span>
                  <p className="text-gray-300">{prestation.devis.length}</p>
                </div>
                <div>
                  <span className="text-gray-400">Commandes:</span>
                  <p className="text-gray-300">{prestation.commandes.length}</p>
                </div>
              </div>

              {/* Détail des entreprises */}
              {prestation.entreprises.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Entreprises impliquées:</p>
                  <div className="space-y-1">
                    {prestation.entreprises.slice(0, 3).map((entreprise) => (
                      <div key={entreprise.id} className="flex items-center justify-between text-xs bg-gray-700 px-2 py-1 rounded">
                        <span className="text-gray-300">{entreprise.nom}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVoirDevis(entreprise);
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer hover:opacity-80 ${prestation.devis.some(d => d.entrepriseId === entreprise.id && d.statut === 'valide')
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : prestation.devis.some(d => d.entrepriseId === entreprise.id)
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            title="Voir les devis de cette entreprise"
                          >
                            {prestation.devis.some(d => d.entrepriseId === entreprise.id && d.statut === 'valide')
                              ? 'Voir validé'
                              : prestation.devis.some(d => d.entrepriseId === entreprise.id)
                                ? 'Voir devis'
                                : 'Pas de devis'
                            }
                          </button>
                          {prestation.commandes.some(c => c.entrepriseId === entreprise.id) && (
                            <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                              Commandé
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {prestation.entreprises.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{prestation.entreprises.length - 3} autres...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Résumé financier */}
              {prestation.devis.length > 0 && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Devis validés:</span>
                      <p className="text-green-400 font-medium">
                        {prestation.devis.filter(d => d.statut === 'valide').length}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Montant total:</span>
                      <p className="text-gray-100 font-medium">
                        {prestation.devis
                          .filter(d => d.statut === 'valide')
                          .reduce((sum, d) => sum + d.montantTTC, 0)
                          .toLocaleString()} €
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>Créée le {prestation.dateCreation.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrestations.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune prestation trouvée</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedSecteur !== 'all' || selectedStatut !== 'all'
              ? 'Aucune prestation ne correspond à vos critères de recherche'
              : 'Les prestations sont automatiquement créées à partir de vos devis'
            }
          </p>
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Icon name="prestations" size={16} />
              <span className="text-sm font-medium">Comment créer une prestation ?</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <p>1. Crée une entreprise dans le secteur souhaité</p>
              <p>2. Ajoute un devis dans cette entreprise</p>
              <p>3. La prestation apparaîtra automatiquement ici</p>
            </div>
          </div>
        </div>
      )}

      {/* Légende des statuts */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-100 mb-3">Légende des statuts :</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300"><strong>En cours :</strong> Pas encore de devis reçus</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300"><strong>Devis reçus :</strong> Devis en attente de validation</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300"><strong>Commandes actives :</strong> Devis validés et commandés</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-300"><strong>Terminé :</strong> Toutes les commandes terminées</span>
          </div>
        </div>
      </div>

      {/* Modal pour voir les devis d'une entreprise */}
      {showDevisModal && selectedEntrepriseForDevis && (
        <Modal
          isOpen={true}
          onClose={() => setShowDevisModal(false)}
          title={`Devis - ${selectedEntrepriseForDevis.nom}`}
          size="xl"
        >
          <DevisManager
            entrepriseId={selectedEntrepriseForDevis.id}
            entrepriseName={selectedEntrepriseForDevis.nom}
            chantierId={chantierId || 'chantier-principal'}
          />
        </Modal>
      )}
    </div>
  );
}
