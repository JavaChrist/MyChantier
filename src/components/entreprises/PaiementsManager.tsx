import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Calendar, Euro, Check, X, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { paiementsService, commandesService } from '../../firebase/entreprises';
import type { Paiement, Commande } from '../../firebase/entreprises';
import { ConfirmModal } from '../ConfirmModal';

interface PaiementsManagerProps {
  entrepriseId: string;
  entrepriseName: string;
}

export function PaiementsManager({ entrepriseId, entrepriseName }: PaiementsManagerProps) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paiementToUpdate, setPaiementToUpdate] = useState<Paiement | null>(null);

  useEffect(() => {
    loadData();
  }, [entrepriseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paiementsData, commandesData] = await Promise.all([
        paiementsService.getByEntreprise(entrepriseId),
        commandesService.getByEntreprise(entrepriseId)
      ]);

      setPaiements(paiementsData);
      // Filtrer seulement les commandes actives (pas annulées)
      const commandesActives = commandesData.filter(cmd => cmd.statut !== 'annulee');
      setCommandes(commandesActives);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Données de test en cas d'erreur
      setPaiements([]);
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaiement = () => {
    setSelectedPaiement(null);
    setShowForm(true);
  };

  const handleEditPaiement = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setShowForm(true);
  };

  const handleSavePaiement = async (paiementData: Omit<Paiement, 'id' | 'entrepriseId'>) => {
    try {
      if (selectedPaiement?.id) {
        // Mise à jour
        await paiementsService.update(entrepriseId, selectedPaiement.id, paiementData);
      } else {
        // Création
        await paiementsService.create(entrepriseId, paiementData);
      }

      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // TODO: Remplacer par une modale d'erreur
      alert('Erreur lors de la sauvegarde du paiement.');
    }
  };

  const handleMarquerRegle = (paiement: Paiement) => {
    setPaiementToUpdate(paiement);
    setShowConfirmModal(true);
  };

  const confirmMarquerRegle = async () => {
    if (paiementToUpdate?.id) {
      try {
        await paiementsService.update(entrepriseId, paiementToUpdate.id, {
          statut: 'regle',
          dateReglement: new Date()
        });
        await loadData();
        setShowConfirmModal(false);
        setPaiementToUpdate(null);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        // TODO: Remplacer par une modale d'erreur
        alert('Erreur lors de la mise à jour du paiement.');
      }
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    if (filterStatut === 'all') return true;
    return paiement.statut === filterStatut;
  });

  const getStatutColor = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    switch (statut) {
      case 'prevu':
        return isEnRetard ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10';
      case 'regle':
        return 'text-green-400 bg-green-400/10';
      case 'en-retard':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatutIcon = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    if (statut === 'regle') return <Check className="w-4 h-4" />;
    if (isEnRetard || statut === 'en-retard') return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getStatutLabel = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    if (statut === 'regle') return 'Réglé';
    if (isEnRetard) return 'En retard';
    if (statut === 'prevu') return 'Prévu';
    return statut;
  };

  const getCommandeInfo = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId);
    return commande ? `${commande.numero} - ${commande.prestationNom}` : 'Commande inconnue';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'acompte': return 'Acompte';
      case 'situation': return 'Situation';
      case 'solde': return 'Solde final';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'acompte': return 'text-blue-400 bg-blue-400/10';
      case 'situation': return 'text-orange-400 bg-orange-400/10';
      case 'solde': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Calculs des totaux
  const totaux = {
    total: paiements.reduce((sum, p) => sum + p.montant, 0),
    regle: paiements.filter(p => p.statut === 'regle').reduce((sum, p) => sum + p.montant, 0),
    prevu: paiements.filter(p => p.statut === 'prevu').reduce((sum, p) => sum + p.montant, 0),
    enRetard: paiements.filter(p => {
      const isEnRetard = p.statut === 'prevu' && p.datePrevue < new Date();
      return isEnRetard;
    }).reduce((sum, p) => sum + p.montant, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Chargement des paiements...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <PaiementForm
        paiement={selectedPaiement}
        commandes={commandes}
        onSave={handleSavePaiement}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Paiements - {entrepriseName}</h3>
          <p className="text-sm text-gray-400 mt-1">{paiements.length} paiement(s) au total</p>
        </div>
        {commandes.length > 0 && (
          <button
            onClick={handleCreatePaiement}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau paiement</span>
          </button>
        )}
      </div>

      {/* Résumé des totaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total</p>
              <p className="text-lg font-bold text-gray-100">{totaux.total.toLocaleString()} €</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Réglé</p>
              <p className="text-lg font-bold text-green-400">{totaux.regle.toLocaleString()} €</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Prévu</p>
              <p className="text-lg font-bold text-yellow-400">{totaux.prevu.toLocaleString()} €</p>
            </div>
          </div>
        </div>

        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">En retard</p>
              <p className="text-lg font-bold text-red-400">{totaux.enRetard.toLocaleString()} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre par statut */}
      <div className="card">
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="input-field"
        >
          <option value="all">Tous les statuts</option>
          <option value="prevu">Prévus</option>
          <option value="regle">Réglés</option>
          <option value="en-retard">En retard</option>
        </select>
      </div>

      {/* Message si pas de commandes */}
      {commandes.length === 0 && paiements.length === 0 && (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucun paiement</h4>
          <p className="text-gray-500 mb-4">
            Pour créer un paiement, vous devez d'abord avoir une commande active
          </p>
        </div>
      )}

      {/* Liste des paiements */}
      {filteredPaiements.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPaiements.map((paiement) => (
            <div
              key={paiement.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(paiement.type)}`}>
                      <span>{getTypeLabel(paiement.type)}</span>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(paiement.statut, paiement.datePrevue)}`}>
                      {getStatutIcon(paiement.statut, paiement.datePrevue)}
                      <span>{getStatutLabel(paiement.statut, paiement.datePrevue)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{getCommandeInfo(paiement.commandeId)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-100">{paiement.montant.toLocaleString()} €</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Date prévue:</span>
                  <p className="text-gray-100">{paiement.datePrevue.toLocaleDateString()}</p>
                </div>
                {paiement.dateReglement && (
                  <div>
                    <span className="text-gray-400">Date règlement:</span>
                    <p className="text-gray-100">{paiement.dateReglement.toLocaleDateString()}</p>
                  </div>
                )}
                {paiement.notes && (
                  <div className="md:col-span-2">
                    <span className="text-gray-400">Notes:</span>
                    <p className="text-gray-100">{paiement.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPaiement(paiement)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Modifier</span>
                </button>

                {paiement.statut === 'prevu' && (
                  <button
                    onClick={() => handleMarquerRegle(paiement)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Marquer réglé</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPaiements.length === 0 && paiements.length > 0 && (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucun paiement trouvé</h4>
          <p className="text-gray-500">
            Aucun paiement ne correspond au filtre sélectionné
          </p>
        </div>
      )}

      {/* Modale de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmMarquerRegle}
        onCancel={() => {
          setShowConfirmModal(false);
          setPaiementToUpdate(null);
        }}
        title="Confirmer le règlement"
        message={`Marquer le paiement de ${paiementToUpdate?.montant.toLocaleString()} € comme réglé ?`}
        confirmText="Marquer réglé"
        cancelText="Annuler"
        type="info"
      />
    </div>
  );
}

// Composant formulaire pour créer/modifier un paiement
function PaiementForm({
  paiement,
  commandes,
  onSave,
  onCancel
}: {
  paiement: Paiement | null;
  commandes: Commande[];
  onSave: (paiement: Omit<Paiement, 'id' | 'entrepriseId'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    commandeId: '',
    type: 'acompte' as const,
    montant: '',
    datePrevue: '',
    dateReglement: '',
    statut: 'prevu' as const,
    notes: ''
  });

  useEffect(() => {
    if (paiement) {
      setFormData({
        commandeId: paiement.commandeId,
        type: paiement.type,
        montant: paiement.montant.toString(),
        datePrevue: paiement.datePrevue.toISOString().split('T')[0],
        dateReglement: paiement.dateReglement?.toISOString().split('T')[0] || '',
        statut: paiement.statut,
        notes: paiement.notes || ''
      });
    } else if (commandes.length > 0) {
      // Pré-remplir avec la première commande
      setFormData(prev => ({
        ...prev,
        commandeId: commandes[0].id || '',
        datePrevue: new Date().toISOString().split('T')[0]
      }));
    }
  }, [paiement, commandes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paiementData: Omit<Paiement, 'id' | 'entrepriseId'> = {
      commandeId: formData.commandeId,
      type: formData.type,
      montant: parseFloat(formData.montant),
      datePrevue: new Date(formData.datePrevue),
      dateReglement: formData.dateReglement ? new Date(formData.dateReglement) : undefined,
      statut: formData.statut,
      notes: formData.notes
    };

    onSave(paiementData);
  };

  const handleCommandeChange = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId);
    if (commande) {
      // Suggérer un montant basé sur le type de paiement
      let montantSuggere = 0;
      switch (formData.type) {
        case 'acompte':
          montantSuggere = Math.round(commande.montantTTC * 0.3); // 30% d'acompte
          break;
        case 'situation':
          montantSuggere = Math.round(commande.montantTTC * 0.4); // 40% en situation
          break;
        case 'solde':
          montantSuggere = Math.round(commande.montantTTC * 0.3); // 30% de solde
          break;
      }

      setFormData(prev => ({
        ...prev,
        commandeId,
        montant: montantSuggere.toString()
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">
          {paiement ? 'Modifier le paiement' : 'Nouveau paiement'}
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Commande *
        </label>
        <select
          required
          value={formData.commandeId}
          onChange={(e) => handleCommandeChange(e.target.value)}
          className="input-field w-full"
        >
          <option value="">Sélectionner une commande</option>
          {commandes.map(commande => (
            <option key={commande.id} value={commande.id}>
              {commande.numero} - {commande.prestationNom} ({commande.montantTTC.toLocaleString()} €)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type de paiement *
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="acompte">Acompte (30%)</option>
            <option value="situation">Situation (40%)</option>
            <option value="solde">Solde final (30%)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant (€) *
          </label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.montant}
            onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
            className="input-field w-full"
            placeholder="5000.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date prévue *
          </label>
          <input
            type="date"
            required
            value={formData.datePrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, datePrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date règlement
          </label>
          <input
            type="date"
            value={formData.dateReglement}
            onChange={(e) => setFormData(prev => ({ ...prev, dateReglement: e.target.value }))}
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
            <option value="prevu">Prévu</option>
            <option value="regle">Réglé</option>
            <option value="en-retard">En retard</option>
          </select>
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
          placeholder="Notes sur le paiement..."
        />
      </div>

      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Suggestions de répartition :</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <p>• <strong>Acompte</strong> : 30% à la signature (avant début des travaux)</p>
          <p>• <strong>Situation</strong> : 40% en cours de travaux (à mi-parcours)</p>
          <p>• <strong>Solde final</strong> : 30% à la livraison/réception</p>
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
          className="btn-primary"
        >
          {paiement ? 'Modifier' : 'Créer le paiement'}
        </button>
      </div>
    </form>
  );
}
