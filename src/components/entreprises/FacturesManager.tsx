import React, { useState, useEffect } from 'react';
import { FileText, Check, AlertCircle, Upload, Download, Eye, X, Trash2 } from 'lucide-react';
import { unifiedFacturesService, unifiedCommandesService, unifiedDevisService } from '../../firebase/unified-services';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config';
import type { Facture, Commande, Devis } from '../../firebase/unified-services';
import { ConfirmModal } from '../ConfirmModal';
import { useAlertModal } from '../AlertModal';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png'
];

const uploadFactureFile = async (entrepriseId: string, factureId: string, file: File): Promise<{ url: string; name: string }> => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Type de fichier non autorisé: ${file.type}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Le fichier est trop volumineux (max 10MB).');
  }

  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${cleanName}`;
  const filePath = `entreprises/${entrepriseId}/factures/${factureId}/${fileName}`;
  const storageRef = ref(storage, filePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return { url: downloadURL, name: file.name };
};

interface FacturesManagerProps {
  entrepriseId: string;
  entrepriseName: string;
  chantierId: string;
}

export function FacturesManager({ entrepriseId, entrepriseName, chantierId }: FacturesManagerProps) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [factureToDelete, setFactureToDelete] = useState<Facture | null>(null);
  const { showAlert, AlertModalComponent } = useAlertModal();

  useEffect(() => {
    loadData();
  }, [entrepriseId, chantierId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allFactures, allCommandes, allDevis] = await Promise.all([
        unifiedFacturesService.getByChantier(chantierId),
        unifiedCommandesService.getByChantier(chantierId),
        unifiedDevisService.getByChantier(chantierId)
      ]);
      setFactures(allFactures.filter(f => f.entrepriseId === entrepriseId));
      setCommandes(allCommandes.filter(c => c.entrepriseId === entrepriseId));
      setDevis(allDevis.filter(d => d.entrepriseId === entrepriseId));
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedFacture(null);
    setShowForm(true);
  };

  const handleEdit = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowForm(true);
  };

  const handleSave = async (data: Omit<Facture, 'id' | 'entrepriseId'>, file?: File) => {
    try {
      let factureId: string;
      const fullData = { ...data, entrepriseId };

      if (selectedFacture?.id) {
        await unifiedFacturesService.update(chantierId, selectedFacture.id, fullData);
        factureId = selectedFacture.id;
      } else {
        factureId = await unifiedFacturesService.create(chantierId, fullData);
      }

      if (file && factureId) {
        try {
          const uploaded = await uploadFactureFile(entrepriseId, factureId, file);
          await unifiedFacturesService.update(chantierId, factureId, {
            fichierUrl: uploaded.url,
            fichierNom: uploaded.name
          });
        } catch (uploadError) {
          console.error('Erreur upload facture:', uploadError);
          showAlert('Upload de la facture', `Erreur lors de l'upload du fichier: ${(uploadError as any).message}`, 'error');
        }
      }

      await loadData();
      setShowForm(false);
      setSelectedFacture(null);
    } catch (error) {
      console.error('Erreur sauvegarde facture:', error);
      showAlert('Erreur', 'Erreur lors de la sauvegarde de la facture.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!factureToDelete?.id) return;
    try {
      if (factureToDelete.fichierUrl) {
        try {
          const fileRef = ref(storage, factureToDelete.fichierUrl);
          await deleteObject(fileRef);
        } catch (err) {
          console.warn('Impossible de supprimer le fichier Storage:', err);
        }
      }
      await unifiedFacturesService.delete(chantierId, factureToDelete.id);
      await loadData();
      setFactureToDelete(null);
    } catch (error) {
      console.error('Erreur suppression facture:', error);
      showAlert('Erreur', 'Erreur lors de la suppression.', 'error');
    }
  };

  const getStatutLabel = (statut: Facture['statut']) => {
    switch (statut) {
      case 'payee':
        return 'Payée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'En attente';
    }
  };

  const getStatutColor = (statut: Facture['statut']) => {
    switch (statut) {
      case 'payee':
        return 'text-green-400 bg-green-400/10';
      case 'annulee':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const getStatutIcon = (statut: Facture['statut']) => {
    switch (statut) {
      case 'payee':
        return <Check className="w-4 h-4" />;
      case 'annulee':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Chargement des factures...</div>
        </div>
        <AlertModalComponent />
      </>
    );
  }

  if (showForm) {
    return (
      <>
        <FactureForm
          facture={selectedFacture}
          commandes={commandes}
          devis={devis}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedFacture(null);
          }}
          showAlert={showAlert}
        />
        <AlertModalComponent />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Factures - {entrepriseName}</h3>
          <p className="text-sm text-gray-400 mt-1">{factures.length} facture{factures.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Nouvelle facture</span>
        </button>
      </div>

      {factures.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucune facture</h4>
          <p className="text-gray-500 mb-4">
            Cette entreprise n'a pas encore de facture enregistrée
          </p>
          <button onClick={handleCreate} className="btn-primary">
            Ajouter une facture
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {factures.map((facture) => (
            <div
              key={facture.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-100">{facture.numero}</h4>
                  <p className="text-sm text-gray-300">{facture.prestationNom}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(facture.statut)}`}>
                    {getStatutIcon(facture.statut)}
                    <span>{getStatutLabel(facture.statut)}</span>
                  </div>
                  <button
                    onClick={() => handleEdit(facture)}
                    className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded"
                    title="Modifier"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFactureToDelete(facture)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {facture.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{facture.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Montant HT:</span>
                  <p className="text-gray-100 font-medium">{facture.montantHT.toLocaleString()} €</p>
                </div>
                <div>
                  <span className="text-gray-400">Montant TTC:</span>
                  <p className="text-gray-100 font-medium">{facture.montantTTC.toLocaleString()} €</p>
                </div>
                <div>
                  <span className="text-gray-400">Date émission:</span>
                  <p className="text-gray-100">{facture.dateEmission.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Échéance:</span>
                  <p className="text-gray-100">{facture.dateEcheance ? facture.dateEcheance.toLocaleDateString() : '—'}</p>
                </div>
              </div>

              {facture.fichierUrl && (
                <div className="flex items-center justify-between bg-gray-800 rounded p-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">
                      {facture.fichierNom || 'Fichier joint'}
                    </span>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={() => window.open(facture.fichierUrl, '_blank')}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
                      title="Voir le fichier"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={facture.fichierUrl}
                      download
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

      <ConfirmModal
        isOpen={!!factureToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setFactureToDelete(null)}
        title="Supprimer la facture"
        message={factureToDelete ? `Supprimer la facture "${factureToDelete.numero}" ?\n\nCette action est irréversible.` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
      <AlertModalComponent />
    </div>
  );
}

type FactureFormData = {
  numero: string;
  prestationNom: string;
  description: string;
  montantHT: string;
  montantTTC: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  statut: Facture['statut'];
  commandeId: string;
  devisId: string;
  notes: string;
};

function FactureForm({
  facture,
  commandes,
  devis,
  onSave,
  onCancel,
  showAlert
}: {
  facture: Facture | null;
  commandes: Commande[];
  devis: Devis[];
  onSave: (data: Omit<Facture, 'id' | 'entrepriseId'>, file?: File) => Promise<void> | void;
  onCancel: () => void;
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [formData, setFormData] = useState<FactureFormData>({
    numero: '',
    prestationNom: '',
    description: '',
    montantHT: '',
    montantTTC: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    datePaiement: '',
    statut: 'en-attente',
    commandeId: '',
    devisId: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (facture) {
      setFormData({
        numero: facture.numero,
        prestationNom: facture.prestationNom,
        description: facture.description || '',
        montantHT: facture.montantHT.toString(),
        montantTTC: facture.montantTTC.toString(),
        dateEmission: facture.dateEmission.toISOString().split('T')[0],
        dateEcheance: facture.dateEcheance ? facture.dateEcheance.toISOString().split('T')[0] : '',
        datePaiement: facture.datePaiement ? facture.datePaiement.toISOString().split('T')[0] : '',
        statut: facture.statut,
        commandeId: facture.commandeId || '',
        devisId: facture.devisId || '',
        notes: facture.notes || ''
      });
    }
  }, [facture]);

  const handleCommandeChange = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId);
    setFormData(prev => ({
      ...prev,
      commandeId,
      devisId: commande?.devisId || prev.devisId,
      prestationNom: commande?.prestationNom || prev.prestationNom,
      montantHT: commande ? commande.montantHT.toString() : prev.montantHT,
      montantTTC: commande ? commande.montantTTC.toString() : prev.montantTTC
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showAlert('Format non pris en charge', 'Type de fichier non autorisé. Utilisez PDF, Word, JPEG ou PNG.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Fichier trop volumineux', 'Le fichier est trop volumineux (max 10MB).', 'warning');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      await onSave(
        {
          numero: formData.numero,
          prestationNom: formData.prestationNom,
          description: formData.description,
          montantHT: parseFloat(formData.montantHT) || 0,
          montantTTC: parseFloat(formData.montantTTC) || 0,
          dateEmission: new Date(formData.dateEmission),
          dateEcheance: formData.dateEcheance ? new Date(formData.dateEcheance) : undefined,
          datePaiement: formData.datePaiement ? new Date(formData.datePaiement) : undefined,
          statut: formData.statut,
          commandeId: formData.commandeId || undefined,
          devisId: formData.devisId || undefined,
          notes: formData.notes
        },
        selectedFile || undefined
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form id="facture-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">
            {facture ? 'Modifier la facture' : 'Nouvelle facture'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Numéro de facture *
            </label>
            <input
              type="text"
              required
              value={formData.numero}
              onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: FAC-2025-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prestation
            </label>
            <input
              type="text"
              value={formData.prestationNom}
              onChange={(e) => setFormData(prev => ({ ...prev, prestationNom: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: Rénovation salle de bain"
            />
          </div>
        </div>

        {commandes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Commande liée
              </label>
              <select
                value={formData.commandeId}
                onChange={(e) => handleCommandeChange(e.target.value)}
                className="input-field w-full"
              >
                <option value="">— Aucune —</option>
                {commandes.map(commande => (
                  <option key={commande.id} value={commande.id}>
                    {commande.numero} - {commande.prestationNom}
                  </option>
                ))}
              </select>
            </div>
            {devis.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Devis lié
                </label>
                <select
                  value={formData.devisId}
                  onChange={(e) => setFormData(prev => ({ ...prev, devisId: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="">— Aucun —</option>
                  {devis.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.numero} - {d.prestationNom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="input-field w-full resize-none"
            placeholder="Description de la facture..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant HT (€) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={formData.montantHT}
              onChange={(e) => setFormData(prev => ({ ...prev, montantHT: e.target.value.replace(',', '.') }))}
              className="input-field w-full"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant TTC (€) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={formData.montantTTC}
              onChange={(e) => setFormData(prev => ({ ...prev, montantTTC: e.target.value.replace(',', '.') }))}
              className="input-field w-full"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date d'émission *
            </label>
            <input
              type="date"
              required
              value={formData.dateEmission}
              onChange={(e) => setFormData(prev => ({ ...prev, dateEmission: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date d'échéance
            </label>
            <input
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => setFormData(prev => ({ ...prev, dateEcheance: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as Facture['statut'] }))}
              className="input-field w-full"
            >
              <option value="en-attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
        </div>

        {formData.statut === 'payee' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de paiement
            </label>
            <input
              type="date"
              value={formData.datePaiement}
              onChange={(e) => setFormData(prev => ({ ...prev, datePaiement: e.target.value }))}
              className="input-field w-full md:w-1/3"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fichier de la facture
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
            {facture?.fichierUrl && !selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-blue-400">
                <FileText className="w-4 h-4" />
                <span>{facture.fichierNom || 'Fichier existant'}</span>
                <a
                  href={facture.fichierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Voir
                </a>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Formats acceptés: PDF, Word, JPEG, PNG. Taille max: 10MB
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
            placeholder="Notes internes..."
          />
        </div>
      </form>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="facture-form"
          disabled={uploading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {uploading && <Upload className="w-4 h-4 animate-spin" />}
          <span>{uploading ? 'Enregistrement...' : (facture ? 'Modifier' : 'Créer la facture')}</span>
        </button>
      </div>
    </div>
  );
}
