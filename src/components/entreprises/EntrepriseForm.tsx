import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import type { Entreprise } from '../../firebase/entreprises';

type EntrepriseFormData = Omit<Entreprise, 'id' | 'dateCreation'>;

interface EntrepriseFormProps {
  chantierId: string;
  entreprise: Entreprise | null;
  onSave: (entreprise: EntrepriseFormData) => void;
  onCancel: () => void;
}

const getEmptyFormData = (chantierId: string): EntrepriseFormData => ({
  nom: '',
  siret: '',
  secteurActivite: 'sanitaire',
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
  rib: {
    iban: '',
    bic: '',
    titulaire: '',
    banque: ''
  },
  notes: '',
  chantierId
});

const SECTEURS = [
  { value: 'sanitaire', label: 'Sanitaire' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'peinture', label: 'Peinture' }
];

export function EntrepriseForm({ chantierId, entreprise, onSave, onCancel }: EntrepriseFormProps) {
  const [formData, setFormData] = useState<EntrepriseFormData>(() => getEmptyFormData(chantierId));
  const [customSecteur, setCustomSecteur] = useState('');
  const secteurValues = SECTEURS.map(s => s.value);

  useEffect(() => {
    if (entreprise) {
      const isCustom = !secteurValues.includes(entreprise.secteurActivite);
      setCustomSecteur(isCustom ? entreprise.secteurActivite : '');
      setFormData({
        nom: entreprise.nom,
        siret: entreprise.siret || '',
        secteurActivite: entreprise.secteurActivite,
        contact: { ...entreprise.contact },
        adresse: { ...entreprise.adresse },
        rib: entreprise.rib || {
          iban: '',
          bic: '',
          titulaire: '',
          banque: ''
        },
        notes: entreprise.notes || '',
        chantierId: entreprise.chantierId
      });
    } else {
      setCustomSecteur('');
      setFormData(getEmptyFormData(chantierId));
    }
  }, [entreprise, chantierId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'secteurActivite') {
      setFormData(prev => ({
        ...prev,
        secteurActivite: value as Entreprise['secteurActivite']
      }));
      return;
    }

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as Record<string, string>) ?? {}),
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
                value={secteurValues.includes(formData.secteurActivite) ? formData.secteurActivite : 'autre'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'autre') {
                    handleInputChange('secteurActivite', customSecteur || '');
                  } else {
                    setCustomSecteur('');
                    handleInputChange('secteurActivite', value);
                  }
                }}
                className="input-field w-full"
              >
                {SECTEURS.map(secteur => (
                  <option key={secteur.value} value={secteur.value}>
                    {secteur.label}
                  </option>
                ))}
                <option value="autre">Autre...</option>
              </select>
              {!secteurValues.includes(formData.secteurActivite) && (
                <input
                  type="text"
                  value={customSecteur}
                  onChange={(e) => {
                    setCustomSecteur(e.target.value);
                    handleInputChange('secteurActivite', e.target.value);
                  }}
                  className="input-field w-full mt-2"
                  placeholder="Saisir un secteur personnalisé"
                />
              )}
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

        {/* Coordonnées bancaires */}
        <div className="form-section">
          <h3 className="form-title">Coordonnées bancaires (RIB)</h3>

          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IBAN
              </label>
              <input
                type="text"
                value={formData.rib?.iban ?? ''}
                onChange={(e) => handleInputChange('rib.iban', e.target.value.toUpperCase())}
                className="input-field w-full font-mono"
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                maxLength={34}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BIC/SWIFT
              </label>
              <input
                type="text"
                value={formData.rib?.bic ?? ''}
                onChange={(e) => handleInputChange('rib.bic', e.target.value.toUpperCase())}
                className="input-field w-full font-mono"
                placeholder="BNPAFRPP"
                maxLength={11}
              />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titulaire du compte
              </label>
              <input
                type="text"
                value={formData.rib?.titulaire ?? ''}
                onChange={(e) => handleInputChange('rib.titulaire', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: SARL Plomberie Martin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la banque
              </label>
              <input
                type="text"
                value={formData.rib?.banque ?? ''}
                onChange={(e) => handleInputChange('rib.banque', e.target.value)}
                className="input-field w-full"
                placeholder="Ex: BNP Paribas"
              />
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              💳 Ces informations seront communiquées au client pour les paiements
            </p>
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
