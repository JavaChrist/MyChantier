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
    siret: '',
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
        siret: entreprise.siret || '',
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
    <div className="form-mobile">
      <form id="entreprise-form" onSubmit={handleSubmit} className="form-mobile">
        {/* Informations générales */}
        <div className="form-section">
          <h3 className="form-title">Informations générales</h3>

          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: Plomberie Martin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secteur d'activité
              </label>
              <select
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              N° SIRET
            </label>
            <input
              type="text"
              value={formData.siret}
              onChange={(e) => handleInputChange('siret', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 12345678901234"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 mt-1">
              Numéro SIRET à 14 chiffres (optionnel)
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="form-section">
          <h3 className="form-title">Contact</h3>

          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom du contact
              </label>
              <input
                type="text"
                value={formData.contact.nom}
                onChange={(e) => handleInputChange('contact.nom', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: Jean Martin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.contact.telephone}
                onChange={(e) => handleInputChange('contact.telephone', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: 01 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) => handleInputChange('contact.email', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: contact@plomberie-martin.fr"
            />
          </div>
        </div>

        {/* Adresse */}
        <div className="form-section">
          <h3 className="form-title">Adresse</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rue
            </label>
            <input
              type="text"
              value={formData.adresse.rue}
              onChange={(e) => handleInputChange('adresse.rue', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 123 rue de la République"
            />
          </div>

          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={formData.adresse.codePostal}
                onChange={(e) => handleInputChange('adresse.codePostal', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: 75001"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={formData.adresse.ville}
                onChange={(e) => handleInputChange('adresse.ville', e.target.value.toUpperCase())}
                className="input-field w-full"
                placeholder="Ex: PARIS"
                style={{ textTransform: 'uppercase' }}
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

      </form>

      {/* Actions - En dehors du scroll pour rester visibles */}
      <div className="form-actions">
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
          form="entreprise-form"
          className="btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{entreprise ? 'Modifier' : 'Créer'}</span>
        </button>
      </div>
    </div>
  );
}
