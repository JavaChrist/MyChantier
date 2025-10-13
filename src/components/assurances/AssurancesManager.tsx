import React, { useState, useEffect } from 'react';
import { Plus, Shield, FileText, Calendar, AlertTriangle, CheckCircle, Clock, Upload, Download, Eye, Edit2, Trash2, Building2 } from 'lucide-react';
import { entreprisesService } from '../../firebase/entreprises';
import { documentsService, uploadDocumentFile } from '../../firebase/documents';
import type { Entreprise } from '../../firebase/entreprises';
import type { DocumentOfficiel } from '../../firebase/documents';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';

export function AssurancesManager() {
  const [documents, setDocuments] = useState<(DocumentOfficiel & { entrepriseNom: string; secteur: string })[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterEntreprise, setFilterEntreprise] = useState<string>('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentOfficiel | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ entrepriseId: string; documentId: string } | null>(null);

  const typesDocuments = [
    { value: 'all', label: 'Tous les types' },
    { value: 'assurance-rc', label: 'Assurance RC' },
    { value: 'assurance-decennale', label: 'Assurance Décennale' },
    { value: 'garantie', label: 'Garantie' },
    { value: 'certification', label: 'Certification' },
    { value: 'kbis', label: 'KBIS' },
    { value: 'autre', label: 'Autre' }
  ];

  const statutsDocuments = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'valide', label: 'Valide' },
    { value: 'bientot-expire', label: 'Expire bientôt' },
    { value: 'expire', label: 'Expiré' },
    { value: 'en-attente', label: 'En attente' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const entreprisesData = await entreprisesService.getAll();
      setEntreprises(entreprisesData);

      // Charger tous les documents de toutes les entreprises
      const tousDocuments: (DocumentOfficiel & { entrepriseNom: string; secteur: string })[] = [];

      for (const entreprise of entreprisesData) {
        if (entreprise.id) {
          const documentsEntreprise = await documentsService.getByEntreprise(entreprise.id);
          const documentsAvecInfo = documentsEntreprise.map(doc => {
            // Calculer le statut automatiquement
            const statutCalcule = documentsService.calculateStatut(doc);
            return {
              ...doc,
              statut: statutCalcule,
              entrepriseNom: entreprise.nom,
              secteur: entreprise.secteurActivite
            };
          });
          tousDocuments.push(...documentsAvecInfo);
        }
      }

      // Trier par date d'expiration (plus urgent en premier)
      tousDocuments.sort((a, b) => {
        // Prioriser les documents qui expirent bientôt
        if (a.statut === 'expire' && b.statut !== 'expire') return -1;
        if (b.statut === 'expire' && a.statut !== 'expire') return 1;
        if (a.statut === 'bientot-expire' && b.statut === 'valide') return -1;
        if (b.statut === 'bientot-expire' && a.statut === 'valide') return 1;

        // Puis par date de fin
        if (a.dateFin && b.dateFin) {
          return a.dateFin.getTime() - b.dateFin.getTime();
        }

        return b.dateUpload.getTime() - a.dateUpload.getTime();
      });

      setDocuments(tousDocuments);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setDocuments([]);
      setEntreprises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setShowDocumentModal(true);
  };

  const handleEditDocument = (document: DocumentOfficiel) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentData: Omit<DocumentOfficiel, 'id' | 'entrepriseId'>, file: File) => {
    try {
      const documentId = crypto.randomUUID();

      // Upload du fichier
      const fileInfo = await uploadDocumentFile(documentData.entrepriseId || '', documentId, file);

      // Créer le document avec les infos du fichier
      const finalDocumentData = {
        ...documentData,
        fichierUrl: fileInfo.url,
        fichierNom: fileInfo.nom,
        tailleFichier: fileInfo.taille,
        typeFichier: fileInfo.type,
        dateUpload: new Date()
      };

      if (selectedDocument?.id) {
        await documentsService.update(selectedDocument.entrepriseId, selectedDocument.id, finalDocumentData);
      } else {
        await documentsService.create(documentData.entrepriseId || '', finalDocumentData);
      }

      await loadData();
      setShowDocumentModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  const handleDeleteDocument = (entrepriseId: string, documentId: string) => {
    setDocumentToDelete({ entrepriseId, documentId });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete) {
      try {
        await documentsService.delete(documentToDelete.entrepriseId, documentToDelete.documentId);
        await loadData();
        setShowConfirmModal(false);
        setDocumentToDelete(null);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatut = filterStatut === 'all' || doc.statut === filterStatut;
    const matchesEntreprise = filterEntreprise === 'all' || doc.entrepriseId === filterEntreprise;
    return matchesType && matchesStatut && matchesEntreprise;
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'valide':
        return 'text-green-400 bg-green-400/10';
      case 'bientot-expire':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'expire':
        return 'text-red-400 bg-red-400/10';
      case 'en-attente':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="w-4 h-4" />;
      case 'bientot-expire':
        return <Clock className="w-4 h-4" />;
      case 'expire':
        return <AlertTriangle className="w-4 h-4" />;
      case 'en-attente':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = typesDocuments.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getJoursRestants = (dateFin: Date | undefined) => {
    if (!dateFin) return null;
    const maintenant = new Date();
    const jours = Math.ceil((dateFin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));
    return jours;
  };

  // Statistiques
  const stats = {
    total: documents.length,
    valides: documents.filter(d => d.statut === 'valide').length,
    expiresBientot: documents.filter(d => d.statut === 'bientot-expire').length,
    expires: documents.filter(d => d.statut === 'expire').length
  };

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">Chargement des documents...</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Documents Officiels</h1>
          <p className="text-gray-400 mobile-text">Assurances, garanties, certifications et documents des entreprises</p>
        </div>
        <button
          onClick={handleCreateDocument}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau document</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total documents</p>
              <p className="text-lg font-bold text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Valides</p>
              <p className="text-lg font-bold text-green-400">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Expire bientôt</p>
              <p className="text-lg font-bold text-yellow-400">{stats.expiresBientot}</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Expirés</p>
              <p className="text-lg font-bold text-red-400">{stats.expires}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field w-full"
            >
              {typesDocuments.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="input-field w-full"
            >
              {statutsDocuments.map(statut => (
                <option key={statut.value} value={statut.value}>
                  {statut.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterEntreprise}
              onChange={(e) => setFilterEntreprise(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">Toutes les entreprises</option>
              {entreprises.map(entreprise => (
                <option key={entreprise.id} value={entreprise.id}>
                  {entreprise.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alertes pour les documents qui expirent */}
      {stats.expires > 0 || stats.expiresBientot > 0 ? (
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Attention - Documents à renouveler</span>
          </div>
          <div className="text-sm text-gray-300">
            {stats.expires > 0 && <p>• {stats.expires} document(s) expiré(s)</p>}
            {stats.expiresBientot > 0 && <p>• {stats.expiresBientot} document(s) expire(nt) dans les 30 prochains jours</p>}
          </div>
        </div>
      ) : null}

      {/* Liste des documents */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Documents officiels ({filteredDocuments.length})
        </h3>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">Aucun document</h4>
            <p className="text-gray-500 mb-4">
              {filterType !== 'all' || filterStatut !== 'all' || filterEntreprise !== 'all'
                ? 'Aucun document ne correspond aux filtres sélectionnés'
                : 'Commencez par ajouter les documents officiels de vos entreprises'
              }
            </p>
            {filterType === 'all' && filterStatut === 'all' && filterEntreprise === 'all' && (
              <button onClick={handleCreateDocument} className="btn-primary">
                Ajouter un document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredDocuments.map((document) => {
              const joursRestants = getJoursRestants(document.dateFin);

              return (
                <div
                  key={document.id}
                  className={`p-4 rounded-lg border-l-4 hover:bg-gray-750 transition-colors ${document.statut === 'expire' ? 'border-red-500 bg-red-600/5' :
                    document.statut === 'bientot-expire' ? 'border-yellow-500 bg-yellow-600/5' :
                      'border-green-500 bg-gray-700'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-600 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-100">{document.nom}</h4>
                        <p className="text-sm text-gray-300">{document.entrepriseNom}</p>
                        <p className="text-xs text-gray-400 capitalize">{document.secteur}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(document.statut)}`}>
                        {getStatutIcon(document.statut)}
                        <span>{document.statut}</span>
                      </div>

                      <div className="flex space-x-1">
                        <button
                          onClick={() => window.open(document.fichierUrl, '_blank')}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
                          title="Voir le document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={document.fichierUrl}
                          download={document.fichierNom}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEditDocument(document)}
                          className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.entrepriseId, document.id!)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-gray-100 font-medium">{getTypeLabel(document.type)}</p>
                    </div>
                    {document.numeroPolice && (
                      <div>
                        <span className="text-gray-400">N° Police:</span>
                        <p className="text-gray-100">{document.numeroPolice}</p>
                      </div>
                    )}
                    {document.dateFin && (
                      <div>
                        <span className="text-gray-400">Date fin:</span>
                        <p className={`${document.statut === 'expire' ? 'text-red-400' :
                          document.statut === 'bientot-expire' ? 'text-yellow-400' :
                            'text-gray-100'
                          }`}>
                          {document.dateFin.toLocaleDateString('fr-FR')}
                        </p>
                        {joursRestants !== null && (
                          <p className={`text-xs ${joursRestants < 0 ? 'text-red-400' :
                            joursRestants <= 30 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                            {joursRestants < 0 ? `Expiré depuis ${Math.abs(joursRestants)} jour(s)` :
                              joursRestants === 0 ? 'Expire aujourd\'hui' :
                                `Expire dans ${joursRestants} jour(s)`
                            }
                          </p>
                        )}
                      </div>
                    )}
                    {document.montantGarantie && (
                      <div>
                        <span className="text-gray-400">Garantie:</span>
                        <p className="text-gray-100 font-medium">{document.montantGarantie.toLocaleString()} €</p>
                      </div>
                    )}
                  </div>

                  {document.description && (
                    <p className="text-sm text-gray-300 mb-3">{document.description}</p>
                  )}

                  {document.compagnieAssurance && (
                    <div className="text-sm">
                      <span className="text-gray-400">Compagnie: </span>
                      <span className="text-gray-100">{document.compagnieAssurance}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-600 flex items-center justify-between text-xs text-gray-400">
                    <span>Uploadé le {document.dateUpload.toLocaleDateString('fr-FR')}</span>
                    <span>{(document.tailleFichier / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal pour créer/modifier un document */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        title={selectedDocument ? 'Modifier le document' : 'Nouveau document'}
        size="lg"
      >
        <DocumentForm
          document={selectedDocument}
          entreprises={entreprises}
          onSave={handleSaveDocument}
          onCancel={() => setShowDocumentModal(false)}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmModal(false);
          setDocumentToDelete(null);
        }}
        title="Supprimer le document"
        message="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}

// Composant formulaire pour créer/modifier un document
function DocumentForm({
  document,
  entreprises,
  onSave,
  onCancel
}: {
  document: DocumentOfficiel | null;
  entreprises: Entreprise[];
  onSave: (document: Omit<DocumentOfficiel, 'id' | 'entrepriseId'>, file: File) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    entrepriseId: '',
    type: 'assurance-rc' as const,
    nom: '',
    description: '',
    numeroPolice: '',
    compagnieAssurance: '',
    dateDebut: '',
    dateFin: '',
    montantGarantie: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        entrepriseId: document.entrepriseId,
        type: document.type,
        nom: document.nom,
        description: document.description,
        numeroPolice: document.numeroPolice || '',
        compagnieAssurance: document.compagnieAssurance || '',
        dateDebut: document.dateDebut?.toISOString().split('T')[0] || '',
        dateFin: document.dateFin?.toISOString().split('T')[0] || '',
        montantGarantie: document.montantGarantie?.toString() || '',
        notes: document.notes || ''
      });
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !document) {
      alert('Veuillez sélectionner un fichier.');
      return;
    }

    setUploading(true);

    try {
      const documentData: Omit<DocumentOfficiel, 'id' | 'entrepriseId'> = {
        type: formData.type,
        nom: formData.nom,
        description: formData.description,
        numeroPolice: formData.numeroPolice || undefined,
        compagnieAssurance: formData.compagnieAssurance || undefined,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
        dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
        montantGarantie: formData.montantGarantie ? parseFloat(formData.montantGarantie) : undefined,
        notes: formData.notes,
        statut: 'valide',
        fichierUrl: document?.fichierUrl || '',
        fichierNom: document?.fichierNom || '',
        tailleFichier: document?.tailleFichier || 0,
        typeFichier: document?.typeFichier || '',
        dateUpload: document?.dateUpload || new Date()
      };

      // Ajouter l'entrepriseId pour l'upload
      (documentData as any).entrepriseId = formData.entrepriseId;

      await onSave(documentData, selectedFile!);
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
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé. Utilisez PDF, Word ou Images.');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 15MB).');
        return;
      }

      setSelectedFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Entreprise
          </label>
          <select
            value={formData.entrepriseId}
            onChange={(e) => setFormData(prev => ({ ...prev, entrepriseId: e.target.value }))}
            className="input-field w-full"
          >
            <option value="">Sélectionner une entreprise</option>
            {entreprises.map(entreprise => (
              <option key={entreprise.id} value={entreprise.id}>
                {entreprise.nom} ({entreprise.secteurActivite})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type de document
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="assurance-rc">Assurance RC</option>
            <option value="assurance-decennale">Assurance Décennale</option>
            <option value="garantie">Garantie</option>
            <option value="certification">Certification</option>
            <option value="kbis">KBIS</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nom du document
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
          className="input-field w-full"
          placeholder="Ex: Assurance RC 2024"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
          className="input-field w-full resize-none"
          placeholder="Description du document..."
        />
      </div>

      {/* Champs spécifiques selon le type */}
      {['assurance-rc', 'assurance-decennale'].includes(formData.type) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              N° de police
            </label>
            <input
              type="text"
              value={formData.numeroPolice}
              onChange={(e) => setFormData(prev => ({ ...prev, numeroPolice: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: RC-2024-123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compagnie d'assurance
            </label>
            <input
              type="text"
              value={formData.compagnieAssurance}
              onChange={(e) => setFormData(prev => ({ ...prev, compagnieAssurance: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: AXA, Allianz..."
            />
          </div>
        </div>
      )}

      {formData.type === 'kbis' && (
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
          <p className="text-blue-400 text-sm">
            📋 Document KBIS : Extrait d'immatriculation au registre du commerce
          </p>
        </div>
      )}

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
            Date de fin
          </label>
          <input
            type="date"
            value={formData.dateFin}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant garanti (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.montantGarantie}
            onChange={(e) => setFormData(prev => ({ ...prev, montantGarantie: e.target.value }))}
            className="input-field w-full"
            placeholder="500000.00"
          />
        </div>
      </div>

      {/* Upload de fichier */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Fichier du document {document ? '(optionnel)' : '*'}
        </label>
        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700"
            required={!document}
          />
          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
          {document?.fichierUrl && !selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <FileText className="w-4 h-4" />
              <span>Document existant: {document.fichierNom}</span>
              <a
                href={document.fichierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Voir
              </a>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Formats acceptés: PDF, Word, Images. Taille max: 15MB
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
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Notes supplémentaires..."
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
          disabled={uploading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {uploading && <Upload className="w-4 h-4 animate-spin" />}
          <span>{uploading ? 'Enregistrement...' : (document ? 'Modifier' : 'Créer')}</span>
        </button>
      </div>
    </form>
  );
}
