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

export interface Chantier {
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
  professionalId: string; // ID du professionnel qui gère ce chantier
  notes?: string;
  dateCreation: Date;
  dateModification: Date;
}

// Service pour les chantiers
export const chantierService = {
  // Récupérer tous les chantiers d'un professionnel
  async getByProfessional(professionalId: string): Promise<Chantier[]> {
    const q = query(
      collection(db, 'chantiers'),
      where('professionalId', '==', professionalId),
      orderBy('dateModification', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateDebut: doc.data().dateDebut.toDate(),
      dateFinPrevue: doc.data().dateFinPrevue.toDate(),
      dateFinReelle: doc.data().dateFinReelle?.toDate(),
      dateCreation: doc.data().dateCreation.toDate(),
      dateModification: doc.data().dateModification.toDate()
    } as Chantier));
  },

  // Créer un nouveau chantier
  async create(chantier: Omit<Chantier, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chantiers'), {
      ...chantier,
      dateDebut: Timestamp.fromDate(chantier.dateDebut),
      dateFinPrevue: Timestamp.fromDate(chantier.dateFinPrevue),
      dateFinReelle: chantier.dateFinReelle ? Timestamp.fromDate(chantier.dateFinReelle) : null,
      dateCreation: Timestamp.fromDate(chantier.dateCreation),
      dateModification: Timestamp.fromDate(chantier.dateModification)
    });
    return docRef.id;
  },

  // Mettre à jour un chantier
  async update(id: string, chantier: Partial<Chantier>): Promise<void> {
    const docRef = doc(db, 'chantiers', id);
    const updateData: any = {
      ...chantier,
      dateModification: Timestamp.fromDate(new Date())
    };

    if (updateData.dateDebut) {
      updateData.dateDebut = Timestamp.fromDate(updateData.dateDebut);
    }
    if (updateData.dateFinPrevue) {
      updateData.dateFinPrevue = Timestamp.fromDate(updateData.dateFinPrevue);
    }
    if (updateData.dateFinReelle) {
      updateData.dateFinReelle = Timestamp.fromDate(updateData.dateFinReelle);
    }
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }

    await updateDoc(docRef, updateData);
  },

  // Supprimer un chantier
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'chantiers', id));
  },

  // Récupérer un chantier spécifique
  async getById(id: string): Promise<Chantier | null> {
    try {
      const docRef = doc(db, 'chantiers', id);
      const docSnap = await getDocs(query(collection(db, 'chantiers'), where('__name__', '==', id)));

      if (!docSnap.empty) {
        const data = docSnap.docs[0].data();
        return {
          id: docSnap.docs[0].id,
          ...data,
          dateDebut: data.dateDebut.toDate(),
          dateFinPrevue: data.dateFinPrevue.toDate(),
          dateFinReelle: data.dateFinReelle?.toDate(),
          dateCreation: data.dateCreation.toDate(),
          dateModification: data.dateModification.toDate()
        } as Chantier;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération chantier:', error);
      return null;
    }
  }
};
