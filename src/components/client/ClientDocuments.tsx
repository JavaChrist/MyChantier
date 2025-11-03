import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Download, X, FolderOpen } from 'lucide-react';
import { Modal } from '../Modal';
import { unifiedDevisService, unifiedDocumentsService } from '../../firebase/unified-services';

interface ClientDocumentsProps {
  devis: any[];
  chantierId: string;
  onReload?: () => void;
  entreprises?: any[];
}

export function ClientDocuments({ devis, chantierId, onReload, entreprises = [] }: ClientDocumentsProps) {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<{ devis: any; decision: 'valide' | 'refuse' } | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

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
      alert(decision === 'valide'
        ? '✅ Devis validé avec succès !\n\nLe professionnel en sera informé.'
        : '❌ Devis refusé.\n\nLe professionnel en sera informé et pourra vous proposer une révision.'
      );

    } catch (error) {
      console.error('Erreur sauvegarde décision:', error);
      alert('❌ Erreur lors de l\'enregistrement de votre décision. Veuillez réessayer.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Vos documents</h2>
            <p className="text-sm text-gray-600">Devis, contrats et documents de votre chantier</p>
          </div>
          <div className="text-sm text-gray-500">
            {devis.length} document{devis.length > 1 ? 's' : ''}
          </div>
        </div>

        {devis.length === 0 ? (
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
            {devis.map((devisItem: any) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc: any) => {
              const entreprise = entreprises.find(e => e.id === doc.entrepriseId);
              return (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{doc.nom}</h4>
                      <p className="text-sm text-gray-600">{doc.type}</p>
                      {entreprise && (
                        <p className="text-xs font-medium text-indigo-600 mt-1">
                          🏢 {entreprise.nom}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Ajouté le {doc.dateUpload?.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}

                  {doc.fichierUrl ? (
                    <a
                      href={doc.fichierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger</span>
                    </a>
                  ) : (
                    <div className="w-full text-center py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                      Document en préparation
                    </div>
                  )}
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
    </div>
  );
}
