import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import type { Entreprise } from '../../firebase/entreprises';

interface EntrepriseFormProps {
  entreprise: Entreprise | null;
  onSave: (entreprise: Omit<Entreprise, 'id' | 'dateCreation'>) => void;
  onCancel: () => void;
}

export function EntrepriseForm({ entreprise, onSave, onCancel }: EntrepriseFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    secteurActivite: 'sanitaire' as const,
    contact: {
      nom: '',
      telephone: '',
      email: ''
    },
    adresse: {
      rue: '',
      ville: '',
      codePostal: ''
    },
    notes: ''
  });

  const secteurs = [
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  useEffect(() => {
    if (entreprise) {
      setFormData({
        nom: entreprise.nom,
        secteurActivite: entreprise.secteurActivite,
        contact: { ...entreprise.contact },
        adresse: { ...entreprise.adresse },
        notes: entreprise.notes || ''
      });
    }
  }, [entreprise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-100">Informations générales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Plomberie Martin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secteur d'activité *
            </label>
            <select
              required
              value={formData.secteurActivite}
              onChange={(e) => handleInputChange('secteurActivite', e.target.value)}
              className="input-field w-full"
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

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-100">Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du contact *
            </label>
            <input
              type="text"
              required
              value={formData.contact.nom}
              onChange={(e) => handleInputChange('contact.nom', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Jean Martin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              required
              value={formData.contact.telephone}
              onChange={(e) => handleInputChange('contact.telephone', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 01 23 45 67 89"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.contact.email}
            onChange={(e) => handleInputChange('contact.email', e.target.value)}
            className="input-field w-full"
            placeholder="Ex: contact@plomberie-martin.fr"
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-100">Adresse</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rue *
          </label>
          <input
            type="text"
            required
            value={formData.adresse.rue}
            onChange={(e) => handleInputChange('adresse.rue', e.target.value)}
            className="input-field w-full"
            placeholder="Ex: 123 rue de la République"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ville *
            </label>
            <input
              type="text"
              required
              value={formData.adresse.ville}
              onChange={(e) => handleInputChange('adresse.ville', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Paris"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Code postal *
            </label>
            <input
              type="text"
              required
              value={formData.adresse.codePostal}
              onChange={(e) => handleInputChange('adresse.codePostal', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 75001"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Notes supplémentaires sur l'entreprise..."
        />
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
          <span>{entreprise ? 'Modifier' : 'Créer'}</span>
        </button>
      </div>
    </form>
  );
}
