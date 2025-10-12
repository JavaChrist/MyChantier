import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { PlanningChantier, TacheChantier, Commande, Entreprise } from '../../types';

interface PlanningFormProps {
  planning: PlanningChantier | null;
  commandes: Commande[];
  entreprises: Entreprise[];
  onSave: (planning: Partial<PlanningChantier>) => void;
  onCancel: () => void;
}

export function PlanningForm({ planning, commandes, entreprises, onSave, onCancel }: PlanningFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    notes: ''
  });

  const [taches, setTaches] = useState<Omit<TacheChantier, 'id'>[]>([]);

  useEffect(() => {
    if (planning) {
      setFormData({
        nom: planning.nom,
        adresse: planning.adresse,
        dateDebutPrevue: planning.dateDebutPrevue.toISOString().split('T')[0],
        dateFinPrevue: planning.dateFinPrevue.toISOString().split('T')[0],
        notes: planning.notes || ''
      });
      setTaches(planning.taches.map(t => ({
        commandeId: t.commandeId,
        nom: t.nom,
        description: t.description,
        dateDebutPrevue: t.dateDebutPrevue,
        dateFinPrevue: t.dateFinPrevue,
        dateDebutReelle: t.dateDebutReelle,
        dateFinReelle: t.dateFinReelle,
        dureeEstimee: t.dureeEstimee,
        statut: t.statut,
        dependances: t.dependances,
        notes: t.notes
      })));
    }
  }, [planning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const planningData: Partial<PlanningChantier> = {
      ...formData,
      dateDebutPrevue: new Date(formData.dateDebutPrevue),
      dateFinPrevue: new Date(formData.dateFinPrevue),
      taches: taches.map(t => ({
        ...t,
        id: crypto.randomUUID()
      }))
    };

    onSave(planningData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTache = () => {
    const newTache: Omit<TacheChantier, 'id'> = {
      commandeId: commandes[0]?.id || '',
      nom: '',
      description: '',
      dateDebutPrevue: new Date(),
      dateFinPrevue: new Date(),
      dureeEstimee: 1,
      statut: 'non-commencee',
      dependances: [],
      notes: ''
    };
    setTaches(prev => [...prev, newTache]);
  };

  const updateTache = (index: number, field: string, value: any) => {
    setTaches(prev => prev.map((tache, i) =>
      i === index ? { ...tache, [field]: value } : tache
    ));
  };

  const removeTache = (index: number) => {
    setTaches(prev => prev.filter((_, i) => i !== index));
  };

  const getEntrepriseNom = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId);
    if (!commande) return 'Commande inconnue';

    const entreprise = entreprises.find(e => e.id === commande.entrepriseId);
    return entreprise?.nom || 'Entreprise inconnue';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-100">Informations générales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du planning *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Rénovation Maison Dupont"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse du chantier *
            </label>
            <input
              type="text"
              required
              value={formData.adresse}
              onChange={(e) => handleInputChange('adresse', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 123 rue de la Paix, Paris"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de début prévue *
            </label>
            <input
              type="date"
              required
              value={formData.dateDebutPrevue}
              onChange={(e) => handleInputChange('dateDebutPrevue', e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de fin prévue *
            </label>
            <input
              type="date"
              required
              value={formData.dateFinPrevue}
              onChange={(e) => handleInputChange('dateFinPrevue', e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="input-field w-full resize-none"
            placeholder="Notes sur le planning..."
          />
        </div>
      </div>

      {/* Tâches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-100">Tâches</h3>
          <button
            type="button"
            onClick={addTache}
            className="btn-secondary flex items-center space-x-2 text-sm"
            disabled={commandes.length === 0}
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une tâche</span>
          </button>
        </div>

        {commandes.length === 0 && (
          <div className="text-center py-6 bg-gray-700 rounded-lg">
            <p className="text-gray-400">
              Aucune commande disponible pour créer des tâches
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Créez d'abord des commandes pour pouvoir planifier des tâches
            </p>
          </div>
        )}

        {taches.length === 0 && commandes.length > 0 && (
          <div className="text-center py-6 bg-gray-700 rounded-lg">
            <p className="text-gray-400">Aucune tâche ajoutée</p>
            <p className="text-sm text-gray-500 mt-1">
              Cliquez sur "Ajouter une tâche" pour commencer
            </p>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {taches.map((tache, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-100">Tâche {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeTache(index)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Commande *
                  </label>
                  <select
                    required
                    value={tache.commandeId}
                    onChange={(e) => updateTache(index, 'commandeId', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Sélectionner une commande</option>
                    {commandes.map(commande => (
                      <option key={commande.id} value={commande.id}>
                        {getEntrepriseNom(commande.id)} - {commande.numero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom de la tâche *
                  </label>
                  <input
                    type="text"
                    required
                    value={tache.nom}
                    onChange={(e) => updateTache(index, 'nom', e.target.value)}
                    className="input-field w-full"
                    placeholder="Ex: Démontage carrelage existant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={tache.description}
                  onChange={(e) => updateTache(index, 'description', e.target.value)}
                  rows={2}
                  className="input-field w-full resize-none"
                  placeholder="Description de la tâche..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date début prévue *
                  </label>
                  <input
                    type="date"
                    required
                    value={tache.dateDebutPrevue.toISOString().split('T')[0]}
                    onChange={(e) => updateTache(index, 'dateDebutPrevue', new Date(e.target.value))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date fin prévue *
                  </label>
                  <input
                    type="date"
                    required
                    value={tache.dateFinPrevue.toISOString().split('T')[0]}
                    onChange={(e) => updateTache(index, 'dateFinPrevue', new Date(e.target.value))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Durée (jours) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tache.dureeEstimee}
                    onChange={(e) => updateTache(index, 'dureeEstimee', parseInt(e.target.value))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{planning ? 'Modifier' : 'Créer'}</span>
        </button>
      </div>
    </form>
  );
}
