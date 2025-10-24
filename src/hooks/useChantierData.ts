import { useState, useEffect } from 'react';
import { entreprisesService, devisService, commandesService, paiementsService } from '../firebase/entreprises';
import { documentsService } from '../firebase/documents';
import { rendezVousService } from '../firebase/calendar';
import type { Entreprise, Devis, Commande, Paiement } from '../firebase/entreprises';
import type { DocumentOfficiel } from '../firebase/documents';
import type { RendezVous } from '../firebase/calendar';

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

      console.log(`🔍 CHARGEMENT DONNÉES pour chantier: ${chantierId}`);

      // Chargement selon le type de chantier
      if (chantierId === 'chantier-principal') {
        // CHANTIER PRINCIPAL = Anciennes données (structure globale)
        try {
          console.log('📊 Chargement données chantier principal (structure globale)');

          const [entreprisesData, rendezVousData] = await Promise.all([
            entreprisesService.getAll(),
            rendezVousService.getAll()
          ]);

          // Charger devis, commandes, paiements, documents pour chaque entreprise
          let tousDevis: Devis[] = [];
          let toutesCommandes: Commande[] = [];
          let tousPaiements: Paiement[] = [];
          let tousDocuments: DocumentOfficiel[] = [];

          for (const entreprise of entreprisesData) {
            if (entreprise.id) {
              const [devisEnt, commandesEnt, paiementsEnt, documentsEnt] = await Promise.all([
                devisService.getByEntreprise(entreprise.id),
                commandesService.getByEntreprise(entreprise.id),
                paiementsService.getByEntreprise(entreprise.id),
                documentsService.getByEntreprise(entreprise.id)
              ]);

              tousDevis.push(...devisEnt);
              toutesCommandes.push(...commandesEnt);
              tousPaiements.push(...paiementsEnt);
              tousDocuments.push(...documentsEnt);
            }
          }

          setEntreprises(entreprisesData.map(ent => ({ ...ent, chantierId: 'chantier-principal' })));
          setDevis(tousDevis);
          setCommandes(toutesCommandes);
          setPaiements(tousPaiements);
          setDocuments(tousDocuments);
          setRendezVous(rendezVousData);

        } catch (error) {
          console.error('Erreur chargement données chantier principal:', error);
          setEntreprises([]);
          setDevis([]);
          setCommandes([]);
          setPaiements([]);
          setDocuments([]);
          setRendezVous([]);
        }
      } else {
        // NOUVEAUX CHANTIERS = Structure par chantier
        try {
          console.log(`📊 Chargement données chantier ${chantierId} (structure par chantier)`);

          // Charger les entreprises du chantier
          const entreprisesData = await entreprisesService.getByChantierNew(chantierId);
          setEntreprises(entreprisesData);

          // Pour les nouveaux chantiers, les données sont vierges
          // Les entreprises sont dans chantiers/{chantierId}/entreprises
          // Mais devis, commandes, paiements, documents sont encore dans entreprises/{entrepriseId}/xxx
          // PROBLÈME: Les services chargent depuis la structure globale au lieu de la structure par chantier

          console.log(`⚠️ PROBLÈME DÉTECTÉ: Nouveau chantier ${chantierId} avec ${entreprisesData.length} entreprises`);
          console.log('🔍 Les données devraient être vierges pour un nouveau chantier');

          // FORCER des données vierges pour les nouveaux chantiers
          let tousDevis: Devis[] = [];
          let toutesCommandes: Commande[] = [];
          let tousPaiements: Paiement[] = [];
          let tousDocuments: DocumentOfficiel[] = [];

          // TODO: Implémenter la vraie structure par chantier plus tard
          // Pour l'instant, nouveaux chantiers = données vierges

          // Pour les nouveaux chantiers, pas de rendez-vous pour l'instant
          // TODO: Implémenter une structure de rendez-vous par chantier
          setRendezVous([]);

          setDevis(tousDevis);
          setCommandes(toutesCommandes);
          setPaiements(tousPaiements);
          setDocuments(tousDocuments);

          console.log(`✅ NOUVEAU CHANTIER ${chantierId} chargé: ${entreprisesData.length} entreprises, ${tousDevis.length} devis, ${toutesCommandes.length} commandes, ${tousPaiements.length} paiements`);
          console.log('🎯 Chantier vierge - données isolées du chantier principal');

        } catch (error) {
          console.error(`Erreur chargement chantier ${chantierId}:`, error);
          // Chantier vierge en cas d'erreur
          setEntreprises([]);
          setDevis([]);
          setCommandes([]);
          setPaiements([]);
          setDocuments([]);
          setRendezVous([]);
        }
      }

    } catch (error) {
      console.error('Erreur chargement données chantier:', error);
      setError('Erreur lors du chargement des données');
      setEntreprises([]);
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
