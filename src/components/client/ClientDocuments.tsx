import { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Download, Eye, X } from 'lucide-react';
import { Modal } from '../Modal';

interface ClientDocumentsProps {
  devis: any[];
}

export function ClientDocuments({ devis }: ClientDocumentsProps) {
  const [selectedDevis, setSelectedDevis] = useState<any>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<{ devis: any; decision: 'valide' | 'refuse' } | null>(null);

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

  const confirmValidation = () => {
    if (!validationAction) return;

    // TODO: Intégrer avec Firebase pour sauvegarder la décision
    console.log(`Client ${validationAction.decision} le devis:`, validationAction.devis.id);

    // Simuler la mise à jour du statut (en attendant Firebase)
    const updatedDevis = devis.map(d =>
      d.id === validationAction.devis.id
        ? { ...d, statut: validationAction.decision }
        : d
    );

    setShowValidationModal(false);
    setValidationAction(null);

    // Pour la démo, on simule le changement sans recharger
    // TODO: Intégrer avec Firebase pour persister le changement
    console.log('✅ Décision enregistrée (simulation)');
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
