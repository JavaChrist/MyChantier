import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// SERVICES UNIFIÉS V2 - UNE SEULE STRUCTURE POUR TOUS LES CHANTIERS

export interface Entreprise {
  id?: string;
  nom: string;
  siret?: string;
  secteurActivite: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
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

export interface Devis {
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

export interface Commande {
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

export interface Paiement {
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

export interface DocumentOfficiel {
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

export interface RendezVous {
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

export interface Etape {
  id?: string;
  nom: string;
  description: string;
  dateDebut: Date;
  dateFin: Date;
  statut: 'planifiee' | 'en-cours' | 'terminee' | 'en-retard';
  entrepriseId?: string;
  ordre: number;
  notes?: string;
}

export interface Message {
  id?: string;
  sender: 'professional' | 'client';
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'decision' | 'validation';
  isRead: boolean;
}

// =============================================================================
// SERVICES UNIFIÉS - STRUCTURE PAR CHANTIER COHÉRENTE
// =============================================================================

export const unifiedEntreprisesService = {
  // Récupérer toutes les entreprises d'un chantier
  async getByChantier(chantierId: string): Promise<Entreprise[]> {
    try {
      console.log(`🔍 Chargement entreprises chantier ${chantierId}`);
      const q = query(
        collection(db, `chantiers/${chantierId}/entreprises`),
        orderBy('dateCreation', 'desc')
      );
      const snapshot = await getDocs(q);
      const entreprises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreation: doc.data().dateCreation.toDate()
      } as Entreprise));

      console.log(`✅ ${entreprises.length} entreprises chargées pour ${chantierId}`);
      return entreprises;
    } catch (error) {
      console.error(`❌ Erreur chargement entreprises ${chantierId}:`, error);
      return [];
    }
  },

  // Créer une entreprise dans un chantier
  async create(chantierId: string, entreprise: Omit<Entreprise, 'id'>): Promise<string> {
    console.log(`🏗️ Création entreprise dans ${chantierId}:`, entreprise.nom);
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/entreprises`), {
      ...entreprise,
      dateCreation: Timestamp.fromDate(entreprise.dateCreation)
    });
    console.log(`✅ Entreprise créée: ${docRef.id}`);
    return docRef.id;
  },

  // Mettre à jour une entreprise
  async update(chantierId: string, entrepriseId: string, entreprise: Partial<Entreprise>): Promise<void> {
    const docRef = doc(db, `chantiers/${chantierId}/entreprises`, entrepriseId);
    const updateData: any = { ...entreprise };
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer une entreprise
  async delete(chantierId: string, entrepriseId: string): Promise<void> {
    await deleteDoc(doc(db, `chantiers/${chantierId}/entreprises`, entrepriseId));
  }
};

export const unifiedDevisService = {
  // Récupérer tous les devis d'un chantier
  async getByChantier(chantierId: string): Promise<Devis[]> {
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
      } as Devis));
    } catch (error) {
      console.error(`❌ Erreur chargement devis ${chantierId}:`, error);
      return [];
    }
  },

  // Créer un devis
  async create(chantierId: string, devis: Omit<Devis, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/devis`), {
      ...devis,
      dateRemise: Timestamp.fromDate(devis.dateRemise),
      dateValidite: Timestamp.fromDate(devis.dateValidite)
    });
    return docRef.id;
  }
};

export const unifiedCommandesService = {
  // Récupérer toutes les commandes d'un chantier
  async getByChantier(chantierId: string): Promise<Commande[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/commandes`),
        orderBy('dateCommande', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCommande: doc.data().dateCommande.toDate(),
        dateDebutPrevue: doc.data().dateDebutPrevue.toDate(),
        dateFinPrevue: doc.data().dateFinPrevue.toDate()
      } as Commande));
    } catch (error) {
      console.error(`❌ Erreur chargement commandes ${chantierId}:`, error);
      return [];
    }
  },

  // Créer une commande
  async create(chantierId: string, commande: Omit<Commande, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/commandes`), {
      ...commande,
      dateCommande: Timestamp.fromDate(commande.dateCommande),
      dateDebutPrevue: Timestamp.fromDate(commande.dateDebutPrevue),
      dateFinPrevue: Timestamp.fromDate(commande.dateFinPrevue)
    });
    return docRef.id;
  }
};

export const unifiedPaiementsService = {
  // Récupérer tous les paiements d'un chantier
  async getByChantier(chantierId: string): Promise<Paiement[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/paiements`),
        orderBy('datePrevue', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        datePrevue: doc.data().datePrevue.toDate(),
        dateReglement: doc.data().dateReglement?.toDate()
      } as Paiement));
    } catch (error) {
      console.error(`❌ Erreur chargement paiements ${chantierId}:`, error);
      return [];
    }
  },

  // Créer un paiement
  async create(chantierId: string, paiement: Omit<Paiement, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/paiements`), {
      ...paiement,
      datePrevue: Timestamp.fromDate(paiement.datePrevue),
      dateReglement: paiement.dateReglement ? Timestamp.fromDate(paiement.dateReglement) : null
    });
    return docRef.id;
  }
};

