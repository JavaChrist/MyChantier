import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Euro, Check, X, AlertCircle, Upload, Download, Eye } from 'lucide-react';
import { devisService } from '../../firebase/entreprises';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import type { Devis } from '../../firebase/entreprises';

// Fonction d'upload réelle avec Firebase Storage
const uploadDevisFile = async (entrepriseId: string, devisId: string, file: File): Promise<string> => {
  try {
    console.log('Début upload:', file.name, 'Taille:', file.size);

    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`);
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 10MB).');
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;

    // Chemin dans Firebase Storage
    const filePath = `entreprises/${entrepriseId}/devis/${devisId}/${fileName}`;
    console.log('Chemin upload:', filePath);

    const storageRef = ref(storage, filePath);

    // Upload du fichier
    console.log('Upload en cours...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload terminé, récupération URL...');

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('URL obtenue:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Erreur détaillée upload:', error);
    throw error;
  }
};

interface DevisManagerProps {
  entrepriseId: string;
  entrepriseName: string;
}

export function DevisManager({ entrepriseId, entrepriseName }: DevisManagerProps) {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);

  useEffect(() => {
    loadDevis();
  }, [entrepriseId]);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.getByEntreprise(entrepriseId);
      setDevis(data);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
      // Données de test en cas d'erreur Firebase
      setDevis([
        {
          id: '1',
          entrepriseId,
          numero: 'DEV-2024-001',
          prestationNom: 'Rénovation salle de bain',
          description: 'Rénovation complète avec nouveaux équipements',
          montantHT: 8500,
          montantTTC: 10200,
          dateRemise: new Date('2024-01-15'),
          dateValidite: new Date('2024-02-15'),
          statut: 'en-attente'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevis = () => {
    setSelectedDevis(null);
    setShowForm(true);
  };

  const handleReceiveDevis = () => {
    // Fonction pour "recevoir" un devis (upload + création)
    setSelectedDevis(null);
    setShowForm(true);
  };

  const handleEditDevis = (devis: Devis) => {
    setSelectedDevis(devis);
    setShowForm(true);
  };

  const handleSaveDevis = async (devisData: Omit<Devis, 'id' | 'entrepriseId'>, file?: File) => {
    try {
      let devisId: string;

      if (selectedDevis?.id) {
        // Mise à jour
        await devisService.update(entrepriseId, selectedDevis.id, devisData);
        devisId = selectedDevis.id;
      } else {
        // Création
        devisId = await devisService.create(entrepriseId, devisData);
      }

      // Upload du fichier si fourni
      if (file && devisId) {
        try {
          console.log('Tentative upload fichier:', file.name);
          const fileUrl = await uploadDevisFile(entrepriseId, devisId, file);
          console.log('Upload réussi, mise à jour du devis avec URL:', fileUrl);

          // Mettre à jour le devis avec l'URL du fichier
          await devisService.update(entrepriseId, devisId, { fichierUrl: fileUrl });
          console.log('Devis mis à jour avec succès');
        } catch (uploadError) {
          console.error('Erreur upload:', uploadError);
          alert(`Erreur lors de l'upload du fichier: ${uploadError.message}`);
          // Le devis est créé mais sans fichier
        }
      }

      await loadDevis();
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du devis.');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en-attente':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'valide':
        return 'text-green-400 bg-green-400/10';
      case 'refuse':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en-attente':
        return <AlertCircle className="w-4 h-4" />;
      case 'valide':
        return <Check className="w-4 h-4" />;
      case 'refuse':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Chargement des devis...</div>
      </div>
    );
  }

  if (showForm) {
    return <DevisForm
      devis={selectedDevis}
      onSave={handleSaveDevis}
      onCancel={() => setShowForm(false)}
    />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Devis - {entrepriseName}</h3>
          <p className="text-sm text-gray-400 mt-1">{devis.length} devis au total</p>
        </div>
        <button
          onClick={handleReceiveDevis}
          className="btn-primary flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Recevoir un devis</span>
        </button>
      </div>

      {devis.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucun devis</h4>
          <p className="text-gray-500 mb-4">
            Cette entreprise n'a pas encore de devis enregistrés
          </p>
          <button onClick={handleReceiveDevis} className="btn-primary">
            Recevoir le premier devis
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {devis.map((devis) => (
            <div
              key={devis.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors cursor-pointer"
              onClick={() => handleEditDevis(devis)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-100">{devis.numero}</h4>
                  <p className="text-sm text-gray-300">{devis.prestationNom}</p>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(devis.statut)}`}>
                  {getStatutIcon(devis.statut)}
                  <span>{devis.statut}</span>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{devis.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Montant HT:</span>
                  <p className="text-gray-100 font-medium">{devis.montantHT.toLocaleString()} €</p>
                </div>
                <div>
                  <span className="text-gray-400">Montant TTC:</span>
                  <p className="text-gray-100 font-medium">{devis.montantTTC.toLocaleString()} €</p>
                </div>
                <div>
                  <span className="text-gray-400">Date remise:</span>
                  <p className="text-gray-100">{devis.dateRemise.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Validité:</span>
                  <p className="text-gray-100">{devis.dateValidite.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Fichier joint */}
              {devis.fichierUrl && (
                <div className="flex items-center justify-between bg-gray-800 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Fichier joint</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(devis.fichierUrl, '_blank');
                      }}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
                      title="Voir le fichier"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={devis.fichierUrl}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant formulaire pour créer/modifier un devis
function DevisForm({
  devis,
  onSave,
  onCancel
}: {
  devis: Devis | null;
  onSave: (devis: Omit<Devis, 'id' | 'entrepriseId'>, file?: File) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    numero: '',
    prestationNom: '',
    description: '',
    montantHT: '',
    montantTTC: '',
    dateRemise: '',
    dateValidite: '',
    statut: 'en-attente' as const,
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (devis) {
      setFormData({
        numero: devis.numero,
        prestationNom: devis.prestationNom,
        description: devis.description,
        montantHT: devis.montantHT.toString(),
        montantTTC: devis.montantTTC.toString(),
        dateRemise: devis.dateRemise.toISOString().split('T')[0],
        dateValidite: devis.dateValidite.toISOString().split('T')[0],
        statut: devis.statut,
        notes: devis.notes || ''
      });
    }
  }, [devis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      await onSave({
        numero: formData.numero,
        prestationNom: formData.prestationNom,
        description: formData.description,
        montantHT: parseFloat(formData.montantHT),
        montantTTC: parseFloat(formData.montantTTC),
        dateRemise: new Date(formData.dateRemise),
        dateValidite: new Date(formData.dateValidite),
        statut: formData.statut,
        notes: formData.notes
      }, selectedFile || undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/png'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé. Utilisez PDF, Word, JPEG ou PNG.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10MB).');
        return;
      }

      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <form id="devis-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">
            {devis ? 'Modifier le devis' : 'Nouveau devis'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Numéro de devis *
            </label>
            <input
              type="text"
              required
              value={formData.numero}
              onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: DEV-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prestation *
            </label>
            <input
              type="text"
              required
              value={formData.prestationNom}
              onChange={(e) => setFormData(prev => ({ ...prev, prestationNom: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: Rénovation salle de bain"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="input-field w-full resize-none"
            placeholder="Description détaillée des travaux..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant HT (€) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.montantHT}
              onChange={(e) => setFormData(prev => ({ ...prev, montantHT: e.target.value }))}
              className="input-field w-full"
              placeholder="8500.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant TTC (€) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.montantTTC}
              onChange={(e) => setFormData(prev => ({ ...prev, montantTTC: e.target.value }))}
              className="input-field w-full"
              placeholder="10200.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de remise *
            </label>
            <input
              type="date"
              required
              value={formData.dateRemise}
              onChange={(e) => setFormData(prev => ({ ...prev, dateRemise: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de validité *
            </label>
            <input
              type="date"
              required
              value={formData.dateValidite}
              onChange={(e) => setFormData(prev => ({ ...prev, dateValidite: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statut *
            </label>
            <select
              required
              value={formData.statut}
              onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
              className="input-field w-full"
            >
              <option value="en-attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="refuse">Refusé</option>
            </select>
          </div>
        </div>

        {/* Upload de fichier */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fichier du devis
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700"
            />
            {selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-green-400">
                <FileText className="w-4 h-4" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            {devis?.fichierUrl && !selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-blue-400">
                <FileText className="w-4 h-4" />
                <span>Fichier existant attaché</span>
                <a
                  href={devis.fichierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Voir
                </a>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Formats acceptés: PDF, Word (.doc, .docx), Images (JPEG, PNG). Taille max: 10MB
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="input-field w-full resize-none"
            placeholder="Notes supplémentaires..."
          />
        </div>

      </form>

      {/* Actions - En dehors du scroll pour rester visibles */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700 bg-gray-800 sticky bottom-0">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="devis-form"
          disabled={uploading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {uploading && <Upload className="w-4 h-4 animate-spin" />}
          <span>{uploading ? 'Enregistrement...' : (devis ? 'Modifier' : 'Recevoir le devis')}</span>
        </button>
      </div>
    </div>
  );
}
