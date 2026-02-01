import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Check, X, AlertTriangle, Clock, DollarSign, FileText } from 'lucide-react';
import { unifiedPaiementsService, unifiedCommandesService, unifiedDevisService } from '../../firebase/unified-services';
import type { Paiement, Commande, Devis } from '../../firebase/unified-services';
import { ConfirmModal } from '../ConfirmModal';
import { Modal } from '../Modal';
import { useAlertModal } from '../AlertModal';

interface PaiementsManagerProps {
  entrepriseId: string;
  entrepriseName: string;
  chantierId: string;
}

export function PaiementsManager({ entrepriseId, entrepriseName, chantierId }: PaiementsManagerProps) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paiementToUpdate, setPaiementToUpdate] = useState<Paiement | null>(null);
  const [showCustomPaiementsModal, setShowCustomPaiementsModal] = useState(false);
  const [selectedDevisForPaiements, setSelectedDevisForPaiements] = useState<{ devis: Devis; commande: Commande } | null>(null);
  const [devisSelectionContext, setDevisSelectionContext] = useState<{
    devisList: Devis[];
    commandes: Commande[];
    paiementsEntreprise: Paiement[];
  } | null>(null);
  const [selectedDevisId, setSelectedDevisId] = useState('');
  const [commandeSelectionContext, setCommandeSelectionContext] = useState<{
    devis: Devis;
    commandes: Commande[];
    paiementsEntreprise: Paiement[];
  } | null>(null);
  const [selectedCommandeId, setSelectedCommandeId] = useState('');
  const [duplicateConfirmContext, setDuplicateConfirmContext] = useState<{
    devis: Devis;
    commande: Commande;
    existingCount: number;
  } | null>(null);
  const { showAlert, AlertModalComponent } = useAlertModal();

  useEffect(() => {
    loadData();
  }, [entrepriseId]);

  useEffect(() => {
    if (devisSelectionContext?.devisList.length) {
      setSelectedDevisId(devisSelectionContext.devisList[0]?.id || '');
    }
  }, [devisSelectionContext]);

  useEffect(() => {
    if (commandeSelectionContext?.commandes.length) {
      setSelectedCommandeId(commandeSelectionContext.commandes[0]?.id || '');
    }
  }, [commandeSelectionContext]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement paiements pour entreprise ${entrepriseId} dans chantier ${chantierId}`);

      // Charger TOUS les paiements et commandes du chantier puis filtrer par entreprise
      const [allPaiements, allCommandes, allDevis] = await Promise.all([
        unifiedPaiementsService.getByChantier(chantierId),
        unifiedCommandesService.getByChantier(chantierId),
        unifiedDevisService.getByChantier(chantierId)
      ]);

      const paiementsEntreprise = allPaiements.filter(p => p.entrepriseId === entrepriseId);
      const commandesData = allCommandes.filter(c => c.entrepriseId === entrepriseId);
      const devisEntreprise = allDevis.filter(d => d.entrepriseId === entrepriseId);

      console.log(`✅ ${paiementsEntreprise.length} paiements chargés pour cette entreprise`);

      setPaiements(paiementsEntreprise);
      // Filtrer seulement les commandes actives (pas annulées)
      const commandesActives = commandesData.filter(cmd => cmd.statut !== 'annulee');
      setCommandes(commandesActives);
      setDevis(devisEntreprise);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Données de test en cas d'erreur
      setPaiements([]);
      setCommandes([]);
      setDevis([]);
    } finally {
      setLoading(false);
    }
  };

  const openEcheancierModal = (devis: Devis, commande: Commande) => {
    setSelectedDevisForPaiements({ devis, commande });
    setShowCustomPaiementsModal(true);
  };

  const preparePaiementsForDevis = (
    devisSelectionne: Devis,
    commandesDisponibles: Commande[],
    paiementsEntreprise: Paiement[]
  ) => {
    if (!devisSelectionne.id) {
      showAlert('Devis introuvable', 'Impossible d\'identifier le devis sélectionné.', 'error');
      return;
    }

    const commandeLiee = commandesDisponibles.find(c => c.devisId === devisSelectionne.id);

    if (!commandeLiee) {
      if (commandesDisponibles.length === 0) {
        showAlert(
          'Commande requise',
          'Aucune commande n\'a été trouvée pour cette entreprise. Créez-en une dans l\'onglet "Commandes" avant de générer l\'échéancier.',
          'warning'
        );
        return;
      }

      setCommandeSelectionContext({
        devis: devisSelectionne,
        commandes: commandesDisponibles,
        paiementsEntreprise
      });
      return;
    }

    const paiementsExistants = paiementsEntreprise.filter(p => p.commandeId === commandeLiee.id);
    if (paiementsExistants.length > 0) {
      setDuplicateConfirmContext({
        devis: devisSelectionne,
        commande: commandeLiee,
        existingCount: paiementsExistants.length
      });
      return;
    }

    openEcheancierModal(devisSelectionne, commandeLiee);
  };

  const handleConfirmDevisSelection = () => {
    if (!devisSelectionContext) return;
    const devisSelectionne = devisSelectionContext.devisList.find(devis => devis.id === selectedDevisId);
    if (!devisSelectionne) {
      showAlert('Sélection invalide', 'Veuillez sélectionner un devis valide.', 'warning');
      return;
    }

    preparePaiementsForDevis(devisSelectionne, devisSelectionContext.commandes, devisSelectionContext.paiementsEntreprise);
    setDevisSelectionContext(null);
  };

  const handleConfirmCommandeSelection = () => {
    if (!commandeSelectionContext) return;
    const commandeChoisie = commandeSelectionContext.commandes.find(cmd => cmd.id === selectedCommandeId);
    if (!commandeChoisie) {
      showAlert('Sélection invalide', 'Veuillez sélectionner une commande valide.', 'warning');
      return;
    }

    const paiementsExistants = commandeSelectionContext.paiementsEntreprise.filter(p => p.commandeId === commandeChoisie.id);
    if (paiementsExistants.length > 0) {
      setDuplicateConfirmContext({
        devis: commandeSelectionContext.devis,
        commande: commandeChoisie,
        existingCount: paiementsExistants.length
      });
    } else {
      openEcheancierModal(commandeSelectionContext.devis, commandeChoisie);
    }

    setCommandeSelectionContext(null);
  };

  const handleCreatePaiement = () => {
    setSelectedPaiement(null);
    setShowForm(true);
  };

  const handleCreateFromDevis = async () => {
    try {
      console.log('🚀 BOUTON CLIQUÉ - Recherche devis validés pour entreprise:', entrepriseId);

      const [allDevis, allCommandes, allPaiements] = await Promise.all([
        unifiedDevisService.getByChantier(chantierId),
        unifiedCommandesService.getByChantier(chantierId),
        unifiedPaiementsService.getByChantier(chantierId)
      ]);

      const tousDevis = allDevis.filter(d => d.entrepriseId === entrepriseId);
      const devisValides = tousDevis.filter(d => d.statut === 'valide');
      const commandesEntreprise = allCommandes
        .filter(c => c.entrepriseId === entrepriseId)
        .filter(cmd => cmd.statut !== 'annulee');
      const paiementsEntreprise = allPaiements.filter(p => p.entrepriseId === entrepriseId);

      setPaiements(paiementsEntreprise);
      setCommandes(commandesEntreprise);

      console.log('📋 Devis trouvés:', tousDevis.length, 'dont validés:', devisValides.length);

      if (devisValides.length === 0) {
        showAlert('Aucun devis validé', 'Aucun devis validé trouvé pour cette entreprise.', 'warning');
        return;
      }

      if (devisValides.length > 1) {
        setDevisSelectionContext({
          devisList: devisValides,
          commandes: commandesEntreprise,
          paiementsEntreprise
        });
        return;
      }

      preparePaiementsForDevis(devisValides[0], commandesEntreprise, paiementsEntreprise);
    } catch (error) {
      console.error('Erreur lors de la préparation de l\'échéancier:', error);
      showAlert('Erreur', 'Erreur lors de la préparation de l\'échéancier de paiement.', 'error');
    }
  };

  const handleEditPaiement = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setShowForm(true);
  };

  const handleSavePaiement = async (paiementData: Omit<Paiement, 'id' | 'entrepriseId'>) => {
    try {
      if (!paiementData.commandeId) {
        showAlert('Commande requise', 'Veuillez sélectionner une commande avant d\'enregistrer le paiement.', 'warning');
        return;
      }

      if (!Number.isFinite(paiementData.montant) || paiementData.montant <= 0) {
        showAlert('Montant invalide', 'Le montant doit être un nombre positif.', 'warning');
        return;
      }

      if (!(paiementData.datePrevue instanceof Date) || isNaN(paiementData.datePrevue.getTime())) {
        showAlert('Date prévue invalide', 'Merci de fournir une date prévue valide.', 'warning');
        return;
      }

      if (
        paiementData.dateReglement &&
        (isNaN(paiementData.dateReglement.getTime()) || paiementData.dateReglement < paiementData.datePrevue)
      ) {
        showAlert('Date règlement invalide', 'La date de règlement ne peut pas être antérieure à la date prévue.', 'warning');
        return;
      }

      const fullPaiementData = {
        ...paiementData,
        entrepriseId: entrepriseId
      };

      if (selectedPaiement?.id) {
        // Mise à jour
        console.log(`🔄 Mise à jour paiement dans chantier ${chantierId}`);
        await unifiedPaiementsService.update(chantierId, selectedPaiement.id, fullPaiementData);
      } else {
        // Création
        console.log(`🏗️ Création paiement dans chantier ${chantierId}`);
        await unifiedPaiementsService.create(chantierId, fullPaiementData);
      }

      await loadData();
      setShowForm(false);
      showAlert('Succès', 'Paiement enregistré avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showAlert(
        'Erreur',
        `Erreur lors de la sauvegarde du paiement.\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        'error'
      );
    }
  };

  const handleMarquerRegle = (paiement: Paiement) => {
    setPaiementToUpdate(paiement);
    setShowConfirmModal(true);
  };

  const confirmMarquerRegle = async () => {
    if (paiementToUpdate?.id) {
      try {
        console.log(`✅ Marquage paiement ${paiementToUpdate.id} comme réglé`);
        await unifiedPaiementsService.update(chantierId, paiementToUpdate.id, {
          statut: 'regle',
          dateReglement: new Date()
        });
        await loadData();
        setShowConfirmModal(false);
        setPaiementToUpdate(null);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        showAlert('Erreur', 'Erreur lors de la mise à jour du paiement.', 'error');
      }
    }
  };

  const handleSaveCustomPaiements = async (paiementsData: Array<Omit<Paiement, 'id' | 'entrepriseId'>>) => {
    try {
      console.log(`🏗️ Création échéancier de ${paiementsData.length} paiements dans chantier ${chantierId}`);

      // Créer tous les paiements
      for (const paiement of paiementsData) {
        const fullPaiementData = {
          ...paiement,
          entrepriseId: entrepriseId
        };
        await unifiedPaiementsService.create(chantierId, fullPaiementData);
      }

      console.log('✅ Échéancier de paiement créé avec succès');
      await loadData();
      setShowCustomPaiementsModal(false);
      setSelectedDevisForPaiements(null);
      showAlert('Succès', 'Échéancier de paiement créé avec succès.', 'success');
    } catch (error) {
      console.error('Erreur création échéancier:', error);
      showAlert('Erreur', 'Erreur lors de la création de l\'échéancier de paiement.', 'error');
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
    regle: paiements.filter(p => p.statut === 'regle').reduce((sum, p) => sum + p.montant, 0),
    prevu: paiements.filter(p => p.statut === 'prevu').reduce((sum, p) => sum + p.montant, 0)
  };

  // Total cumulé des commandes de l'entreprise et restant dû
  const totalCommandes = commandes.reduce((sum, commande) => sum + (commande.montantTTC || 0), 0);
  const restantDu = Math.max(0, totalCommandes - totaux.regle);

  const summaryCards = [
    {
      label: 'Total commandes',
      value: totalCommandes.toLocaleString(),
      icon: DollarSign,
      iconBg: 'bg-blue-600',
      amountClass: 'text-gray-100'
    },
    {
      label: 'Réglé',
      value: totaux.regle.toLocaleString(),
      icon: Check,
      iconBg: 'bg-green-600',
      amountClass: 'text-green-400'
    },
    {
      label: 'Prévu',
      value: totaux.prevu.toLocaleString(),
      icon: Clock,
      iconBg: 'bg-yellow-600',
      amountClass: 'text-yellow-400'
    },
    {
      label: 'En cours',
      value: restantDu.toLocaleString(),
      icon: CreditCard,
      iconBg: 'bg-indigo-600',
      amountClass: 'text-blue-300'
    }
  ];

  const devisValides = devis.filter(d => d.statut === 'valide');

  const getMontant = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  const isClose = (a: number, b: number) => Math.abs(a - b) < 0.01;
  const normalizeText = (value?: string) => (value || '').toLowerCase();
  const findCommandeForDevis = (devisLie: Devis) => {
    const direct = commandes.find(c => c.devisId === devisLie.id);
    if (direct) {
      return { commande: direct, matchedByFallback: false };
    }

    const montantRef = getMontant(devisLie.montantTTC) || getMontant(devisLie.montantHT);
    const devisNumero = normalizeText(devisLie.numero);
    const devisPrestation = normalizeText(devisLie.prestationNom);

    // 1) Essayer de relier via un paiement existant (notes contenant le devis)
    const paiementAssocie = paiements.find((p) => {
      if (!p.notes) return false;
      const notes = normalizeText(p.notes);
      if (devisNumero && notes.includes(devisNumero)) return true;
      if (devisPrestation && notes.includes(devisPrestation)) return true;
      return false;
    });
    if (paiementAssocie?.commandeId) {
      const commandeParPaiement = commandes.find(c => c.id === paiementAssocie.commandeId);
      if (commandeParPaiement) {
        return { commande: commandeParPaiement, matchedByFallback: true };
      }
    }

    // 2) Essayer par prestation (si unique)
    if (devisLie.prestationNom) {
      const matchesPrestation = commandes.filter(c => c.prestationNom === devisLie.prestationNom);
      if (matchesPrestation.length === 1) {
        return { commande: matchesPrestation[0], matchedByFallback: true };
      }
    }

    // 3) Essayer par montant + prestation si possible
    const matches = commandes.filter((c) => {
      if (devisLie.prestationNom && c.prestationNom !== devisLie.prestationNom) {
        return false;
      }
      if (montantRef > 0) {
        const montantCmd = getMontant(c.montantTTC) || getMontant(c.montantHT);
        return isClose(montantCmd, montantRef);
      }
      return false;
    });

    if (matches.length === 1) {
      return { commande: matches[0], matchedByFallback: true };
    }

    return { commande: undefined, matchedByFallback: false };
  };

  const devisResume = devisValides
    .map((devisLie) => {
      const { commande: commandeLiee, matchedByFallback } = findCommandeForDevis(devisLie);
      const montantDevis =
        getMontant(devisLie.montantTTC) ||
        getMontant(devisLie.montantHT) ||
        getMontant(commandeLiee?.montantTTC) ||
        getMontant(commandeLiee?.montantHT);
      const paiementsCommande = commandeLiee
        ? paiements.filter(p => p.commandeId === commandeLiee.id)
        : [];
      const acompte = paiementsCommande
        .filter(p => p.type === 'acompte')
        .reduce((sum, p) => sum + p.montant, 0);
      const situation = paiementsCommande
        .filter(p => p.type === 'situation')
        .reduce((sum, p) => sum + p.montant, 0);
      const soldeFinal = paiementsCommande
        .filter(p => p.type === 'solde')
        .reduce((sum, p) => sum + p.montant, 0);
      const totalPaiements = acompte + situation + soldeFinal;
      const resteAPayer = Math.max(0, montantDevis - totalPaiements);

      return {
        id: devisLie.id || commandeLiee?.id || `${devisLie.numero || devisLie.prestationNom}`,
        devisNumero: devisLie.numero || commandeLiee?.numero,
        prestationNom: devisLie.prestationNom || commandeLiee?.prestationNom,
        montantDevis,
        acompte,
        situation,
        soldeFinal,
        resteAPayer,
        hasCommande: !!commandeLiee
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Chargement des paiements...</div>
        </div>
        <AlertModalComponent />
      </>
    );
  }

  if (showForm) {
    return (
      <>
        <PaiementForm
          paiement={selectedPaiement}
          commandes={commandes}
          onSave={handleSavePaiement}
          onCancel={() => setShowForm(false)}
        />
        <AlertModalComponent />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Paiements - {entrepriseName}</h3>
          <p className="text-sm text-gray-400 mt-1">{paiements.length} paiement(s) au total</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateFromDevis}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Depuis devis validé</span>
          </button>
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
      </div>

      {/* Résumé des totaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-mobile">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-400 text-xs">{card.label}</p>
                <p className={`text-lg font-bold ${card.amountClass}`}>{card.value} €</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acomptes & solde par devis */}
      {devisResume.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-100">Acomptes et solde par devis</h4>
            <span className="text-xs text-gray-400">{devisResume.length} devis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devisResume.map((item) => (
              <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-100">
                      {item.devisNumero || 'Devis'} • {item.prestationNom}
                    </p>
                    <p className="text-xs text-gray-400">
                      Montant devis: {item.montantDevis.toLocaleString()} €
                    </p>
                  </div>
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                {!item.hasCommande && (
                  <p className="text-xs text-yellow-300 mb-3">
                    Aucune commande liée pour le moment.
                  </p>
                )}
                {item.montantDevis === 0 && (
                  <p className="text-xs text-yellow-300 mb-3">
                    Montant du devis non renseigné.
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-blue-600/10 border border-blue-600/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-200">Acompte</p>
                    <p className="text-sm font-bold text-blue-200">{item.acompte.toLocaleString()} €</p>
                  </div>
                  <div className="flex items-center justify-between bg-orange-600/10 border border-orange-600/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-orange-200">Situation</p>
                    <p className="text-sm font-bold text-orange-200">{item.situation.toLocaleString()} €</p>
                  </div>
                  <div className="flex items-center justify-between bg-green-600/10 border border-green-600/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-green-200">Solde final</p>
                    <p className="text-sm font-bold text-green-200">{item.soldeFinal.toLocaleString()} €</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-600/10 border border-gray-600/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-200">Reste à payer</p>
                    <p className="text-sm font-bold text-gray-100">{item.resteAPayer.toLocaleString()} €</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <p className="text-sm text-gray-300">
                    {paiement.commandeId ? getCommandeInfo(paiement.commandeId) : 'Aucune commande liée'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-100">{paiement.montant.toLocaleString()} €</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
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
                  <div className="sm:col-span-2">
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

      {/* Modale pour échéancier personnalisé */}
      <Modal
        isOpen={showCustomPaiementsModal}
        onClose={() => {
          setShowCustomPaiementsModal(false);
          setSelectedDevisForPaiements(null);
        }}
        title="Créer un échéancier personnalisé"
        size="lg"
      >
        {selectedDevisForPaiements && (
          <CustomPaiementsForm
            devis={selectedDevisForPaiements.devis}
            commande={selectedDevisForPaiements.commande}
            onSave={handleSaveCustomPaiements}
            onCancel={() => {
              setShowCustomPaiementsModal(false);
              setSelectedDevisForPaiements(null);
            }}
            showAlert={showAlert}
          />
        )}
      </Modal>
      <Modal
        isOpen={!!devisSelectionContext}
        onClose={() => setDevisSelectionContext(null)}
        title="Sélectionner un devis validé"
        size="md"
      >
        {devisSelectionContext && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Plusieurs devis validés sont disponibles pour {entrepriseName}. Choisissez celui pour lequel générer l'échéancier.
            </p>
            <select
              value={selectedDevisId}
              onChange={(e) => setSelectedDevisId(e.target.value)}
              className="input-field w-full"
            >
              {devisSelectionContext.devisList.map((devis) => (
                <option key={devis.id} value={devis.id}>
                  {(devis.numero || 'Sans numéro')} • {devis.prestationNom} ({devis.montantTTC.toLocaleString()} €)
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDevisSelectionContext(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDevisSelection}
                className="btn-primary"
                disabled={!selectedDevisId}
              >
                Continuer
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!commandeSelectionContext}
        onClose={() => setCommandeSelectionContext(null)}
        title="Associer une commande"
        size="md"
      >
        {commandeSelectionContext && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Aucune commande n'était liée à ce devis. Sélectionnez celle à utiliser pour l'échéancier de{' '}
              <span className="font-semibold">{commandeSelectionContext.devis.prestationNom}</span>.
            </p>
            <select
              value={selectedCommandeId}
              onChange={(e) => setSelectedCommandeId(e.target.value)}
              className="input-field w-full"
            >
              {commandeSelectionContext.commandes.map((commande) => (
                <option key={commande.id} value={commande.id}>
                  {commande.numero} • {commande.prestationNom} ({commande.montantTTC.toLocaleString()} €)
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCommandeSelectionContext(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCommandeSelection}
                className="btn-primary"
                disabled={!selectedCommandeId}
              >
                Continuer
              </button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal
        isOpen={!!duplicateConfirmContext}
        onConfirm={() => {
          if (!duplicateConfirmContext) return;
          openEcheancierModal(duplicateConfirmContext.devis, duplicateConfirmContext.commande);
          setDuplicateConfirmContext(null);
        }}
        onCancel={() => setDuplicateConfirmContext(null)}
        title="Paiements déjà existants"
        message={
          duplicateConfirmContext
            ? `⚠️ ${duplicateConfirmContext.existingCount} paiement(s) existent déjà pour la commande ${duplicateConfirmContext.commande.numero}.\n\nVoulez-vous tout de même créer un nouvel échéancier ?`
            : ''
        }
        confirmText="Créer quand même"
        cancelText="Annuler"
        type="warning"
      />
      <AlertModalComponent />
    </div>
  );
}

// Composant formulaire pour créer/modifier un paiement
type PaiementFormData = {
  commandeId: string;
  type: Paiement['type'];
  montant: string;
  pourcentage: string;
  datePrevue: string;
  dateReglement: string;
  statut: Paiement['statut'];
  notes: string;
};

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
  const [formData, setFormData] = useState<PaiementFormData>({
    commandeId: '',
    type: 'acompte',
    montant: '',
    pourcentage: '',
    datePrevue: '',
    dateReglement: '',
    statut: 'prevu',
    notes: ''
  });

  useEffect(() => {
    if (paiement) {
      setFormData({
        commandeId: paiement.commandeId,
        type: paiement.type,
        montant: paiement.montant.toString(),
        pourcentage: '',
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
      const commandeMontant = commande.montantTTC || 0;
      const pourcentage = parseFloat(formData.pourcentage);
      const montantSuggere = Number.isFinite(pourcentage)
        ? Math.round(commandeMontant * (pourcentage / 100) * 100) / 100
        : null;

      setFormData(prev => ({
        ...prev,
        commandeId,
        montant: montantSuggere !== null ? montantSuggere.toString() : prev.montant
      }));
    }
  };

  const handlePourcentageChange = (value: string) => {
    const pourcentage = parseFloat(value);
    const commande = commandes.find(c => c.id === formData.commandeId);
    const commandeMontant = commande?.montantTTC || 0;
    const montantSuggere = Number.isFinite(pourcentage)
      ? Math.round(commandeMontant * (pourcentage / 100) * 100) / 100
      : null;

    setFormData(prev => ({
      ...prev,
      pourcentage: value,
      montant: montantSuggere !== null ? montantSuggere.toString() : prev.montant
    }));
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type de paiement *
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Paiement['type'] }))}
            className="input-field w-full"
          >
            <option value="acompte">Acompte</option>
            <option value="situation">Situation</option>
            <option value="solde">Solde final</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pourcentage (%)
          </label>
          <input
            type="text"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]{0,2})?$"
            value={formData.pourcentage}
            onChange={(e) => handlePourcentageChange(e.target.value)}
            className="input-field w-full"
            placeholder="Ex: 30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant (€) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]{0,2})?$"
            required
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
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as Paiement['statut'] }))}
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

// Composant pour créer un échéancier personnalisé
function CustomPaiementsForm({
  devis,
  commande,
  onSave,
  onCancel,
  showAlert
}: {
  devis: Devis;
  commande: Commande;
  onSave: (paiements: Array<Omit<Paiement, 'id' | 'entrepriseId'>>) => void;
  onCancel: () => void;
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [paiements, setPaiements] = useState([
    {
      type: 'acompte' as const,
      montant: '',
      datePrevue: '',
      notes: ''
    },
    {
      type: 'situation' as const,
      montant: '',
      datePrevue: '',
      notes: ''
    },
    {
      type: 'solde' as const,
      montant: '',
      datePrevue: '',
      notes: ''
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const totalSaisi = paiements.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
    if (Math.abs(totalSaisi - devis.montantTTC) > 0.01) {
      showAlert(
        'Erreur de montant',
        `⚠️ Erreur de montant !\n\nTotal saisi: ${totalSaisi.toLocaleString()} €\nMontant du devis: ${devis.montantTTC.toLocaleString()} €\n\nLe total des paiements doit correspondre au montant du devis.`,
        'warning'
      );
      return;
    }

    // Vérifier que tous les champs sont remplis
    for (let i = 0; i < paiements.length; i++) {
      const p = paiements[i];
      if (!p.montant || !p.datePrevue || parseFloat(p.montant) <= 0) {
        showAlert('Champs incomplets', `⚠️ Veuillez remplir correctement le paiement ${i + 1} (${p.type}).`, 'warning');
        return;
      }
    }

    // Créer les données de paiement
    const paiementsData = paiements.map(p => ({
      commandeId: commande.id || '',
      type: p.type,
      montant: parseFloat(p.montant),
      datePrevue: new Date(p.datePrevue),
      statut: 'prevu' as const,
      notes: p.notes || `${getTypeLabel(p.type)} - ${devis.prestationNom}`
    }));

    onSave(paiementsData);
  };

  const handlePaiementChange = (index: number, field: string, value: string) => {
    setPaiements(prev => prev.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const handleAddPaiement = () => {
    setPaiements(prev => [...prev, {
      type: 'situation' as const,
      montant: '',
      datePrevue: '',
      notes: ''
    }]);
  };

  const handleRemovePaiement = (index: number) => {
    if (paiements.length <= 1) {
      showAlert('Action impossible', 'Il faut au moins un paiement.', 'warning');
      return;
    }
    setPaiements(prev => prev.filter((_, i) => i !== index));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'acompte': return 'Acompte';
      case 'situation': return 'Situation';
      case 'solde': return 'Solde final';
      default: return type;
    }
  };

  const totalSaisi = paiements.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
  const difference = totalSaisi - devis.montantTTC;

  // Suggestions automatiques
  const handleSuggestionClassique = () => {
    const montantAcompte = Math.round(devis.montantTTC * 0.3);
    const montantSituation = Math.round(devis.montantTTC * 0.4);
    const montantSolde = devis.montantTTC - montantAcompte - montantSituation;

    const today = new Date();
    setPaiements([
      {
        type: 'acompte',
        montant: montantAcompte.toString(),
        datePrevue: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      },
      {
        type: 'situation',
        montant: montantSituation.toString(),
        datePrevue: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      },
      {
        type: 'solde',
        montant: montantSolde.toString(),
        datePrevue: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      }
    ]);
  };

  const handleSuggestion5050 = () => {
    const montant50 = Math.round(devis.montantTTC / 2);
    const montantReste = devis.montantTTC - montant50;

    const today = new Date();
    setPaiements([
      {
        type: 'acompte',
        montant: montant50.toString(),
        datePrevue: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      },
      {
        type: 'solde',
        montant: montantReste.toString(),
        datePrevue: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      }
    ]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations du devis */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-400 mb-2">📋 {devis.prestationNom}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Commande:</span>
            <p className="text-gray-100">{commande.numero}</p>
          </div>
          <div>
            <span className="text-gray-400">Montant total:</span>
            <p className="text-xl font-bold text-gray-100">{devis.montantTTC.toLocaleString()} € TTC</p>
          </div>
        </div>
      </div>

      {/* Suggestions rapides */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-300 mb-3">💡 Répartitions suggérées :</h5>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSuggestionClassique}
            className="btn-secondary text-sm"
          >
            Classique (30% - 40% - 30%)
          </button>
          <button
            type="button"
            onClick={handleSuggestion5050}
            className="btn-secondary text-sm"
          >
            Simple (50% - 50%)
          </button>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-lg font-medium text-gray-100">Échéancier de paiement</h5>
          <button
            type="button"
            onClick={handleAddPaiement}
            className="btn-secondary flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>

        {paiements.map((paiement, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-sm font-medium text-gray-300">Paiement {index + 1}</h6>
              {paiements.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePaiement(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={paiement.type}
                  onChange={(e) => handlePaiementChange(index, 'type', e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="acompte">Acompte</option>
                  <option value="situation">Situation</option>
                  <option value="solde">Solde final</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={paiement.montant}
                  onChange={(e) => handlePaiementChange(index, 'montant', e.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Date prévue *
                </label>
                <input
                  type="date"
                  required
                  value={paiement.datePrevue}
                  onChange={(e) => handlePaiementChange(index, 'datePrevue', e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={paiement.notes}
                  onChange={(e) => handlePaiementChange(index, 'notes', e.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="Description..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Récapitulatif */}
      <div className={`rounded-lg p-4 border ${Math.abs(difference) < 0.01
        ? 'bg-green-600/10 border-green-600/20'
        : 'bg-red-600/10 border-red-600/20'
        }`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Total des paiements :</span>
          <span className={`font-bold text-lg ${Math.abs(difference) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
            {totalSaisi.toLocaleString()} €
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-400">Montant du devis :</span>
          <span className="text-gray-100">{devis.montantTTC.toLocaleString()} €</span>
        </div>
        {Math.abs(difference) >= 0.01 && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-red-400">Différence :</span>
            <span className="text-red-400 font-medium">
              {difference > 0 ? '+' : ''}{difference.toLocaleString()} €
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
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
          disabled={Math.abs(difference) >= 0.01}
        >
          Créer l'échéancier ({paiements.length} paiement{paiements.length > 1 ? 's' : ''})
        </button>
      </div>
    </form>
  );
}
