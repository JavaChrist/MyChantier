import { useState } from 'react';
import { Plus, Search, Phone, Mail, FileText, CreditCard, ShoppingCart, Edit2, Trash2, Wrench, Zap, Hammer, Paintbrush, DoorOpen } from 'lucide-react';
import { entreprisesService } from '../../firebase/entreprises';
import type { Entreprise } from '../../firebase/entreprises';
import { useChantier } from '../../contexts/ChantierContext';
import { useChantierData } from '../../hooks/useChantierData';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { EntrepriseForm } from './EntrepriseForm';
import { DevisManager } from './DevisManager';
import { CommandesManager } from './CommandesManager';
import { PaiementsManager } from './PaiementsManager';

// Couleurs par secteur d'activité
const COULEURS_SECTEURS = {
  sanitaire: { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500' },
  electricite: { bg: 'bg-yellow-600', text: 'text-yellow-100', border: 'border-yellow-500' },
  carrelage: { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-500' },
  menuiserie: { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
  peinture: { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500' }
};

export function EntreprisesManager() {
  const { chantierId, chantierActuel } = useChantier();
  const { entreprises, devis, commandes, paiements, loading, reloadData } = useChantierData(chantierId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);
  const [showDevis, setShowDevis] = useState<string | null>(null);
  const [showCommandes, setShowCommandes] = useState<string | null>(null);
  const [showPaiements, setShowPaiements] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entrepriseToDelete, setEntrepriseToDelete] = useState<Entreprise | null>(null);
  
  // Fonction pour compter les éléments par entreprise
  const getEntrepriseStats = (entrepriseId: string) => {
    return {
      devisCount: devis.filter(d => d.entrepriseId === entrepriseId).length,
      commandesCount: commandes.filter(c => c.entrepriseId === entrepriseId).length,
      paiementsCount: paiements.filter(p => p.entrepriseId === entrepriseId).length
    };
  };

  const secteurs = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  // Plus besoin de loadEntreprises car useChantierData s'en charge

  const filteredEntreprises = entreprises.filter(entreprise => {
    const matchesSearch = entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.contact.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSecteur = selectedSecteur === 'all' || entreprise.secteurActivite === selectedSecteur;
    return matchesSearch && matchesSecteur;
  });

  const handleAddEntreprise = () => {
    setSelectedEntreprise(null);
    setIsModalOpen(true);
  };

  const handleEditEntreprise = (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise);
    setIsModalOpen(true);
  };

  const handleSaveEntreprise = async (entrepriseData: Omit<Entreprise, 'id' | 'dateCreation'>) => {
    try {
      if (!chantierId) {
        alert('Aucun chantier sélectionné');
        return;
      }

      const finalData = {
        ...entrepriseData,
        chantierId // Ajouter automatiquement l'ID du chantier
      };

      if (selectedEntreprise?.id) {
        // Mise à jour - Système unifié V2
        await entreprisesService.updateInChantier(chantierId, selectedEntreprise.id, finalData);
      } else {
        // Création - Système unifié V2
        console.log(`🏗️ Création entreprise dans chantier ${chantierId} via EntreprisesManager`);
        const newId = await entreprisesService.createInChantier(chantierId, {
          ...finalData,
          dateCreation: new Date()
        });
        console.log(`✅ Entreprise créée avec ID: ${newId}`);
      }
      await reloadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Vérifiez votre configuration Firebase.');
    }
  };

  const handleDeleteEntreprise = (entreprise: Entreprise) => {
    setEntrepriseToDelete(entreprise);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntreprise = async () => {
    if (!entrepriseToDelete || !chantierId) return;

    try {
      console.log(`🗑️ Suppression entreprise ${entrepriseToDelete.nom} (${entrepriseToDelete.id}) du chantier ${chantierId}`);
      
      // Utiliser la bonne fonction pour la structure V2
      await entreprisesService.deleteInChantier(chantierId, entrepriseToDelete.id!);
      
      console.log('✅ Entreprise supprimée de Firebase');
      await reloadData();
      
      setShowDeleteConfirm(false);
      setEntrepriseToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('❌ Erreur lors de la suppression de l\'entreprise.');
    }
  };

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
  };

  const getSecteurCouleur = (secteur: string) => {
    return COULEURS_SECTEURS[secteur as keyof typeof COULEURS_SECTEURS] || COULEURS_SECTEURS.sanitaire;
  };

  const getSecteurIcon = (secteur: string) => {
    switch (secteur) {
      case 'sanitaire':
        return Wrench; // Plomberie
      case 'electricite':
        return Zap; // Électricité
      case 'carrelage':
        return Hammer; // Carrelage/Maçonnerie
      case 'menuiserie':
        return DoorOpen; // Menuiserie
      case 'peinture':
        return Paintbrush; // Peinture
      default:
        return Wrench;
    }
  };

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">Chargement des entreprises...</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Gestion des Entreprises</h1>
          <p className="text-gray-400 mobile-text">
            {chantierActuel ? `Chantier: ${chantierActuel.nom}` : 'Gérez vos entreprises partenaires'}
          </p>
        </div>
        <button
          onClick={handleAddEntreprise}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle entreprise</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <div>
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
          </div>
        </div>
      </div>

      {/* Légende des couleurs et icônes */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-100 mb-3">Couleurs et icônes par secteur :</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(COULEURS_SECTEURS).map(([secteur, couleur]) => {
            const SecteurIcon = getSecteurIcon(secteur);
            return (
              <div key={secteur} className="flex items-center space-x-2">
                <div className={`p-1 rounded ${couleur.bg} flex items-center justify-center`}>
                  <SecteurIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-300 capitalize">{getSecteurLabel(secteur)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des entreprises */}
      <div className="mobile-grid">
        {filteredEntreprises.map((entreprise) => {
          const couleur = getSecteurCouleur(entreprise.secteurActivite);
          return (
            <div
              key={entreprise.id}
              className={`card-mobile hover:bg-gray-750 transition-colors cursor-pointer border-l-4 ${couleur.border}`}
              onClick={() => handleEditEntreprise(entreprise)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${couleur.bg}`}>
                    {(() => {
                      const SecteurIcon = getSecteurIcon(entreprise.secteurActivite);
                      return <SecteurIcon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">{entreprise.nom}</h3>
                    <p className="text-sm text-gray-400">{getSecteurLabel(entreprise.secteurActivite)}</p>
                    {entreprise.siret && (
                      <p className="text-xs text-gray-500">SIRET: {entreprise.siret}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEntreprise(entreprise);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntreprise(entreprise);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{entreprise.contact.telephone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{entreprise.contact.email}</span>
                </div>
                <div className="text-sm text-gray-300">
                  {entreprise.contact.nom}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDevis(entreprise.id || null);
                    }}
                    className="flex-1 flex flex-col items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors relative"
                  >
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Devis</span>
                    </div>
                    {(() => {
                      const stats = getEntrepriseStats(entreprise.id || '');
                      return stats.devisCount > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-blue-400 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {stats.devisCount}
                        </span>
                      ) : null;
                    })()}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommandes(entreprise.id || null);
                    }}
                    className="flex-1 flex flex-col items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors relative"
                  >
                    <div className="flex items-center space-x-1">
                      <ShoppingCart className="w-3 h-3" />
                      <span>Commandes</span>
                    </div>
                    {(() => {
                      const stats = getEntrepriseStats(entreprise.id || '');
                      return stats.commandesCount > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-green-400 text-green-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {stats.commandesCount}
                        </span>
                      ) : null;
                    })()}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPaiements(entreprise.id || null);
                    }}
                    className="flex-1 flex flex-col items-center justify-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-xs text-white transition-colors relative"
                  >
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-3 h-3" />
                      <span>Paiements</span>
                    </div>
                    {(() => {
                      const stats = getEntrepriseStats(entreprise.id || '');
                      return stats.paiementsCount > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {stats.paiementsCount}
                        </span>
                      ) : null;
                    })()}
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400">
                Créée le {entreprise.dateCreation.toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEntreprises.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {chantierActuel ? `Aucune entreprise pour ${chantierActuel.nom}` : 'Aucune entreprise trouvée'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedSecteur !== 'all'
              ? 'Aucune entreprise ne correspond à vos critères de recherche'
              : chantierActuel
                ? `Ajoutez les entreprises qui travailleront sur le chantier "${chantierActuel.nom}"`
                : 'Commencez par ajouter votre première entreprise partenaire'
            }
          </p>
          {!searchTerm && selectedSecteur === 'all' && (
            <button onClick={handleAddEntreprise} className="btn-primary">
              Ajouter une entreprise pour ce chantier
            </button>
          )}
        </div>
      )}

      {/* Modal pour créer/modifier une entreprise */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEntreprise ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
        size="lg"
      >
        <EntrepriseForm
          entreprise={selectedEntreprise}
          onSave={handleSaveEntreprise}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Modal pour les devis */}
      {showDevis && (
        <Modal
          isOpen={true}
          onClose={() => setShowDevis(null)}
          title="Gestion des Devis"
          size="xl"
        >
          <DevisManager
            entrepriseId={showDevis}
            entrepriseName={entreprises.find(e => e.id === showDevis)?.nom || ''}
            chantierId={chantierId || ''}
          />
        </Modal>
      )}

      {/* Modal pour les commandes */}
      {showCommandes && (
        <Modal
          isOpen={true}
          onClose={() => setShowCommandes(null)}
          title="Gestion des Commandes"
          size="xl"
        >
          <CommandesManager
            entrepriseId={showCommandes}
            entrepriseName={entreprises.find(e => e.id === showCommandes)?.nom || ''}
            chantierId={chantierId || ''}
          />
        </Modal>
      )}

      {/* Modal pour les paiements */}
      {showPaiements && (
        <Modal
          isOpen={true}
          onClose={() => setShowPaiements(null)}
          title="Gestion des Paiements"
          size="xl"
        >
          <PaiementsManager
            entrepriseId={showPaiements}
            entrepriseName={entreprises.find(e => e.id === showPaiements)?.nom || ''}
            chantierId={chantierId || ''}
          />
        </Modal>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDeleteEntreprise}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setEntrepriseToDelete(null);
        }}
        title="Supprimer l'entreprise"
        message={`Voulez-vous vraiment supprimer l'entreprise "${entrepriseToDelete?.nom}" ?\n\nCette action supprimera également tous les devis, commandes et paiements associés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
