import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, FileText, Shield } from 'lucide-react';
import { db } from '../../database';
import { Entreprise } from '../../types';
import { Modal } from '../Modal';
import { EntrepriseForm } from './EntrepriseForm';

export function EntrepriseList() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);

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
      const allEntreprises = await db.entreprises.toArray();
      setEntreprises(allEntreprises);
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
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

  const handleSaveEntreprise = async (entrepriseData: Partial<Entreprise>) => {
    try {
      if (selectedEntreprise) {
        // Mise à jour
        await db.entreprises.update(selectedEntreprise.id, entrepriseData);
      } else {
        // Création
        const newEntreprise: Entreprise = {
          ...entrepriseData as Entreprise,
          id: crypto.randomUUID(),
          dateCreation: new Date(),
          assurances: []
        };
        await db.entreprises.add(newEntreprise);
      }
      await loadEntreprises();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Gestion des Entreprises</h1>
          <p className="text-gray-400 mt-1">Gérez vos entreprises partenaires et leurs informations</p>
        </div>
        <button
          onClick={handleAddEntreprise}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle entreprise</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntreprises.map((entreprise) => (
          <div key={entreprise.id} className="card hover:bg-gray-750 transition-colors cursor-pointer">
            <div onClick={() => handleEditEntreprise(entreprise)}>
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
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{entreprise.contact.nom}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{entreprise.assurances.length} assurance(s)</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Créée le {entreprise.dateCreation.toLocaleDateString()}
                </p>
              </div>
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
    </div>
  );
}
