import { useState } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, Upload, X, Building2 } from 'lucide-react';
import { Modal } from '../Modal';
import { useAlertModal } from '../AlertModal';

interface ClientPaiementsProps {
  paiements: any[];
  entreprises: any[];
}

export function ClientPaiements({ paiements, entreprises }: ClientPaiementsProps) {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);
  const [justificatif, setJustificatif] = useState<File | null>(null);
  const { showAlert, AlertModalComponent } = useAlertModal();

  const getStatutColor = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    if (statut === 'regle') return 'bg-green-100 text-green-800 border-green-200';
    if (isEnRetard) return 'bg-red-100 text-red-800 border-red-200';
    if (statut === 'prevu') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatutLabel = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    if (statut === 'regle') return '✅ Payé';
    if (isEnRetard) return '⚠️ En retard';
    if (statut === 'prevu') return '⏳ À payer';
    return statut;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'acompte': return 'Acompte (30%)';
      case 'situation': return 'Situation (40%)';
      case 'solde': return 'Solde final (30%)';
      default: return type;
    }
  };

  const handleValidatePaiement = (paiement: any) => {
    setSelectedPaiement(paiement);
    setShowValidationModal(true);
  };

  const confirmPaiement = () => {
    if (!selectedPaiement) return;

    // TODO: Intégrer avec Firebase pour enregistrer la validation
    console.log('✅ Paiement validé par le client:', selectedPaiement.id);

    setShowValidationModal(false);
    setSelectedPaiement(null);
    setJustificatif(null);

    // Simulation de mise à jour
    showAlert('Paiement validé', 'Paiement validé ! Votre professionnel sera notifié.', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Fichier trop volumineux', 'Fichier trop volumineux (max 5MB).', 'warning');
        return;
      }
      setJustificatif(file);
    }
  };

  // Grouper les paiements par entreprise
  const paiementsParEntreprise = entreprises.map(entreprise => {
    const paiementsEntreprise = paiements.filter(p => p.entrepriseId === entreprise.id);
    return {
      entreprise,
      paiements: paiementsEntreprise.sort((a, b) => a.datePrevue.getTime() - b.datePrevue.getTime())
    };
  }).filter(group => group.paiements.length > 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Gestion des paiements</h2>
            <p className="text-sm text-gray-600">Échéancier et validation des paiements effectués</p>
          </div>
          <div className="text-sm text-gray-500">
            {paiements.length} paiement{paiements.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {paiementsParEntreprise.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun paiement planifié</h3>
          <p className="text-gray-500">
            Les échéances de paiement apparaîtront ici une fois les devis validés
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {paiementsParEntreprise.map(({ entreprise, paiements: paiementsEnt }) => (
            <div key={entreprise.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* En-tête entreprise */}
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{entreprise.nom}</h3>
                      <p className="text-sm text-gray-600 capitalize">{entreprise.secteurActivite}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {paiementsEnt.length} échéance{paiementsEnt.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      Total: {paiementsEnt.reduce((sum, p) => sum + p.montant, 0).toLocaleString()} €
                    </p>
                  </div>
                </div>

                {/* RIB de l'entreprise */}
                {entreprise.rib && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Coordonnées bancaires</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">IBAN:</span>
                        <p className="text-blue-800 font-mono">{entreprise.rib.iban}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">BIC:</span>
                        <p className="text-blue-800 font-mono">{entreprise.rib.bic}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Titulaire:</span>
                        <p className="text-blue-800">{entreprise.rib.titulaire}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Banque:</span>
                        <p className="text-blue-800">{entreprise.rib.banque}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des paiements */}
              <div className="p-4 space-y-4">
                {paiementsEnt.map((paiement) => {
                  const isEnRetard = paiement.statut === 'prevu' && paiement.datePrevue < new Date();

                  return (
                    <div
                      key={paiement.id}
                      className={`border rounded-lg p-4 ${isEnRetard ? 'border-red-200 bg-red-50' : 'border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{getTypeLabel(paiement.type)}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatutColor(paiement.statut, paiement.datePrevue)}`}>
                              {getStatutLabel(paiement.statut, paiement.datePrevue)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{paiement.description || 'Paiement selon échéancier'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">{paiement.montant.toLocaleString()} €</p>
                          <p className="text-sm text-gray-500">
                            Échéance: {paiement.datePrevue.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Actions selon le statut */}
                      {paiement.statut === 'prevu' && (
                        <div className={`mt-4 p-3 rounded-lg ${isEnRetard ? 'bg-red-100 border border-red-200' : 'bg-blue-50 border border-blue-200'
                          }`}>
                          <h5 className={`font-medium mb-2 ${isEnRetard ? 'text-red-800' : 'text-blue-800'
                            }`}>
                            {isEnRetard ? '⚠️ Paiement en retard' : '💳 Paiement à effectuer'}
                          </h5>
                          <p className={`text-sm mb-3 ${isEnRetard ? 'text-red-700' : 'text-blue-700'
                            }`}>
                            {isEnRetard
                              ? `Ce paiement était attendu le ${paiement.datePrevue.toLocaleDateString('fr-FR')}. Merci de régulariser rapidement.`
                              : 'Effectuez le virement avec les coordonnées bancaires ci-dessus, puis validez le paiement.'
                            }
                          </p>
                          <button
                            onClick={() => handleValidatePaiement(paiement)}
                            className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-colors ${isEnRetard
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                              }`}
                          >
                            ✅ Confirmer le paiement effectué
                          </button>
                        </div>
                      )}

                      {paiement.statut === 'regle' && paiement.dateReglement && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✅ Paiement effectué le {paiement.dateReglement.toLocaleDateString('fr-FR')}
                          </p>
                          {paiement.notes && (
                            <p className="text-xs text-green-600 mt-1">{paiement.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informations importantes */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-orange-800 mb-3">Informations importantes</h3>
        <div className="text-sm text-orange-700 space-y-2">
          <p>• <strong>Virements uniquement :</strong> Utilisez les coordonnées bancaires fournies</p>
          <p>• <strong>Référence obligatoire :</strong> Indiquez le numéro de facture dans le libellé</p>
          <p>• <strong>Validation :</strong> Confirmez chaque paiement après virement</p>
          <p>• <strong>Justificatifs :</strong> Gardez les reçus de virement pour vos archives</p>
          <p>• <strong>Questions :</strong> Contactez votre professionnel via la messagerie</p>
        </div>
      </div>

      {/* Modale de validation de paiement */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Confirmer le paiement effectué"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirmer le paiement
            </h3>
            <p className="text-gray-600">
              {selectedPaiement?.type && getTypeLabel(selectedPaiement.type)} - {selectedPaiement?.montant?.toLocaleString()} €
            </p>
            <p className="text-sm text-gray-500">
              {entreprises.find(e => e.id === selectedPaiement?.entrepriseId)?.nom}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Confirmation de paiement</h4>
            <p className="text-sm text-green-700 mb-3">
              En confirmant, vous certifiez avoir effectué le virement bancaire pour ce montant.
            </p>

            {/* Upload justificatif optionnel */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-green-800">
                Justificatif de virement (optionnel)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="block w-full text-sm text-green-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-800 hover:file:bg-green-200"
              />
              {justificatif && (
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <Upload className="w-4 h-4" />
                  <span>{justificatif.name}</span>
                  <button
                    onClick={() => setJustificatif(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Rappel des coordonnées bancaires</h4>
            {(() => {
              const entreprise = entreprises.find(e => e.id === selectedPaiement?.entrepriseId);
              return entreprise?.rib ? (
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>IBAN:</strong> {entreprise.rib.iban}</p>
                  <p><strong>BIC:</strong> {entreprise.rib.bic}</p>
                  <p><strong>Titulaire:</strong> {entreprise.rib.titulaire}</p>
                </div>
              ) : (
                <p className="text-sm text-blue-700">Coordonnées bancaires non renseignées</p>
              );
            })()}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowValidationModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmPaiement}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Confirmer le paiement
            </button>
          </div>
        </div>
      </Modal>
      <AlertModalComponent />
    </div>
  );
}
