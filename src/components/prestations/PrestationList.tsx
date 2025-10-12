import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { db } from '../../database';
import { Prestation, Entreprise } from '../../types';
import { Modal } from '../Modal';
import { PrestationForm } from './PrestationForm';

export function PrestationList() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null);

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
    { value: 'commande', label: 'Commandé' },
    { value: 'termine', label: 'Terminé' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allPrestations, allEntreprises] = await Promise.all([
        db.prestations.toArray(),
        db.entreprises.toArray()
      ]);
      setPrestations(allPrestations);
      setEntreprises(allEntreprises);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const filteredPrestations = prestations.filter(prestation => {
    const matchesSearch = prestation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSecteur = selectedSecteur === 'all' || prestation.secteur === selectedSecteur;
    const matchesStatut = selectedStatut === 'all' || prestation.statut === selectedStatut;
    return matchesSearch && matchesSecteur && matchesStatut;
  });

  const handleAddPrestation = () => {
    setSelectedPrestation(null);
    setIsModalOpen(true);
  };

  const handleEditPrestation = (prestation: Prestation) => {
    setSelectedPrestation(prestation);
    setIsModalOpen(true);
  };

  const handleSavePrestation = async (prestationData: Partial<Prestation>) => {
    try {
      if (selectedPrestation) {
        await db.prestations.update(selectedPrestation.id, prestationData);
      } else {
        const newPrestation: Prestation = {
          ...prestationData as Prestation,
          id: crypto.randomUUID(),
          dateCreation: new Date(),
          statut: 'en-cours'
        };
        await db.prestations.add(newPrestation);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const getEntrepriseNom = (entrepriseId: string) => {
    const entreprise = entreprises.find(e => e.id === entrepriseId);
    return entreprise?.nom || 'Entreprise inconnue';
  };

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
      case 'commande':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'termine':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Gestion des Prestations</h1>
          <p className="text-gray-400 mt-1">Gérez vos prestations par corps de métier</p>
        </div>
        <button
          onClick={handleAddPrestation}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle prestation</span>
        </button>
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

      {/* Liste des prestations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPrestations.map((prestation) => (
          <div key={prestation.id} className="card hover:bg-gray-750 transition-colors cursor-pointer">
            <div onClick={() => handleEditPrestation(prestation)}>
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Statut:</span>
                  <span className="text-gray-300">{getStatutLabel(prestation.statut)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Entreprises invitées:</span>
                  <span className="text-gray-300">{prestation.entreprisesInvitees.length}</span>
                </div>

                {prestation.entreprisesInvitees.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Entreprises:</p>
                    <div className="space-y-1">
                      {prestation.entreprisesInvitees.slice(0, 3).map((entrepriseId) => (
                        <div key={entrepriseId} className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                          {getEntrepriseNom(entrepriseId)}
                        </div>
                      ))}
                      {prestation.entreprisesInvitees.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{prestation.entreprisesInvitees.length - 3} autres...
                        </div>
                      )}
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
              : 'Commencez par créer votre première prestation'
            }
          </p>
          {!searchTerm && selectedSecteur === 'all' && selectedStatut === 'all' && (
            <button onClick={handleAddPrestation} className="btn-primary">
              Créer une prestation
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPrestation ? 'Modifier la prestation' : 'Nouvelle prestation'}
        size="lg"
      >
        <PrestationForm
          prestation={selectedPrestation}
          entreprises={entreprises}
          onSave={handleSavePrestation}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