export const unifiedDocumentsService = {
  // Récupérer tous les documents d'un chantier
  async getByChantier(chantierId: string): Promise<DocumentOfficiel[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/documents`),
        orderBy('dateUpload', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateUpload: doc.data().dateUpload.toDate()
      } as DocumentOfficiel));
    } catch (error) {
      console.error(`❌ Erreur chargement documents ${chantierId}:`, error);
      return [];
    }
  },

  // Créer un document
  async create(chantierId: string, document: Omit<DocumentOfficiel, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/documents`), {
      ...document,
      dateUpload: Timestamp.fromDate(document.dateUpload)
    });
    return docRef.id;
  }
};

export const unifiedPlanningService = {
  // Récupérer tous les rendez-vous d'un chantier
  async getByChantier(chantierId: string): Promise<RendezVous[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/planning`),
        orderBy('dateDebut', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data().dateDebut.toDate(),
        dateFin: doc.data().dateFin.toDate()
      } as RendezVous));
    } catch (error) {
      console.error(`❌ Erreur chargement planning ${chantierId}:`, error);
      return [];
    }
  },

  // Créer un rendez-vous
  async create(chantierId: string, rendezVous: Omit<RendezVous, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/planning`), {
      ...rendezVous,
      dateDebut: Timestamp.fromDate(rendezVous.dateDebut),
      dateFin: Timestamp.fromDate(rendezVous.dateFin)
    });
    return docRef.id;
  },

  // Mettre à jour un rendez-vous
  async update(chantierId: string, rendezVousId: string, rendezVous: Partial<RendezVous>): Promise<void> {
    const { updateDoc, doc } = await import('firebase/firestore');
    const rdvRef = doc(db, `chantiers/${chantierId}/planning`, rendezVousId);
    const updateData: any = { ...rendezVous };

    if (updateData.dateDebut) {
      updateData.dateDebut = Timestamp.fromDate(updateData.dateDebut);
    }
    if (updateData.dateFin) {
      updateData.dateFin = Timestamp.fromDate(updateData.dateFin);
    }

    await updateDoc(rdvRef, updateData);
  },

  // Supprimer un rendez-vous
  async delete(chantierId: string, rendezVousId: string): Promise<void> {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, `chantiers/${chantierId}/planning`, rendezVousId));
  }
};

export const unifiedEtapesService = {
  // Récupérer toutes les étapes d'un chantier
  async getByChantier(chantierId: string): Promise<Etape[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/etapes`),
        orderBy('ordre', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data().dateDebut.toDate(),
        dateFin: doc.data().dateFin.toDate()
      } as Etape));
    } catch (error) {
      console.error(`❌ Erreur chargement étapes ${chantierId}:`, error);
      return [];
    }
  },

  // Créer une étape
  async create(chantierId: string, etape: Omit<Etape, 'id'>): Promise<string> {
    // Nettoyer les données pour éviter les valeurs undefined
    const cleanData: any = {
      nom: etape.nom,
      description: etape.description,
      dateDebut: Timestamp.fromDate(etape.dateDebut),
      dateFin: Timestamp.fromDate(etape.dateFin),
      statut: etape.statut,
      ordre: etape.ordre
    };

    // Ajouter les champs optionnels seulement s'ils existent
    if (etape.entrepriseId) cleanData.entrepriseId = etape.entrepriseId;
    if (etape.notes) cleanData.notes = etape.notes;

    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/etapes`), cleanData);
    return docRef.id;
  },

  // Mettre à jour une étape
  async update(chantierId: string, etapeId: string, etape: Partial<Etape>): Promise<void> {
    const { updateDoc, doc } = await import('firebase/firestore');
    const etapeRef = doc(db, `chantiers/${chantierId}/etapes`, etapeId);

    // Nettoyer les données pour éviter les valeurs undefined
    const cleanData: any = {};

    if (etape.nom !== undefined) cleanData.nom = etape.nom;
    if (etape.description !== undefined) cleanData.description = etape.description;
    if (etape.statut !== undefined) cleanData.statut = etape.statut;
    if (etape.ordre !== undefined) cleanData.ordre = etape.ordre;

    if (etape.dateDebut) cleanData.dateDebut = Timestamp.fromDate(etape.dateDebut);
    if (etape.dateFin) cleanData.dateFin = Timestamp.fromDate(etape.dateFin);

    // Champs optionnels
    if (etape.entrepriseId) cleanData.entrepriseId = etape.entrepriseId;
    if (etape.notes) cleanData.notes = etape.notes;

    await updateDoc(etapeRef, cleanData);
  },

  // Supprimer une étape
  async delete(chantierId: string, etapeId: string): Promise<void> {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, `chantiers/${chantierId}/etapes`, etapeId));
  }
};

export const unifiedMessagesService = {
  // Récupérer tous les messages d'un chantier
  async getByChantier(chantierId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(db, `chantiers/${chantierId}/messages`),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      } as Message));
    } catch (error) {
      console.error(`❌ Erreur chargement messages ${chantierId}:`, error);
      return [];
    }
  },

  // Créer un message
  async create(chantierId: string, message: Omit<Message, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, `chantiers/${chantierId}/messages`), {
      ...message,
      timestamp: Timestamp.fromDate(message.timestamp)
    });
    return docRef.id;
  },

  // Marquer les messages comme lus
  async markAsRead(chantierId: string, messageIds: string[]): Promise<void> {
    const { updateDoc, doc } = await import('firebase/firestore');

    for (const messageId of messageIds) {
      const messageRef = doc(db, `chantiers/${chantierId}/messages`, messageId);
      await updateDoc(messageRef, { isRead: true });
    }
  }
};
