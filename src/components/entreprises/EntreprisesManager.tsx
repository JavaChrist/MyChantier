import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, FileText, CreditCard, ShoppingCart, Edit2, Trash2 } from 'lucide-react';
import { entreprisesService, devisService, commandesService, paiementsService } from '../../firebase/entreprises';
import type { Entreprise, Devis, Commande, Paiement } from '../../firebase/entreprises';
import { Modal } from '../Modal';
import { EntrepriseForm } from './EntrepriseForm';
import { DevisManager } from './DevisManager';
import { CommandesManager } from './CommandesManager';
import { PaiementsManager } from './PaiementsManager';

export function EntreprisesManager() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);
  const [showDevis, setShowDevis] = useState<string | null>(null);
  const [showCommandes, setShowCommandes] = useState<string | null>(null);
  const [showPaiements, setShowPaiements] = useState<string | null>(null);

  const secteurs = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setLoading(true);
      const data = await entreprisesService.getAll();
      setEntreprises(data);
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
      // En cas d'erreur Firebase (pas de config), utiliser des données de test
      setEntreprises([
        {
          id: '1',
          nom: 'Plomberie Martin',
          secteurActivite: 'sanitaire',
          contact: { nom: 'Jean Martin', telephone: '01 23 45 67 89', email: 'contact@plomberie-martin.fr' },
          adresse: { rue: '123 rue de la République', ville: 'Paris', codePostal: '75001' },
          dateCreation: new Date('2024-01-01')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
      if (selectedEntreprise?.id) {
        // Mise à jour
        await entreprisesService.update(selectedEntreprise.id, entrepriseData);
      } else {
        // Création
        await entreprisesService.create({
          ...entrepriseData,
          dateCreation: new Date()
        });
      }
      await loadEntreprises();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Vérifiez votre configuration Firebase.');
    }
  };

  const handleDeleteEntreprise = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      try {
        await entreprisesService.delete(id);
        await loadEntreprises();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
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
          <p className="text-gray-400 mobile-text">Gérez vos entreprises partenaires et leurs informations</p>
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

      {/* Liste des entreprises */}
      <div className="mobile-grid">
        {filteredEntreprises.map((entreprise) => (
          <div key={entreprise.id} className="card-mobile hover:bg-gray-750 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">{entreprise.nom}</h3>
                  <p className="text-sm text-gray-400">{getSecteurLabel(entreprise.secteurActivite)}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditEntreprise(entreprise)}
                  className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => entreprise.id && handleDeleteEntreprise(entreprise.id)}
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
                  onClick={() => setShowDevis(entreprise.id || null)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Devis</span>
                </button>
                <button
                  onClick={() => setShowCommandes(entreprise.id || null)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>Commandes</span>
                </button>
                <button
                  onClick={() => setShowPaiements(entreprise.id || null)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-xs text-white transition-colors"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Paiements</span>
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Créée le {entreprise.dateCreation.toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filteredEntreprises.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune entreprise trouvée</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedSecteur !== 'all'
              ? 'Aucune entreprise ne correspond à vos critères de recherche'
              : 'Commencez par ajouter votre première entreprise partenaire'
            }
          </p>
          {!searchTerm && selectedSecteur === 'all' && (
            <button onClick={handleAddEntreprise} className="btn-primary">
              Ajouter une entreprise
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
          />
        </Modal>
      )}
    </div>
  );
}
