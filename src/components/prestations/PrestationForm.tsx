import React, { useState, useEffect } from 'react';
import { Save, X, Check } from 'lucide-react';
import { Prestation, Entreprise } from '../../types';

interface PrestationFormProps {
  prestation: Prestation | null;
  entreprises: Entreprise[];
  onSave: (prestation: Partial<Prestation>) => void;
  onCancel: () => void;
}

export function PrestationForm({ prestation, entreprises, onSave, onCancel }: PrestationFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    secteur: 'sanitaire' as const,
    entreprisesInvitees: [] as string[]
  });

  const secteurs = [
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  useEffect(() => {
    if (prestation) {
      setFormData({
        nom: prestation.nom,
        description: prestation.description,
        secteur: prestation.secteur,
        entreprisesInvitees: [...prestation.entreprisesInvitees]
      });
    }
  }, [prestation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleEntreprise = (entrepriseId: string) => {
    setFormData(prev => ({
      ...prev,
      entreprisesInvitees: prev.entreprisesInvitees.includes(entrepriseId)
        ? prev.entreprisesInvitees.filter(id => id !== entrepriseId)
        : [...prev.entreprisesInvitees, entrepriseId]
    }));
  };

  // Filtrer les entreprises par secteur
  const entreprisesBySecteur = entreprises.filter(entreprise =>
    entreprise.secteurActivite === formData.secteur
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-100">Informations générales</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom de la prestation *
          </label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => handleInputChange('nom', e.target.value)}
            className="input-field w-full"
            placeholder="Ex: Rénovation salle de bain"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Secteur d'activité *
          </label>
          <select
            required
            value={formData.secteur}
            onChange={(e) => handleInputChange('secteur', e.target.value)}
            className="input-field w-full"
          >
            {secteurs.map(secteur => (
              <option key={secteur.value} value={secteur.value}>
                {secteur.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="input-field w-full resize-none"
            placeholder="Décrivez les travaux à réaliser..."
          />
        </div>
      </div>

      {/* Sélection des entreprises */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-100">Entreprises invitées</h3>
          <p className="text-sm text-gray-400 mt-1">
            Sélectionnez les entreprises à inviter pour cette prestation ({formData.secteur})
          </p>
        </div>

        {entreprisesBySecteur.length === 0 ? (
          <div className="text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">
              Aucune entreprise trouvée pour le secteur "{secteurs.find(s => s.value === formData.secteur)?.label}"
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Ajoutez d'abord des entreprises dans ce secteur d'activité
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entreprisesBySecteur.map((entreprise) => (
              <div
                key={entreprise.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${formData.entreprisesInvitees.includes(entreprise.id)
                    ? 'bg-primary-600 border-primary-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                onClick={() => toggleEntreprise(entreprise.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-100">{entreprise.nom}</h4>
                    <p className="text-sm text-gray-300">{entreprise.contact.nom}</p>
                    <p className="text-xs text-gray-400">{entreprise.contact.telephone}</p>
                  </div>
                  {formData.entreprisesInvitees.includes(entreprise.id) && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {formData.entreprisesInvitees.length > 0 && (
          <div className="text-sm text-gray-400">
            {formData.entreprisesInvitees.length} entreprise(s) sélectionnée(s)
          </div>
        )}
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
          disabled={formData.entreprisesInvitees.length === 0}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{prestation ? 'Modifier' : 'Créer'}</span>
        </button>
      </div>

      {formData.entreprisesInvitees.length === 0 && (
        <p className="text-xs text-red-400 text-center">
          Veuillez sélectionner au moins une entreprise
        </p>
      )}
    </form>
  );
}
