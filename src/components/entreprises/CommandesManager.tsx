import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Euro, Check, X, AlertCircle, Upload, Download, Eye, Mail, ArrowRight } from 'lucide-react';
import { commandesService, devisService } from '../../firebase/entreprises';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import type { Commande, Devis } from '../../firebase/entreprises';

interface CommandesManagerProps {
  entrepriseId: string;
  entrepriseName: string;
}

// Fonction d'upload pour les devis signés
const uploadDevisSigneFile = async (entrepriseId: string, commandeId: string, file: File): Promise<string> => {
  try {
    console.log('Upload devis signé:', file.name);

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

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 10MB).');
    }

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_signe_${cleanName}`;

    const filePath = `entreprises/${entrepriseId}/commandes/${commandeId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Erreur upload devis signé:', error);
    throw error;
  }
};

export function CommandesManager({ entrepriseId, entrepriseName }: CommandesManagerProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [devisValides, setDevisValides] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [entrepriseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commandesData, devisData] = await Promise.all([
        commandesService.getByEntreprise(entrepriseId),
        devisService.getByEntreprise(entrepriseId)
      ]);

      setCommandes(commandesData);
      // Filtrer seulement les devis validés qui n'ont pas encore de commande
      const devisValidesDisponibles = devisData.filter(devis =>
        devis.statut === 'valide' &&
        !commandesData.some(commande => commande.devisId === devis.id)
      );
      setDevisValides(devisValidesDisponibles);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Données de test en cas d'erreur
      setCommandes([]);
      setDevisValides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommande = () => {
    setSelectedCommande(null);
    setShowForm(true);
  };

  const handleEditCommande = (commande: Commande) => {
    setSelectedCommande(commande);
    setShowForm(true);
  };

  const handleSaveCommande = async (commandeData: Omit<Commande, 'id' | 'entrepriseId'>, devisSigneFile?: File) => {
    try {
      let commandeId: string;

      if (selectedCommande?.id) {
        // Mise à jour
        await commandesService.update(entrepriseId, selectedCommande.id, commandeData);
        commandeId = selectedCommande.id;
      } else {
        // Création
        commandeId = await commandesService.create(entrepriseId, commandeData);
      }

      // Upload du devis signé si fourni
      if (devisSigneFile && commandeId) {
        try {
          const fileUrl = await uploadDevisSigneFile(entrepriseId, commandeId, devisSigneFile);
          // Mettre à jour la commande avec l'URL du devis signé
          await commandesService.update(entrepriseId, commandeId, { devisSigneUrl: fileUrl });
        } catch (uploadError) {
          console.error('Erreur upload devis signé:', uploadError);
          alert(`Erreur lors de l'upload du devis signé: ${uploadError.message}`);
        }
      }

      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la commande.');
    }
  };

  const handleSendEmail = async (commande: Commande) => {
    setSelectedCommande(commande);
    setShowEmailModal(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'commandee':
        return 'text-blue-400 bg-blue-400/10';
      case 'en-cours':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'terminee':
        return 'text-green-400 bg-green-400/10';
      case 'annulee':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'commandee':
        return <FileText className="w-4 h-4" />;
      case 'en-cours':
        return <AlertCircle className="w-4 h-4" />;
      case 'terminee':
        return <Check className="w-4 h-4" />;
      case 'annulee':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Chargement des commandes...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <CommandeForm
        commande={selectedCommande}
        devisValides={devisValides}
        onSave={handleSaveCommande}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showEmailModal && selectedCommande) {
    return (
      <EmailModal
        commande={selectedCommande}
        onClose={() => setShowEmailModal(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Commandes - {entrepriseName}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {commandes.length} commande(s) • {devisValides.length} devis validé(s) disponible(s)
          </p>
        </div>
        {devisValides.length > 0 && (
          <button
            onClick={handleCreateCommande}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle commande</span>
          </button>
        )}
      </div>

      {/* Message si pas de devis validés */}
      {devisValides.length === 0 && commandes.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucune commande</h4>
          <p className="text-gray-500 mb-4">
            Pour créer une commande, vous devez d'abord avoir un devis validé
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <span>Devis</span>
            <ArrowRight className="w-4 h-4" />
            <span>Statut "Validé"</span>
            <ArrowRight className="w-4 h-4" />
            <span>Commande</span>
          </div>
        </div>
      )}

      {/* Liste des commandes */}
      {commandes.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {commandes.map((commande) => (
            <div
              key={commande.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-100">{commande.numero}</h4>
                  <p className="text-sm text-gray-300">{commande.prestationNom}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(commande.statut)}`}>
                    {getStatutIcon(commande.statut)}
                    <span>{commande.statut}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Montant TTC:</span>
                  <p className="text-gray-100 font-medium">{commande.montantTTC.toLocaleString()} €</p>
                </div>
                <div>
                  <span className="text-gray-400">Date commande:</span>
                  <p className="text-gray-100">{commande.dateCommande.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Début prévu:</span>
                  <p className="text-gray-100">{commande.dateDebutPrevue.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Fin prévue:</span>
                  <p className="text-gray-100">{commande.dateFinPrevue.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Devis signé */}
              {commande.devisSigneUrl && (
                <div className="flex items-center justify-between bg-gray-800 rounded p-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">Devis signé</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => window.open(commande.devisSigneUrl, '_blank')}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
                      title="Voir le devis signé"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={commande.devisSigneUrl}
                      download
                      className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded"
                      title="Télécharger le devis signé"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditCommande(commande)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleSendEmail(commande)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  <span>Envoyer email</span>
                </button>
                {!commande.devisSigneUrl && (
                  <button
                    onClick={() => handleEditCommande(commande)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-xs text-white transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Devis signé</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant formulaire pour créer/modifier une commande
function CommandeForm({
  commande,
  devisValides,
  onSave,
  onCancel
}: {
  commande: Commande | null;
  devisValides: Devis[];
  onSave: (commande: Omit<Commande, 'id' | 'entrepriseId'>, devisSigneFile?: File) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    devisId: '',
    numero: '',
    prestationNom: '',
    montantHT: '',
    montantTTC: '',
    dateCommande: '',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    statut: 'commandee' as const
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (commande) {
      setFormData({
        devisId: commande.devisId,
        numero: commande.numero,
        prestationNom: commande.prestationNom,
        montantHT: commande.montantHT.toString(),
        montantTTC: commande.montantTTC.toString(),
        dateCommande: commande.dateCommande.toISOString().split('T')[0],
        dateDebutPrevue: commande.dateDebutPrevue.toISOString().split('T')[0],
        dateFinPrevue: commande.dateFinPrevue.toISOString().split('T')[0],
        statut: commande.statut
      });
    } else if (devisValides.length > 0) {
      // Pré-remplir avec le premier devis validé
      const premierDevis = devisValides[0];
      setFormData(prev => ({
        ...prev,
        devisId: premierDevis.id || '',
        prestationNom: premierDevis.prestationNom,
        montantHT: premierDevis.montantHT.toString(),
        montantTTC: premierDevis.montantTTC.toString(),
        dateCommande: new Date().toISOString().split('T')[0]
      }));
    }
  }, [commande, devisValides]);

  const handleDevisChange = (devisId: string) => {
    const devis = devisValides.find(d => d.id === devisId);
    if (devis) {
      setFormData(prev => ({
        ...prev,
        devisId,
        prestationNom: devis.prestationNom,
        montantHT: devis.montantHT.toString(),
        montantTTC: devis.montantTTC.toString()
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      await onSave({
        devisId: formData.devisId,
        numero: formData.numero,
        prestationNom: formData.prestationNom,
        montantHT: parseFloat(formData.montantHT),
        montantTTC: parseFloat(formData.montantTTC),
        dateCommande: new Date(formData.dateCommande),
        dateDebutPrevue: new Date(formData.dateDebutPrevue),
        dateFinPrevue: new Date(formData.dateFinPrevue),
        statut: formData.statut
      }, selectedFile || undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">
          {commande ? 'Modifier la commande' : 'Nouvelle commande'}
        </h3>
      </div>

      {!commande && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Devis de base *
          </label>
          <select
            required
            value={formData.devisId}
            onChange={(e) => handleDevisChange(e.target.value)}
            className="input-field w-full"
          >
            <option value="">Sélectionner un devis validé</option>
            {devisValides.map(devis => (
              <option key={devis.id} value={devis.id}>
                {devis.numero} - {devis.prestationNom} ({devis.montantTTC.toLocaleString()} €)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Numéro de commande *
          </label>
          <input
            type="text"
            required
            value={formData.numero}
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: CMD-2024-001"
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
            <option value="commandee">Commandée</option>
            <option value="en-cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
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
          placeholder="Nom de la prestation"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date commande *
          </label>
          <input
            type="date"
            required
            value={formData.dateCommande}
            onChange={(e) => setFormData(prev => ({ ...prev, dateCommande: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Début prévu *
          </label>
          <input
            type="date"
            required
            value={formData.dateDebutPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebutPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fin prévue *
          </label>
          <input
            type="date"
            required
            value={formData.dateFinPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFinPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant HT (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.montantHT}
            onChange={(e) => setFormData(prev => ({ ...prev, montantHT: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant TTC (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.montantTTC}
            onChange={(e) => setFormData(prev => ({ ...prev, montantTTC: e.target.value }))}
            className="input-field w-full"
          />
        </div>
      </div>

      {/* Upload devis signé */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Devis signé {commande ? '(optionnel)' : ''}
        </label>
        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
          />
          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
          {commande?.devisSigneUrl && !selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <FileText className="w-4 h-4" />
              <span>Devis signé existant</span>
              <a
                href={commande.devisSigneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Voir
              </a>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Téléchargez le devis signé par le client (PDF, Word, Image)
          </p>
        </div>
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
          disabled={uploading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {uploading && <Upload className="w-4 h-4 animate-spin" />}
          <span>{uploading ? 'Enregistrement...' : (commande ? 'Modifier' : 'Créer la commande')}</span>
        </button>
      </div>
    </form>
  );
}

// Composant modal pour l'envoi d'email
function EmailModal({
  commande,
  onClose
}: {
  commande: Commande;
  onClose: () => void;
}) {
  const [emailData, setEmailData] = useState({
    destinataire: '',
    sujet: `Commande ${commande.numero} - ${commande.prestationNom}`,
    message: `Bonjour,

Voici les détails de votre commande :

• Numéro : ${commande.numero}
• Prestation : ${commande.prestationNom}
• Montant TTC : ${commande.montantTTC.toLocaleString()} €
• Date de début prévue : ${commande.dateDebutPrevue.toLocaleDateString()}
• Date de fin prévue : ${commande.dateFinPrevue.toLocaleDateString()}

${commande.devisSigneUrl ? '• Le devis signé est disponible en téléchargement' : ''}

Cordialement,
L'équipe Suivi de Chantier`
  });

  const handleCopyToClipboard = () => {
    const fullEmail = `À: ${emailData.destinataire}
Objet: ${emailData.sujet}

${emailData.message}`;

    navigator.clipboard.writeText(fullEmail).then(() => {
      alert('Email copié dans le presse-papiers ! Tu peux le coller dans Ionos.');
    }).catch(() => {
      alert('Impossible de copier. Sélectionne et copie le texte manuellement.');
    });
  };

  const handleMailto = () => {
    const subject = encodeURIComponent(emailData.sujet);
    const body = encodeURIComponent(emailData.message);
    const to = emailData.destinataire ? encodeURIComponent(emailData.destinataire) : '';

    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;

    // Essayer d'ouvrir le client email
    const newWindow = window.open(mailtoLink, '_blank');

    // Si ça ne marche pas, proposer la copie
    setTimeout(() => {
      if (!newWindow || newWindow.closed) {
        if (confirm('Le client email ne s\'ouvre pas. Veux-tu copier le contenu pour le coller dans Ionos ?')) {
          handleCopyToClipboard();
        }
      }
    }, 1000);
  };

  const handleWebmail = (provider: string) => {
    const subject = encodeURIComponent(emailData.sujet);
    const body = encodeURIComponent(emailData.message);

    let url = '';
    switch (provider) {
      case 'gmail':
        url = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailData.destinataire}&su=${subject}&body=${body}`;
        break;
      case 'outlook':
        url = `https://outlook.live.com/mail/0/deeplink/compose?to=${emailData.destinataire}&subject=${subject}&body=${body}`;
        break;
      case 'ionos':
        url = `https://mail.ionos.fr/`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      if (provider === 'ionos') {
        handleCopyToClipboard();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Envoyer la commande par email</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email du destinataire
          </label>
          <input
            type="email"
            value={emailData.destinataire}
            onChange={(e) => setEmailData(prev => ({ ...prev, destinataire: e.target.value }))}
            className="input-field w-full"
            placeholder="client@exemple.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Objet
          </label>
          <input
            type="text"
            value={emailData.sujet}
            onChange={(e) => setEmailData(prev => ({ ...prev, sujet: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={emailData.message}
            onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
            rows={12}
            className="input-field w-full resize-none"
          />
        </div>

        {commande.devisSigneUrl && (
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Devis signé disponible</span>
            </div>
            <a
              href={commande.devisSigneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-300 hover:text-blue-200 underline"
            >
              Télécharger le devis signé pour l'attacher à ton email
            </a>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300">Options d'envoi :</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleMailto}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Client email par défaut</span>
          </button>

          <button
            onClick={() => handleWebmail('ionos')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Ionos Webmail</span>
          </button>

          <button
            onClick={() => handleWebmail('gmail')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Gmail</span>
          </button>

          <button
            onClick={() => handleWebmail('outlook')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 rounded-lg text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Outlook</span>
          </button>
        </div>

        <button
          onClick={handleCopyToClipboard}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-100 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Copier le contenu</span>
        </button>

        <div className="text-xs text-gray-500 text-center">
          Si ton client email ne s'ouvre pas, utilise "Copier le contenu" puis colle dans Ionos
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
