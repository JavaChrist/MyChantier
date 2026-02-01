import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// NOUVELLE STRUCTURE FIREBASE V2 - COHÉRENTE ET ISOLÉE

// Interface pour les informations du chantier
export interface ChantierInfo {
  id?: string;
  nom: string;
  description: string;
  clientNom: string;
  clientEmail: string;
  clientTelephone?: string;
  adresse: string;
  dateDebut: Date;
  dateFinPrevue: Date;
  dateFinReelle?: Date;
  budget?: number;
  statut: 'planifie' | 'en-cours' | 'termine' | 'suspendu';
  professionalId: string;
  dateCreation: Date;
  dateModification: Date;
  notes?: string;
}

// Interface pour les entreprises (par chantier)
export interface EntrepriseV2 {
  id?: string;
  nom: string;
  siret?: string;
  secteurActivite: string;
  contact: {
    nom: string;
    telephone: string;
    email: string;
  };
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
  };
  rib?: {
    iban: string;
    bic: string;
    titulaire: string;
    banque: string;
  };
  notes?: string;
  dateCreation: Date;
}

// Interface pour les devis (par chantier)
export interface DevisV2 {
  id?: string;
  entrepriseId: string;
  numero: string;
  prestationNom: string;
  description: string;
  montantHT: number;
  montantTTC: number;
  dateRemise: Date;
  dateValidite: Date;
  statut: 'en-attente' | 'valide' | 'refuse';
  fichierUrl?: string;
  notes?: string;
}

// Interface pour les commandes (par chantier)
export interface CommandeV2 {
  id?: string;
  entrepriseId: string;
  devisId: string;
  numero: string;
  prestationNom: string;
  montantHT: number;
  montantTTC: number;
  dateCommande: Date;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  statut: 'commandee' | 'en-cours' | 'terminee' | 'annulee';
  devisSigneUrl?: string;
}

// Interface pour les paiements (par chantier)
export interface PaiementV2 {
  id?: string;
  entrepriseId: string;
  commandeId: string;
  type: 'acompte' | 'situation' | 'solde';
  montant: number;
  datePrevue: Date;
  dateReglement?: Date;
  statut: 'prevu' | 'regle' | 'en-retard';
  notes?: string;
}

// Interface pour les documents (par chantier)
export interface DocumentV2 {
  id?: string;
  entrepriseId: string;
  type: 'assurance-rc' | 'assurance-decennale' | 'garantie' | 'certification' | 'kbis' | 'autre';
  nom: string;
  statut: 'valide' | 'expire' | 'bientot-expire';
  fichierUrl: string;
  fichierNom: string;
  typeFichier: string;
  tailleFichier: number;
  dateUpload: Date;
}

// Interface pour les rendez-vous (par chantier)
export interface RendezVousV2 {
  id?: string;
  titre: string;
  description?: string;
  dateDebut: Date;
  dateFin: Date;
  type: 'reunion' | 'livraison' | 'intervention' | 'autre';
  entrepriseId?: string;
  statut: 'planifie' | 'confirme' | 'termine' | 'annule';
  notes?: string;
}

// =============================================================================
// SERVICES V2 - STRUCTURE PAR CHANTIER
// =============================================================================

export const chantiersV2Service = {
  // Récupérer les informations d'un chantier
  async getChantierInfo(chantierId: string): Promise<ChantierInfo | null> {
    try {
      const docSnap = await getDocs(collection(db, `chantiers/${chantierId}/info`));

      if (docSnap.docs.length > 0) {
        const data = docSnap.docs[0].data();
        return {
          id: chantierId,
          ...data,
          dateDebut: data.dateDebut.toDate(),
          dateFinPrevue: data.dateFinPrevue.toDate(),
          dateFinReelle: data.dateFinReelle?.toDate(),
          dateCreation: data.dateCreation.toDate(),
          dateModification: data.dateModification.toDate()
        } as ChantierInfo;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération info chantier:', error);
      return null;
    }
  },

  // Créer un nouveau chantier avec sa structure complète
  async createChantier(chantierData: Omit<ChantierInfo, 'id'>): Promise<string> {
    try {
      // Créer l'ID du chantier
      const chantierId = `chantier-${Date.now()}`;

      // Créer le document d'information du chantier
      await addDoc(collection(db, `chantiers/${chantierId}/info`), {
        ...chantierData,
        dateDebut: Timestamp.fromDate(chantierData.dateDebut),
        dateFinPrevue: Timestamp.fromDate(chantierData.dateFinPrevue),
        dateFinReelle: chantierData.dateFinReelle ? Timestamp.fromDate(chantierData.dateFinReelle) : null,
        dateCreation: Timestamp.fromDate(chantierData.dateCreation),
        dateModification: Timestamp.fromDate(chantierData.dateModification)
      });

      console.log(`✅ Chantier ${chantierId} créé avec structure V2`);
      return chantierId;
    } catch (error) {
      console.error('Erreur création chantier V2:', error);
      throw error;
    }
  }
};

export const entreprisesV2Service = {
  // Récupérer toutes les entreprises d'un chantier
  async getByChantier(chantierId: string): Promise<EntrepriseV2[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/entreprises`),
        orderBy('dateCreation', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreation: doc.data().dateCreation.toDate()
      } as EntrepriseV2));
    } catch (error) {
      console.error(`Erreur chargement entreprises chantier ${chantierId}:`, error);
      return [];
    }
  },

  // Créer une entreprise dans un chantier
  async create(chantierId: string, entreprise: Omit<EntrepriseV2, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/entreprises`), {
      ...entreprise,
      dateCreation: Timestamp.fromDate(entreprise.dateCreation)
    });
    return docRef.id;
  }
};

export const devisV2Service = {
  // Récupérer tous les devis d'un chantier
  async getByChantier(chantierId: string): Promise<DevisV2[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/devis`),
        orderBy('dateRemise', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateRemise: doc.data().dateRemise.toDate(),
        dateValidite: doc.data().dateValidite.toDate()
      } as DevisV2));
    } catch (error) {
      console.error(`Erreur chargement devis chantier ${chantierId}:`, error);
      return [];
    }
  }
};

// Services pour commandes, paiements, documents, rendez-vous suivent le même pattern...
// Structure cohérente : chantiers/{chantierId}/{type}/

// Le service de migration est maintenant dans utils/migration.ts
