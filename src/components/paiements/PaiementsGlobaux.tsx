import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertTriangle, Clock, DollarSign, Edit2, Target } from 'lucide-react';
import { unifiedBudgetService, unifiedPaiementsService, type BudgetPrevisionnel, type Paiement } from '../../firebase/unified-services';
import { useChantier } from '../../contexts/ChantierContext';
import { useChantierData } from '../../hooks/useChantierData';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { useAlertModal } from '../AlertModal';

export function PaiementsGlobaux() {
  const { chantierId, chantierActuel, setBudgetActuel } = useChantier();
  const { entreprises, devis, paiements: paiementsData, loading: dataLoading, reloadData } = useChantierData(chantierId);

  const [paiements, setPaiements] = useState<(Paiement & { entrepriseNom: string; secteur: string })[]>([]);
  const [budgets, setBudgets] = useState<BudgetPrevisionnel[]>([]);
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterEntreprise, setFilterEntreprise] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetPrevisionnel | null>(null);
  const [showConfirmPaiementModal, setShowConfirmPaiementModal] = useState(false);
  const [paiementToUpdate, setPaiementToUpdate] = useState<(Paiement & { entrepriseNom: string; secteur: string }) | null>(null);
  const { showAlert, AlertModalComponent } = useAlertModal();

  useEffect(() => {
    if (!dataLoading && entreprises.length >= 0) {
      calculatePaiements();
      loadBudgets();
    }
  }, [entreprises, paiementsData, dataLoading]);

  const calculatePaiements = () => {
    // Créer les paiements avec infos entreprises du chantier actuel
    const paiementsAvecInfo = paiementsData.map(paiement => {
      const entreprise = entreprises.find(e => e.id === paiement.entrepriseId);
      return {
        ...paiement,
        entrepriseNom: entreprise?.nom || 'Entreprise inconnue',
        secteur: entreprise?.secteurActivite || 'sanitaire'
      };
    });

    // Trier par date prévue (plus récent en premier)
    paiementsAvecInfo.sort((a, b) => b.datePrevue.getTime() - a.datePrevue.getTime());
    setPaiements(paiementsAvecInfo);
  };

  const loadBudgets = async () => {
    try {
      if (!chantierId) {
        setBudgets([]);
        return;
      }

      console.log(`🔍 Chargement budgets pour chantier ${chantierId}`);
      // Utiliser le système unifié V2 pour TOUS les chantiers
      const budgetsData = await unifiedBudgetService.getByChantier(chantierId);
      console.log(`✅ ${budgetsData.length} budgets chargés`);
      setBudgets(budgetsData);
      const actif = budgetsData.find(b => b.statut === 'actif') || null;
      setBudgetActuel(actif ? actif.montantActuel : null);
    } catch (error) {
      console.error('Erreur chargement budgets:', error);
      setBudgets([]);
      setBudgetActuel(null);
    }
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setShowBudgetModal(true);
  };

  const handleEditBudget = (budget: BudgetPrevisionnel) => {
    setSelectedBudget(budget);
    setShowBudgetModal(true);
  };

  const handleMarquerRegle = (paiement: (Paiement & { entrepriseNom: string; secteur: string })) => {
    setPaiementToUpdate(paiement);
    setShowConfirmPaiementModal(true);
  };

  const confirmMarquerRegle = async () => {
    if (!paiementToUpdate?.id || !chantierId) return;

    try {
      console.log(`✅ Marquage paiement ${paiementToUpdate.id} comme réglé`);
      await unifiedPaiementsService.update(chantierId, paiementToUpdate.id, {
        statut: 'regle',
        dateReglement: new Date()
      });
      
      // Recharger TOUTES les données du chantier
      await reloadData();
      await loadBudgets();
      
      setShowConfirmPaiementModal(false);
      setPaiementToUpdate(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showAlert('Erreur', 'Erreur lors de la mise à jour du paiement.', 'error');
    }
  };

  const handleSaveBudget = async (budgetData: Omit<BudgetPrevisionnel, 'id'>) => {
    try {
      if (!chantierId) {
        showAlert('Aucun chantier', 'Aucun chantier sélectionné.', 'warning');
        return;
      }

      console.log('💾 Tentative sauvegarde budget:', budgetData);
      
      if (selectedBudget?.id) {
        console.log('🔄 Mise à jour budget existant:', selectedBudget.id);
        await unifiedBudgetService.update(chantierId, selectedBudget.id, budgetData);
      } else {
        console.log('🆕 Création nouveau budget dans chantier:', chantierId);
        await unifiedBudgetService.create(chantierId, {
          ...budgetData,
          dateCreation: new Date(),
          dateModification: new Date()
        });
      }
      
      console.log('✅ Budget sauvegardé avec succès');
      await loadBudgets();
      setShowBudgetModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde budget:', error);
      showAlert('Erreur', `Erreur lors de la sauvegarde: ${(error as any).message || error}`, 'error');
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    const matchesStatut = filterStatut === 'all' || paiement.statut === filterStatut;
    const matchesEntreprise = filterEntreprise === 'all' || paiement.entrepriseId === filterEntreprise;
    const matchesType = filterType === 'all' || paiement.type === filterType;
    return matchesStatut && matchesEntreprise && matchesType;
  });

  const getStatutLabel = (statut: string, datePrevue: Date) => {
    const maintenant = new Date();
    const isEnRetard = statut === 'prevu' && datePrevue < maintenant;

    if (statut === 'regle') return 'Réglé';
    if (isEnRetard) return 'En retard';
    if (statut === 'prevu') return 'Prévu';
    return statut;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'acompte': return 'Acompte';
      case 'situation': return 'Situation';
      case 'solde': return 'Solde';
      default: return type;
    }
  };

  const totalEngageDevis = devis
    .filter(d => d.statut === 'valide')
    .reduce((sum, d) => sum + (d.montantTTC || 0), 0);

  // Calculs globaux
  const totaux = {
    total: totalEngageDevis,
    regle: paiements.filter(p => p.statut === 'regle').reduce((sum, p) => sum + p.montant, 0),
    prevu: paiements.filter(p => p.statut === 'prevu').reduce((sum, p) => sum + p.montant, 0),
    enRetard: paiements.filter(p => {
      const isEnRetard = p.statut === 'prevu' && p.datePrevue < new Date();
      return isEnRetard;
    }).reduce((sum, p) => sum + p.montant, 0)
  };

  // Totaux par secteur
  const totauxParSecteur = paiements.reduce((acc, paiement) => {
    if (!acc[paiement.secteur]) acc[paiement.secteur] = 0;
    acc[paiement.secteur] += paiement.montant;
    return acc;
  }, {} as Record<string, number>);

  const budgetActuel = budgets.find(b => b.statut === 'actif');

  if (dataLoading) {
    return (
      <>
        <div className="mobile-padding flex items-center justify-center min-h-64">
          <div className="text-gray-400">
            Chargement des paiements {chantierActuel ? `du chantier "${chantierActuel.nom}"` : ''}...
          </div>
        </div>
        <AlertModalComponent />
      </>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Gestion des Paiements</h1>
          <p className="text-gray-400 mobile-text">
            {chantierActuel
              ? `Paiements du chantier "${chantierActuel.nom}"`
              : 'Tableau de bord des paiements et budget prévisionnel'
            }
          </p>
        </div>
        <button
          onClick={handleCreateBudget}
          className="btn-primary flex items-center space-x-2"
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Budget prévisionnel</span>
          <span className="sm:hidden">Budget</span>
        </button>
      </div>

      {/* Budget prévisionnel */}
      {budgetActuel ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">{budgetActuel.nom}</h2>
              <p className="text-sm text-gray-400">{budgetActuel.description}</p>
            </div>
            <button
              onClick={() => handleEditBudget(budgetActuel)}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{budgetActuel.montantActuel.toLocaleString()} €</p>
              <p className="text-xs text-gray-400">Budget actuel</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-100">{totaux.total.toLocaleString()} €</p>
              <p className="text-xs text-gray-400">Total engagé</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{totaux.regle.toLocaleString()} €</p>
              <p className="text-xs text-gray-400">Déjà payé</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${(budgetActuel.montantActuel - totaux.total) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                {(budgetActuel.montantActuel - totaux.total).toLocaleString()} €
              </p>
              <p className="text-xs text-gray-400">Reste disponible</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progression du budget</span>
              <span className="text-gray-300">
                {((totaux.total / budgetActuel.montantActuel) * 100).toFixed(1)}% utilisé
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${(totaux.total / budgetActuel.montantActuel) > 1 ? 'bg-red-500' : 'bg-primary-500'
                  }`}
                style={{ width: `${Math.min((totaux.total / budgetActuel.montantActuel) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-6">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {chantierActuel ? `Aucun budget pour ${chantierActuel.nom}` : 'Aucun budget prévisionnel'}
            </h3>
            <p className="text-gray-500 mb-4">
              {chantierActuel
                ? `Créez un budget prévisionnel spécifique pour le chantier "${chantierActuel.nom}"`
                : 'Créez un budget prévisionnel pour suivre vos dépenses'
              }
            </p>
            <button onClick={handleCreateBudget} className="btn-primary">
              Créer un budget pour ce chantier
            </button>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-mobile">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total engagé</p>
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
              <p className="text-gray-400 text-xs">Payé</p>
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
              <p className="text-gray-400 text-xs">À payer</p>
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

      {/* Répartition par secteur */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Répartition par secteur</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(totauxParSecteur).map(([secteur, montant]) => (
            <div key={secteur} className="text-center">
              <p className="text-xl font-bold text-gray-100">{montant.toLocaleString()} €</p>
              <p className="text-sm text-gray-400 capitalize">{secteur}</p>
              {budgetActuel && (
                <p className="text-xs text-gray-500">
                  {((montant / budgetActuel.secteurs[secteur as keyof typeof budgetActuel.secteurs]) * 100).toFixed(1)}% du budget
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">Tous les statuts</option>
              <option value="prevu">Prévus</option>
              <option value="regle">Réglés</option>
              <option value="en-retard">En retard</option>
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
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">Tous les types</option>
              <option value="acompte">Acomptes</option>
              <option value="situation">Situations</option>
              <option value="solde">Soldes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">
            Tableau des paiements ({filteredPaiements.length})
          </h3>
        </div>

        {filteredPaiements.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">Aucun paiement</h4>
            <p className="text-gray-500">
              {filterStatut !== 'all' || filterEntreprise !== 'all' || filterType !== 'all'
                ? 'Aucun paiement ne correspond aux filtres sélectionnés'
                : 'Aucun paiement enregistré pour le moment'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400 font-medium">Date prévue</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Entreprise</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Type</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Montant</th>
                  <th className="text-center p-3 text-gray-400 font-medium">Statut</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Date règlement</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Notes</th>
                  <th className="text-center p-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map((paiement) => {
                  const isEnRetard = paiement.statut === 'prevu' && paiement.datePrevue < new Date();

                  return (
                    <tr
                      key={paiement.id}
                      className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${isEnRetard ? 'bg-red-600/5' : ''
                        }`}
                    >
                      <td className="p-3">
                        <div className={`${isEnRetard ? 'text-red-400' : 'text-gray-100'}`}>
                          {paiement.datePrevue.toLocaleDateString('fr-FR')}
                        </div>
                        {isEnRetard && (
                          <div className="text-xs text-red-400">
                            Retard: {Math.ceil((new Date().getTime() - paiement.datePrevue.getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-gray-100 font-medium">{paiement.entrepriseNom}</div>
                        <div className="text-xs text-gray-400 capitalize">{paiement.secteur}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${paiement.type === 'acompte' ? 'bg-blue-600/20 text-blue-400' :
                          paiement.type === 'situation' ? 'bg-orange-600/20 text-orange-400' :
                            'bg-green-600/20 text-green-400'
                          }`}>
                          {getTypeLabel(paiement.type)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-lg font-bold text-gray-100">
                          {paiement.montant.toLocaleString()} €
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${paiement.statut === 'regle' ? 'bg-green-600/20 text-green-400' :
                          isEnRetard ? 'bg-red-600/20 text-red-400' :
                            'bg-yellow-600/20 text-yellow-400'
                          }`}>
                          {getStatutLabel(paiement.statut, paiement.datePrevue)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-100">
                          {paiement.dateReglement?.toLocaleDateString('fr-FR') || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-300 text-xs max-w-32 truncate">
                          {paiement.notes || '-'}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {paiement.statut !== 'regle' && (
                          <button
                            onClick={() => handleMarquerRegle(paiement)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                            title="Marquer comme réglé"
                          >
                            ✓ Réglé
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour budget prévisionnel */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title={selectedBudget ? 'Modifier le budget' : 'Nouveau budget prévisionnel'}
        size="lg"
        bodyClassName="overflow-y-auto lg:overflow-y-visible"
      >
        <BudgetForm
          budget={selectedBudget}
          onSave={handleSaveBudget}
          onCancel={() => setShowBudgetModal(false)}
        />
      </Modal>

      {/* Modal de confirmation pour marquer comme réglé */}
      <ConfirmModal
        isOpen={showConfirmPaiementModal}
        onConfirm={confirmMarquerRegle}
        onCancel={() => {
          setShowConfirmPaiementModal(false);
          setPaiementToUpdate(null);
        }}
        title="Confirmer le paiement"
        message={
          paiementToUpdate
            ? `Marquer le paiement "${getTypeLabel(paiementToUpdate.type)}" de ${paiementToUpdate.montant.toLocaleString()}€ comme réglé ?\n\nEntreprise : ${paiementToUpdate.entrepriseNom}\n\nCela enregistrera la date de règlement à aujourd'hui.`
            : ''
        }
        confirmText="Confirmer le règlement"
        cancelText="Annuler"
        type="success"
      />
      <AlertModalComponent />
    </div>
  );
}

type BudgetFormState = {
  nom: string;
  description: string;
  montantInitial: string;
  montantActuel: string;
  secteurs: Record<'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture', string>;
  statut: BudgetPrevisionnel['statut'];
  notes: string;
};

// Composant formulaire pour créer/modifier un budget
function BudgetForm({
  budget,
  onSave,
  onCancel
}: {
  budget: BudgetPrevisionnel | null;
  onSave: (budget: Omit<BudgetPrevisionnel, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<BudgetFormState>({
    nom: '',
    description: '',
    montantInitial: '',
    montantActuel: '',
    secteurs: {
      sanitaire: '',
      electricite: '',
      carrelage: '',
      menuiserie: '',
      peinture: ''
    },
    statut: 'actif',
    notes: ''
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        nom: budget.nom,
        description: budget.description,
        montantInitial: budget.montantInitial.toString(),
        montantActuel: budget.montantActuel.toString(),
        secteurs: {
          sanitaire: budget.secteurs.sanitaire.toString(),
          electricite: budget.secteurs.electricite.toString(),
          carrelage: budget.secteurs.carrelage.toString(),
          menuiserie: budget.secteurs.menuiserie.toString(),
          peinture: budget.secteurs.peinture.toString()
        },
        statut: budget.statut,
        notes: budget.notes || ''
      });
    }
  }, [budget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const budgetData: Omit<BudgetPrevisionnel, 'id'> = {
      nom: formData.nom,
      description: formData.description,
      montantInitial: parseFloat(formData.montantInitial),
      montantActuel: parseFloat(formData.montantActuel),
      secteurs: {
        sanitaire: parseFloat(formData.secteurs.sanitaire) || 0,
        electricite: parseFloat(formData.secteurs.electricite) || 0,
        carrelage: parseFloat(formData.secteurs.carrelage) || 0,
        menuiserie: parseFloat(formData.secteurs.menuiserie) || 0,
        peinture: parseFloat(formData.secteurs.peinture) || 0
      },
      statut: formData.statut,
      notes: formData.notes,
      dateCreation: new Date(),
      dateModification: new Date()
    };

    onSave(budgetData);
  };

  const calculerTotal = () => {
    return Object.values(formData.secteurs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const repartirEquitablement = () => {
    const montantTotal = parseFloat(formData.montantActuel) || 0;
    const montantParSecteur = Math.round(montantTotal / 5);

    setFormData(prev => ({
      ...prev,
      secteurs: {
        sanitaire: montantParSecteur.toString(),
        electricite: montantParSecteur.toString(),
        carrelage: montantParSecteur.toString(),
        menuiserie: montantParSecteur.toString(),
        peinture: montantParSecteur.toString()
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du budget *
          </label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Rénovation Maison 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="actif">Actif</option>
            <option value="termine">Terminé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
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
          placeholder="Description du projet..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget initial (€) *
          </label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.montantInitial}
            onChange={(e) => setFormData(prev => ({ ...prev, montantInitial: e.target.value }))}
            className="input-field w-full"
            placeholder="100000.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget actuel (€) *
          </label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.montantActuel}
            onChange={(e) => setFormData(prev => ({ ...prev, montantActuel: e.target.value }))}
            className="input-field w-full"
            placeholder="120000.00"
          />
        </div>
      </div>

      {/* Répartition par secteur */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-100">Répartition par secteur</h4>
          <button
            type="button"
            onClick={repartirEquitablement}
            className="btn-secondary text-sm"
          >
            Répartir équitablement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(formData.secteurs).map(([secteur, montant]) => (
            <div key={secteur}>
              <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                {secteur} (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={montant}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  secteurs: { ...prev.secteurs, [secteur]: e.target.value }
                }))}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>

        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-400">Total réparti :</span>
            <span className={`font-bold ${calculerTotal() === parseFloat(formData.montantActuel)
              ? 'text-green-400'
              : 'text-yellow-400'
              }`}>
              {calculerTotal().toLocaleString()} €
            </span>
          </div>
          {calculerTotal() !== parseFloat(formData.montantActuel) && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ La répartition ne correspond pas au budget total
            </p>
          )}
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
          placeholder="Notes sur le budget..."
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
          className="btn-primary"
        >
          {budget ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
