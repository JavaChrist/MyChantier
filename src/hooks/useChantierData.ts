import { useState, useEffect } from 'react';
import {
  unifiedEntreprisesService,
  unifiedDevisService,
  unifiedCommandesService,
  unifiedPaiementsService,
  unifiedDocumentsService,
  unifiedPlanningService
} from '../firebase/unified-services';
import type { Entreprise, Devis, Commande, Paiement, DocumentOfficiel, RendezVous } from '../firebase/unified-services';

// Hook pour charger toutes les données d'un chantier
export function useChantierData(chantierId: string | null) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [documents, setDocuments] = useState<DocumentOfficiel[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
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
      const [entreprisesData, devisData, commandesData, paiementsData, documentsData, planningData] = await Promise.all([
        unifiedEntreprisesService.getByChantier(chantierId),
        unifiedDevisService.getByChantier(chantierId),
        unifiedCommandesService.getByChantier(chantierId),
        unifiedPaiementsService.getByChantier(chantierId),
        unifiedDocumentsService.getByChantier(chantierId),
        unifiedPlanningService.getByChantier(chantierId)
      ]);

      setEntreprises(entreprisesData);
      setDevis(devisData);
      setCommandes(commandesData);
      setPaiements(paiementsData);
      setDocuments(documentsData);
      setRendezVous(planningData);

      console.log(`✅ CHANTIER V2 ${chantierId} chargé:`, {
        entreprises: entreprisesData.length,
        devis: devisData.length,
        commandes: commandesData.length,
        paiements: paiementsData.length,
        documents: documentsData.length,
        planning: planningData.length
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
    loading,
    error,
    reloadData: loadChantierData
  };
}
