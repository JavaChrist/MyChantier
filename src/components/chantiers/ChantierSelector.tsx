import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, ArrowRight, Edit2 } from 'lucide-react';
import { AppIcon, Icon } from '../Icon';
import { chantierService } from '../../firebase/chantiers';
import type { Chantier } from '../../firebase/chantiers';
import { useChantier } from '../../contexts/ChantierContext';
import { Modal } from '../Modal';

interface ChantierSelectorProps {
  professionalId: string;
  professionalName: string;
}

export function ChantierSelector({ professionalId, professionalName }: ChantierSelectorProps) {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChantierModal, setShowNewChantierModal] = useState(false);
  const [showEditChantierModal, setShowEditChantierModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const { setChantierActuel, setChangtierId } = useChantier();

  // Fonction pour obtenir le chantier principal (avec infos sauvegardées)
  const getChantierPrincipal = (): Chantier => {
    const savedInfo = localStorage.getItem('chantier-principal-info');

    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      return {
        ...parsed,
        dateDebut: new Date(parsed.dateDebut),
        dateFinPrevue: new Date(parsed.dateFinPrevue),
        dateCreation: new Date(parsed.dateCreation),
        dateModification: new Date(parsed.dateModification)
      };
    }

    // Valeurs par défaut si pas de sauvegarde
    return {
      id: 'chantier-principal',
      nom: '🏠 Mes Données Existantes',
      description: 'Toutes vos données actuelles (entreprises, devis, etc.)',
      clientNom: 'Données existantes',
      clientEmail: 'vos-donnees@existantes.com',
      adresse: 'Toutes vos données actuelles',
      dateDebut: new Date('2024-01-01'),
      dateFinPrevue: new Date('2024-12-31'),
      budget: 0,
      statut: 'en-cours',
      professionalId: 'professional-1',
      dateCreation: new Date('2024-01-01'),
      dateModification: new Date()
    };
  };

  useEffect(() => {
    loadChantiers();
  }, [professionalId]);

  const loadChantiers = async () => {
    try {
      setLoading(true);

      // Obtenir le chantier principal (avec modifications sauvegardées)
      const chantierPrincipalActuel = getChantierPrincipal();

      // Charger les autres chantiers sauvegardés
      const savedChantiers = localStorage.getItem('chantiers');
      const chantiersFromStorage = savedChantiers ? JSON.parse(savedChantiers) : [];

      // Reconstituer les dates
      const chantiersWithDates = chantiersFromStorage.map((chantier: any) => ({
        ...chantier,
        dateDebut: new Date(chantier.dateDebut),
        dateFinPrevue: new Date(chantier.dateFinPrevue),
        dateFinReelle: chantier.dateFinReelle ? new Date(chantier.dateFinReelle) : undefined,
        dateCreation: new Date(chantier.dateCreation),
        dateModification: new Date(chantier.dateModification)
      }));

      // Chantier principal + autres chantiers
      setChantiers([chantierPrincipalActuel, ...chantiersWithDates]);
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
      setChantiers([getChantierPrincipal()]);
    } finally {
      setLoading(false);
    }
  };

  const saveChantiers = (newChantiers: Chantier[]) => {
    // Sauvegarder tous sauf le chantier principal
    const chantiersToSave = newChantiers.filter(c => c.id !== 'chantier-principal');
    localStorage.setItem('chantiers', JSON.stringify(chantiersToSave));
  };

  const handleSelectChantier = (chantier: Chantier) => {
    setChantierActuel(chantier);
    setChangtierId(chantier.id!);
  };

  const handleCreateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    try {
      // Créer le chantier avec un ID unique
      const newChantier: Chantier = {
        ...chantierData,
        id: `chantier-${Date.now()}`,
        professionalId,
        dateCreation: new Date(),
        dateModification: new Date()
      };

      // Ajouter à la liste et sauvegarder
      const newChantiers = [getChantierPrincipal(), newChantier, ...chantiers.filter(c => c.id !== 'chantier-principal')];
      setChantiers(newChantiers);
      saveChantiers(newChantiers);

      setShowNewChantierModal(false);
    } catch (error) {
      console.error('Erreur création chantier:', error);
      alert('Erreur lors de la création du chantier');
    }
  };

  const handleEditChantier = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setShowEditChantierModal(true);
  };

  const handleUpdateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    if (!selectedChantier) return;

    try {
      const updatedChantier: Chantier = {
        ...chantierData,
        id: selectedChantier.id,
        professionalId,
        dateCreation: selectedChantier.dateCreation,
        dateModification: new Date()
      };

      // Mettre à jour dans la liste
      const updatedChantiers = chantiers.map(c =>
        c.id === selectedChantier.id ? updatedChantier : c
      );
      setChantiers(updatedChantiers);

      // Sauvegarder (même le chantier principal peut être modifié)
      if (selectedChantier.id === 'chantier-principal') {
        // Sauvegarder les infos du chantier principal séparément
        localStorage.setItem('chantier-principal-info', JSON.stringify(updatedChantier));
      } else {
        saveChantiers(updatedChantiers);
      }

      setShowEditChantierModal(false);
      setSelectedChantier(null);
    } catch (error) {
      console.error('Erreur modification chantier:', error);
      alert('Erreur lors de la modification du chantier');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'bg-blue-100 text-blue-800';
      case 'en-cours':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      case 'suspendu':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'Planifié';
      case 'en-cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de vos chantiers</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AppIcon size={48} className="brightness-100" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bonjour {professionalName} !
          </h1>
          <p className="text-gray-600">
            Sélectionnez le chantier sur lequel vous souhaitez travailler
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowNewChantierModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau chantier</span>
          </button>
        </div>

        {/* Liste des chantiers */}
        {chantiers.length === 0 ? (
          <div className="text-center py-12">
            <AppIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun chantier</h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier chantier pour commencer à utiliser l'application
            </p>
            <button
              onClick={() => setShowNewChantierModal(true)}
              className="btn-primary"
            >
              Créer mon premier chantier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chantiers.map((chantier) => (
              <div
                key={chantier.id}
                onClick={() => handleSelectChantier(chantier)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                    <AppIcon size={32} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(chantier.statut)}`}>
                      {getStatutLabel(chantier.statut)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditChantier(chantier);
                      }}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier le chantier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      {chantier.nom}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {chantier.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{chantier.clientNom}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{chantier.adresse}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {chantier.dateDebut.toLocaleDateString('fr-FR')} → {chantier.dateFinPrevue.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {chantier.budget && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget :</span>
                        <span className="font-semibold text-gray-800">
                          {chantier.budget.toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flèche d'indication */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center text-primary-600 group-hover:text-primary-700 transition-colors">
                    <span className="text-sm font-medium mr-2">Ouvrir ce chantier</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nouveau chantier */}
        <Modal
          isOpen={showNewChantierModal}
          onClose={() => setShowNewChantierModal(false)}
          title="Nouveau chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            onSave={handleCreateChantier}
            onCancel={() => setShowNewChantierModal(false)}
          />
        </Modal>

        {/* Modal modification chantier */}
        <Modal
          isOpen={showEditChantierModal}
          onClose={() => setShowEditChantierModal(false)}
          title="Modifier le chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            chantier={selectedChantier}
            onSave={handleUpdateChantier}
            onCancel={() => setShowEditChantierModal(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

// Composant formulaire pour créer un nouveau chantier
function NewChantierForm({
  professionalId,
  chantier,
  onSave,
  onCancel
}: {
  professionalId: string;
  chantier?: Chantier | null;
  onSave: (chantier: Omit<Chantier, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    clientNom: '',
    clientEmail: '',
    clientTelephone: '',
    adresse: '',
    dateDebut: '',
    dateFinPrevue: '',
    budget: '',
    statut: 'planifie' as const,
    notes: ''
  });

  useEffect(() => {
    if (chantier) {
      setFormData({
        nom: chantier.nom,
        description: chantier.description,
        clientNom: chantier.clientNom,
        clientEmail: chantier.clientEmail,
        clientTelephone: chantier.clientTelephone || '',
        adresse: chantier.adresse,
        dateDebut: chantier.dateDebut.toISOString().split('T')[0],
        dateFinPrevue: chantier.dateFinPrevue.toISOString().split('T')[0],
        budget: chantier.budget?.toString() || '',
        statut: chantier.statut,
        notes: chantier.notes || ''
      });
    }
  }, [chantier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      nom: formData.nom,
      description: formData.description,
      clientNom: formData.clientNom,
      clientEmail: formData.clientEmail,
      clientTelephone: formData.clientTelephone,
      adresse: formData.adresse,
      dateDebut: new Date(formData.dateDebut),
      dateFinPrevue: new Date(formData.dateFinPrevue),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      statut: formData.statut,
      professionalId,
      notes: formData.notes,
      dateCreation: new Date(),
      dateModification: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du chantier
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Rénovation Maison Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="planifie">Planifié</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description du projet
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Description des travaux à réaliser..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du client
          </label>
          <input
            type="text"
            value={formData.clientNom}
            onChange={(e) => setFormData(prev => ({ ...prev, clientNom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: M. et Mme Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email du client
          </label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="input-field w-full"
            placeholder="client@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse du chantier
        </label>
        <input
          type="text"
          value={formData.adresse}
          onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
          className="input-field w-full"
          placeholder="123 rue de la Paix, 75001 Paris"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de début
          </label>
          <input
            type="date"
            value={formData.dateDebut}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de fin prévue
          </label>
          <input
            type="date"
            value={formData.dateFinPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFinPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            className="input-field w-full"
            placeholder="45000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Notes sur le chantier..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {chantier ? 'Modifier le chantier' : 'Créer le chantier'}
        </button>
      </div>
    </form>
  );
}
