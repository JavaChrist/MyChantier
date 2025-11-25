import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Download, X, FolderOpen } from 'lucide-react';
import { Modal } from '../Modal';
import { unifiedDevisService, unifiedDocumentsService } from '../../firebase/unified-services';
import { useAlertModal } from '../AlertModal';

type SecteurColor = {
  badgeBg: string;
  badgeText: string;
  borderLeft: string;
  dot: string;
  icon: string;
};

type DocumentGroup = {
  entreprise: any | null;
  documents: any[];
};

const secteurColors: Record<string, SecteurColor> = {
  sanitaire: { badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', borderLeft: 'border-l-blue-500', dot: 'bg-blue-500', icon: 'text-blue-600' },
  electricite: { badgeBg: 'bg-yellow-50', badgeText: 'text-yellow-700', borderLeft: 'border-l-yellow-500', dot: 'bg-yellow-500', icon: 'text-yellow-600' },
  carrelage: { badgeBg: 'bg-green-50', badgeText: 'text-green-700', borderLeft: 'border-l-green-500', dot: 'bg-green-500', icon: 'text-green-600' },
  menuiserie: { badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', borderLeft: 'border-l-orange-500', dot: 'bg-orange-500', icon: 'text-orange-600' },
  peinture: { badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', borderLeft: 'border-l-purple-500', dot: 'bg-purple-500', icon: 'text-purple-600' }
};

const getSecteurCouleur = (secteur?: string): SecteurColor => {
  if (secteur && secteurColors[secteur]) {
    return secteurColors[secteur];
  }
  return secteurColors.sanitaire;
};

interface ClientDocumentsProps {
  devis: any[];
  chantierId: string;
  onReload?: () => void;
  entreprises?: any[];
  initialFilter?: 'all' | 'en-attente' | 'valide' | 'refuse';
}

export function ClientDocuments({ devis, chantierId, onReload, entreprises = [], initialFilter = 'all' }: ClientDocumentsProps) {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<{ devis: any; decision: 'valide' | 'refuse' } | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [filterStatut, setFilterStatut] = useState<'all' | 'en-attente' | 'valide' | 'refuse'>(initialFilter);
  const { showAlert, AlertModalComponent } = useAlertModal();

  // Mettre à jour le filtre si initialFilter change
  useEffect(() => {
    setFilterStatut(initialFilter);
  }, [initialFilter]);

  // Charger les documents administratifs
  useEffect(() => {
    loadDocuments();
  }, [chantierId]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const docs = await unifiedDocumentsService.getByChantier(chantierId);
      setDocuments(docs);
      console.log(`✅ Client: ${docs.length} documents administratifs chargés`);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'valide':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en-attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refuse':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'valide':
        return '✅ Validé';
      case 'en-attente':
        return '⏳ En attente de validation';
      case 'refuse':
        return '❌ Refusé';
      default:
        return statut;
    }
  };

  const handleValidateDevis = (devisItem: any, decision: 'valide' | 'refuse') => {
    setValidationAction({ devis: devisItem, decision });
    setShowValidationModal(true);
  };

  const confirmValidation = async () => {
    if (!validationAction) return;

    try {
      const { devis: devisItem, decision } = validationAction;

      console.log(`🔄 Client ${decision} le devis:`, devisItem.id);

      // Sauvegarder la décision dans Firebase
      await unifiedDevisService.update(chantierId, devisItem.id, {
        statut: decision,
        dateValidation: new Date(),
        validePar: 'client'
      });

      console.log('✅ Décision enregistrée dans Firebase');

      setShowValidationModal(false);
      setValidationAction(null);

      // Recharger les données si la fonction est fournie
      if (onReload) {
        await onReload();
      }

      // Message de confirmation
      showAlert(
        decision === 'valide' ? 'Devis validé' : 'Devis refusé',
        decision === 'valide'
          ? 'Devis validé avec succès ! Le professionnel en sera informé.'
          : 'Devis refusé. Le professionnel en sera informé et pourra vous proposer une révision.',
        decision === 'valide' ? 'success' : 'warning'
      );

    } catch (error) {
      console.error('Erreur sauvegarde décision:', error);
      showAlert('Erreur', 'Erreur lors de l\'enregistrement de votre décision. Veuillez réessayer.', 'error');
    }
  };

  // Filtrer les devis selon le statut sélectionné
  const devisFiltres = filterStatut === 'all'
    ? devis
    : devis.filter(d => d.statut === filterStatut);

  // Regrouper les documents administratifs par entreprise
  const documentsParEntreprise = documents.reduce<Record<string, any[]>>((acc, doc) => {
    const key = doc.entrepriseId || 'autres';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {});

  const groupesConnus: DocumentGroup[] = entreprises
    .map(entreprise => ({
      entreprise,
      documents: documentsParEntreprise[entreprise.id] || []
    }))
    .filter(group => group.documents.length > 0);

  const entreprisesRestantes = Object.keys(documentsParEntreprise)
    .filter(key => key !== 'autres' && !entreprises.some(e => e.id === key))
    .map(key => ({
      entreprise: {
        id: key,
        nom: documentsParEntreprise[key][0]?.entrepriseNom || 'Entreprise inconnue',
        secteurActivite: documentsParEntreprise[key][0]?.secteurActivite || 'sanitaire'
      },
      documents: documentsParEntreprise[key]
    }));

  const documentsGroupes: DocumentGroup[] = [
    ...groupesConnus,
    ...entreprisesRestantes,
    ...(documentsParEntreprise.autres
      ? [{ entreprise: null, documents: documentsParEntreprise.autres }]
      : [])
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Vos documents</h2>
            <p className="text-sm text-gray-600">Devis, contrats et documents de votre chantier</p>
          </div>

          {/* Filtres par statut */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterStatut('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatut === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Tous ({devis.length})
            </button>
            <button
              onClick={() => setFilterStatut('en-attente')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatut === 'en-attente'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              En attente ({devis.filter(d => d.statut === 'en-attente').length})
            </button>
            <button
              onClick={() => setFilterStatut('valide')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatut === 'valide'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Validés ({devis.filter(d => d.statut === 'valide').length})
            </button>
            <button
              onClick={() => setFilterStatut('refuse')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatut === 'refuse'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Refusés ({devis.filter(d => d.statut === 'refuse').length})
            </button>
          </div>
        </div>

        {devisFiltres.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun document</h3>
            <p className="text-gray-500">
              Les devis et documents apparaîtront ici dès qu'ils seront disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devisFiltres.map((devisItem: any) => (
              <div
                key={devisItem.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{devisItem.prestationNom}</h3>
                    <p className="text-gray-600 mb-3">{devisItem.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatutColor(devisItem.statut)}`}>
                    {getStatutLabel(devisItem.statut)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Montant TTC</span>
                    <p className="text-lg font-bold text-gray-800">
                      {devisItem.montantTTC?.toLocaleString() || 'N/A'} €
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Date de remise</span>
                    <p className="text-sm font-medium text-gray-800">
                      {devisItem.dateRemise?.toLocaleDateString('fr-FR') || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Numéro</span>
                    <p className="text-sm font-medium text-gray-800">{devisItem.numero || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Entreprise</span>
                    <p className="text-sm font-medium text-gray-800">{devisItem.entrepriseNom || 'N/A'}</p>
                  </div>
                </div>

                {/* Actions selon le statut */}
                {devisItem.statut === 'en-attente' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Action requise</h4>
                    <p className="text-sm text-yellow-700 mb-4">
                      Ce devis attend votre validation. Prenez le temps de l'examiner attentivement.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleValidateDevis(devisItem, 'valide')}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                      >
                        ✅ Valider ce devis
                      </button>
                      <button
                        onClick={() => handleValidateDevis(devisItem, 'refuse')}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                      >
                        ❌ Refuser ce devis
                      </button>
                    </div>
                  </div>
                )}

                {/* Lien vers le document */}
                {devisItem.fichierUrl ? (
                  <a
                    href={devisItem.fichierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Consulter le document PDF</span>
                  </a>
                ) : (
                  <div className="w-full text-center py-3 bg-gray-100 text-gray-500 rounded-lg">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <span>Document en préparation</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide validation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3">Comment valider un devis ?</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>Consultez</strong> attentivement le détail des travaux proposés</p>
          <p>• <strong>Vérifiez</strong> les montants et les délais indiqués</p>
          <p>• <strong>Téléchargez</strong> le PDF pour une consultation détaillée</p>
          <p>• <strong>Validez ou refusez</strong> directement depuis cette interface</p>
          <p>• <strong>Contactez</strong> votre professionnel via la messagerie si vous avez des questions</p>
        </div>
      </div>

      {/* Documents administratifs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Documents administratifs</h2>
              <p className="text-sm text-gray-600">Contrats, attestations et autres documents officiels</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </div>
        </div>

        {loadingDocs ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement des documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun document administratif</h3>
            <p className="text-gray-500">
              Les documents officiels (contrats, attestations, etc.) apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {documentsGroupes.map((groupe, index) => {
              const couleur = getSecteurCouleur(groupe.entreprise?.secteurActivite);
              const titre = groupe.entreprise?.nom || 'Documents généraux';
              const sousTitre = groupe.entreprise
                ? groupe.entreprise.secteurActivite || 'Corps de métier'
                : 'Sans entreprise associée';

              return (
                <div
                  key={groupe.entreprise?.id || `autres-${index}`}
                  className={`bg-white border border-gray-100 rounded-xl shadow-sm border-l-4 ${couleur.borderLeft} p-4`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${couleur.dot}`} />
                      <div>
                        <p className="font-semibold text-gray-800">{titre}</p>
                        <span className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full ${couleur.badgeBg} ${couleur.badgeText}`}>
                          {sousTitre}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {groupe.documents.length} document{groupe.documents.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {groupe.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${couleur.badgeBg}`}>
                              <FileText className={`w-5 h-5 ${couleur.icon}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">{doc.nom}</h4>
                              <p className="text-sm text-gray-600">{doc.type || 'Document officiel'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Ajouté le {doc.dateUpload?.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {doc.fichierUrl ? (
                              <a
                                href={doc.fichierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                              >
                                <Download className="w-4 h-4" />
                                <span>Télécharger</span>
                              </a>
                            ) : (
                              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                                Document en préparation
                              </div>
                            )}
                          </div>
                        </div>

                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-3">{doc.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de confirmation */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={`${validationAction?.decision === 'valide' ? 'Valider' : 'Refuser'} le devis`}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${validationAction?.decision === 'valide' ? 'bg-green-100' : 'bg-red-100'
              }`}>
              {validationAction?.decision === 'valide' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <X className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {validationAction?.decision === 'valide' ? 'Valider ce devis ?' : 'Refuser ce devis ?'}
            </h3>
            <p className="text-gray-600">
              {validationAction?.devis?.prestationNom} - {validationAction?.devis?.montantTTC?.toLocaleString()} €
            </p>
          </div>

          <div className={`p-4 rounded-lg ${validationAction?.decision === 'valide' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
            <p className={`text-sm ${validationAction?.decision === 'valide' ? 'text-green-700' : 'text-red-700'
              }`}>
              {validationAction?.decision === 'valide'
                ? '✅ En validant ce devis, vous autorisez le professionnel à procéder aux travaux décrits selon les conditions énoncées.'
                : '❌ En refusant ce devis, vous demandez une révision ou souhaitez discuter des conditions avec votre professionnel.'
              }
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowValidationModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmValidation}
              className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${validationAction?.decision === 'valide'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
                }`}
            >
              {validationAction?.decision === 'valide' ? 'Confirmer la validation' : 'Confirmer le refus'}
            </button>
          </div>
        </div>
      </Modal>
      <AlertModalComponent />
    </div>
  );
}
