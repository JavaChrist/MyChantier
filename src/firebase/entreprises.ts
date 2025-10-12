import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface Entreprise {
  id?: string;
  nom: string;
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

// Fonctions CRUD pour les entreprises
export const entreprisesService = {
  // Récupérer toutes les entreprises
  async getAll(): Promise<Entreprise[]> {
    const q = query(collection(db, 'entreprises'), orderBy('dateCreation', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateCreation: doc.data().dateCreation.toDate()
    } as Entreprise));
  },

  // Récupérer les entreprises par secteur
  async getBySecteur(secteur: string): Promise<Entreprise[]> {
    const q = query(
      collection(db, 'entreprises'),
      where('secteurActivite', '==', secteur),
      orderBy('nom')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateCreation: doc.data().dateCreation.toDate()
    } as Entreprise));
  },

  // Créer une nouvelle entreprise
  async create(entreprise: Omit<Entreprise, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'entreprises'), {
      ...entreprise,
      dateCreation: Timestamp.fromDate(entreprise.dateCreation)
    });
    return docRef.id;
  },

  // Mettre à jour une entreprise
  async update(id: string, entreprise: Partial<Entreprise>): Promise<void> {
    const docRef = doc(db, 'entreprises', id);
    const updateData: any = { ...entreprise };
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer une entreprise
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'entreprises', id));
  }
};

// Fonctions CRUD pour les devis d'une entreprise
export const devisService = {
  // Récupérer tous les devis d'une entreprise
  async getByEntreprise(entrepriseId: string): Promise<Devis[]> {
    const q = query(
      collection(db, `entreprises/${entrepriseId}/devis`),
      orderBy('dateRemise', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateRemise: doc.data().dateRemise.toDate(),
      dateValidite: doc.data().dateValidite.toDate()
    } as Devis));
  },

  // Créer un nouveau devis
  async create(entrepriseId: string, devis: Omit<Devis, 'id' | 'entrepriseId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `entreprises/${entrepriseId}/devis`), {
      ...devis,
      entrepriseId,
      dateRemise: Timestamp.fromDate(devis.dateRemise),
      dateValidite: Timestamp.fromDate(devis.dateValidite)
    });
    return docRef.id;
  },

  // Mettre à jour un devis
  async update(entrepriseId: string, devisId: string, devis: Partial<Devis>): Promise<void> {
    const docRef = doc(db, `entreprises/${entrepriseId}/devis`, devisId);
    const updateData: any = { ...devis };
    if (updateData.dateRemise) {
      updateData.dateRemise = Timestamp.fromDate(updateData.dateRemise);
    }
    if (updateData.dateValidite) {
      updateData.dateValidite = Timestamp.fromDate(updateData.dateValidite);
    }
    await updateDoc(docRef, updateData);
  }
};

// Fonctions CRUD pour les commandes d'une entreprise
export const commandesService = {
  // Récupérer toutes les commandes d'une entreprise
  async getByEntreprise(entrepriseId: string): Promise<Commande[]> {
    const q = query(
      collection(db, `entreprises/${entrepriseId}/commandes`),
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
  },

  // Créer une nouvelle commande
  async create(entrepriseId: string, commande: Omit<Commande, 'id' | 'entrepriseId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `entreprises/${entrepriseId}/commandes`), {
      ...commande,
      entrepriseId,
      dateCommande: Timestamp.fromDate(commande.dateCommande),
      dateDebutPrevue: Timestamp.fromDate(commande.dateDebutPrevue),
      dateFinPrevue: Timestamp.fromDate(commande.dateFinPrevue)
    });
    return docRef.id;
  },

  // Mettre à jour une commande
  async update(entrepriseId: string, commandeId: string, commande: Partial<Commande>): Promise<void> {
    const docRef = doc(db, `entreprises/${entrepriseId}/commandes`, commandeId);
    const updateData: any = { ...commande };
    if (updateData.dateCommande) {
      updateData.dateCommande = Timestamp.fromDate(updateData.dateCommande);
    }
    if (updateData.dateDebutPrevue) {
      updateData.dateDebutPrevue = Timestamp.fromDate(updateData.dateDebutPrevue);
    }
    if (updateData.dateFinPrevue) {
      updateData.dateFinPrevue = Timestamp.fromDate(updateData.dateFinPrevue);
    }
    await updateDoc(docRef, updateData);
  }
};

// Fonctions CRUD pour les paiements d'une entreprise
export const paiementsService = {
  // Récupérer tous les paiements d'une entreprise
  async getByEntreprise(entrepriseId: string): Promise<Paiement[]> {
    const q = query(
      collection(db, `entreprises/${entrepriseId}/paiements`),
      orderBy('datePrevue', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      datePrevue: doc.data().datePrevue.toDate(),
      dateReglement: doc.data().dateReglement?.toDate()
    } as Paiement));
  },

  // Créer un nouveau paiement
  async create(entrepriseId: string, paiement: Omit<Paiement, 'id' | 'entrepriseId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `entreprises/${entrepriseId}/paiements`), {
      ...paiement,
      entrepriseId,
      datePrevue: Timestamp.fromDate(paiement.datePrevue),
      dateReglement: paiement.dateReglement ? Timestamp.fromDate(paiement.dateReglement) : null
    });
    return docRef.id;
  },

  // Mettre à jour un paiement
  async update(entrepriseId: string, paiementId: string, paiement: Partial<Paiement>): Promise<void> {
    const docRef = doc(db, `entreprises/${entrepriseId}/paiements`, paiementId);
    const updateData: any = { ...paiement };
    if (updateData.datePrevue) {
      updateData.datePrevue = Timestamp.fromDate(updateData.datePrevue);
    }
    if (updateData.dateReglement) {
      updateData.dateReglement = Timestamp.fromDate(updateData.dateReglement);
    }
    await updateDoc(docRef, updateData);
  }
};
