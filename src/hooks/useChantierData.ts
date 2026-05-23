import { useState, useEffect } from 'react';
import {
  unifiedEntreprisesService,
  unifiedDevisService,
  unifiedCommandesService,
  unifiedPaiementsService,
  unifiedDocumentsService,
  unifiedPlanningService,
  unifiedFacturesService
} from '../firebase/unified-services';
import type { Entreprise, Devis, Commande, Paiement, DocumentOfficiel, RendezVous, Facture } from '../firebase/unified-services';

// Hook pour charger toutes les données d'un chantier
export function useChantierData(chantierId: string | null) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [documents, setDocuments] = useState<DocumentOfficiel[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chantierId) {
      // Reset toutes les données si pas de chantier
      setEntreprises([]);
      setDevis([]);
      setCommandes([]);
      setPaiements([]);
      setDocuments([]);
      setRendezVous([]);
      setFactures([]);
      return;
    }

    loadChantierData();
  }, [chantierId]);

  const loadChantierData = async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 CHARGEMENT V2 pour chantier: ${chantierId}`);

      // STRUCTURE UNIFIÉE V2 - Tous les chantiers utilisent la même logique
      const [entreprisesData, devisData, commandesData, paiementsData, documentsData, planningData, facturesData] = await Promise.all([
        unifiedEntreprisesService.getByChantier(chantierId),
        unifiedDevisService.getByChantier(chantierId),
        unifiedCommandesService.getByChantier(chantierId),
        unifiedPaiementsService.getByChantier(chantierId),
        unifiedDocumentsService.getByChantier(chantierId),
        unifiedPlanningService.getByChantier(chantierId),
        unifiedFacturesService.getByChantier(chantierId)
      ]);

      setEntreprises(entreprisesData);
      setDevis(devisData);
      setCommandes(commandesData);
      setPaiements(paiementsData);
      setDocuments(documentsData);
      setRendezVous(planningData);
      setFactures(facturesData);

      console.log(`✅ CHANTIER V2 ${chantierId} chargé:`, {
        entreprises: entreprisesData.length,
        devis: devisData.length,
        commandes: commandesData.length,
        paiements: paiementsData.length,
        documents: documentsData.length,
        planning: planningData.length,
        factures: facturesData.length
      });

    } catch (error) {
      console.error('Erreur chargement données chantier V2:', error);
      setError('Erreur lors du chargement des données');
      // Données vierges en cas d'erreur
      setEntreprises([]);
      setDevis([]);
      setCommandes([]);
      setPaiements([]);
      setDocuments([]);
      setRendezVous([]);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    entreprises,
    devis,
    commandes,
    paiements,
    documents,
    rendezVous,
    factures,
    loading,
    error,
    reloadData: loadChantierData
  };
}
