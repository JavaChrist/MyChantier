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

export interface BudgetPrevisionnel {
  id?: string;
  nom: string;
  description: string;
  montantInitial: number;
  montantActuel: number;
  secteurs: {
    sanitaire: number;
    electricite: number;
    carrelage: number;
    menuiserie: number;
    peinture: number;
  };
  dateCreation: Date;
  dateModification: Date;
  notes?: string;
  statut: 'actif' | 'termine' | 'suspendu';
}

// Service pour les budgets prévisionnels
export const budgetService = {
  // Récupérer tous les budgets
  async getAll(): Promise<BudgetPrevisionnel[]> {
    const q = query(collection(db, 'budgets'), orderBy('dateCreation', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateCreation: doc.data().dateCreation.toDate(),
      dateModification: doc.data().dateModification.toDate()
    } as BudgetPrevisionnel));
  },

  // Créer un nouveau budget
  async create(budget: Omit<BudgetPrevisionnel, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'budgets'), {
      ...budget,
      dateCreation: Timestamp.fromDate(budget.dateCreation),
      dateModification: Timestamp.fromDate(budget.dateModification)
    });
    return docRef.id;
  },

  // Mettre à jour un budget
  async update(id: string, budget: Partial<BudgetPrevisionnel>): Promise<void> {
    const docRef = doc(db, 'budgets', id);
    const updateData: any = {
      ...budget,
      dateModification: Timestamp.fromDate(new Date())
    };
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer un budget
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'budgets', id));
  }
};
