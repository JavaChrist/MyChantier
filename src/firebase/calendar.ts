import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface RendezVous {
  id?: string;
  titre: string;
  entrepriseId: string;
  dateHeure: Date;
  lieu: string;
  type: 'visite-chantier' | 'remise-devis' | 'reunion' | 'autre';
  notes?: string;
  statut: 'planifie' | 'realise' | 'annule';
  confirme: boolean;
  dateCreation: Date;
}

// Service pour les rendez-vous
export const rendezVousService = {
  // Récupérer tous les rendez-vous
  async getAll(): Promise<RendezVous[]> {
    const q = query(collection(db, 'rendezVous'), orderBy('dateHeure', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateHeure: data.dateHeure.toDate(),
        dateCreation: data.dateCreation.toDate(),
        confirme: data.confirme || false // Rétrocompatibilité
      } as RendezVous;
    });
  },

  // Récupérer les rendez-vous d'une entreprise
  async getByEntreprise(entrepriseId: string): Promise<RendezVous[]> {
    const q = query(
      collection(db, 'rendezVous'),
      where('entrepriseId', '==', entrepriseId),
      orderBy('dateHeure', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateHeure: data.dateHeure.toDate(),
        dateCreation: data.dateCreation.toDate(),
        confirme: data.confirme || false // Rétrocompatibilité
      } as RendezVous;
    });
  },

  // Récupérer les rendez-vous d'une période
  async getByPeriod(dateDebut: Date, dateFin: Date): Promise<RendezVous[]> {
    const q = query(
      collection(db, 'rendezVous'),
      where('dateHeure', '>=', Timestamp.fromDate(dateDebut)),
      where('dateHeure', '<=', Timestamp.fromDate(dateFin)),
      orderBy('dateHeure', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateHeure: data.dateHeure.toDate(),
        dateCreation: data.dateCreation.toDate(),
        confirme: data.confirme || false // Rétrocompatibilité
      } as RendezVous;
    });
  },

  // Créer un nouveau rendez-vous
  async create(rendezVous: Omit<RendezVous, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'rendezVous'), {
      ...rendezVous,
      dateHeure: Timestamp.fromDate(rendezVous.dateHeure),
      dateCreation: Timestamp.fromDate(rendezVous.dateCreation || new Date())
    });
    return docRef.id;
  },

  // Mettre à jour un rendez-vous
  async update(id: string, rendezVous: Partial<RendezVous>): Promise<void> {
    const docRef = doc(db, 'rendezVous', id);
    const updateData: any = { ...rendezVous };
    if (updateData.dateHeure) {
      updateData.dateHeure = Timestamp.fromDate(updateData.dateHeure);
    }
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer un rendez-vous
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rendezVous', id));
  }
};
