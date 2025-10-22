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

      // Chantier principal (tes données existantes réelles)
      if (chantierId === 'chantier-principal') {
        // TES VRAIES DONNÉES EXISTANTES - à préserver
        try {
          // Charger toutes tes données existantes
          const [
            entreprisesData,
            rendezVousData
          ] = await Promise.all([
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

          // Assigner toutes les données
          setEntreprises(entreprisesData.map(ent => ({ ...ent, chantierId: 'chantier-principal' })));
          setDevis(tousDevis);
          setCommandes(toutesCommandes);
          setPaiements(tousPaiements);
          setDocuments(tousDocuments);
          setRendezVous(rendezVousData);

        } catch (error) {
          console.error('Erreur chargement données existantes:', error);
          // Reset en cas d'erreur
          setEntreprises([]);
          setDevis([]);
          setCommandes([]);
          setPaiements([]);
          setDocuments([]);
          setRendezVous([]);
        }
      } else {
        // TOUS LES AUTRES CHANTIERS = VIERGES
        console.log(`Chantier ${chantierId} : Données vierges`);
        setEntreprises([]);
        setDevis([]);
        setCommandes([]);
        setPaiements([]);
        setDocuments([]);
        setRendezVous([]);
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
