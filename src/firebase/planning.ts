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

export interface TacheChantier {
  id?: string;
  planningId: string;
  commandeId: string;
  entrepriseId: string;
  entrepriseNom: string;
  secteur: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  nom: string;
  description: string;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  dateDebutReelle?: Date;
  dateFinReelle?: Date;
  dureeEstimee: number; // en jours
  statut: 'non-commencee' | 'en-cours' | 'terminee' | 'bloquee';
  dependances: string[]; // IDs des tâches qui doivent être terminées avant
  notes?: string;
  ordre: number; // Pour le tri
}

export interface PlanningChantier {
  id?: string;
  nom: string;
  adresse: string;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  statut: 'planifie' | 'en-cours' | 'termine' | 'suspendu';
  notes?: string;
  dateCreation: Date;
}

// Templates de dépendances par secteur
export const DEPENDANCES_TEMPLATES = {
  // Exemple : Rénovation salle de bain
  'renovation-sdb': [
    { secteur: 'carrelage', nom: 'Démontage carrelage existant', duree: 1, dependances: [] },
    { secteur: 'sanitaire', nom: 'Pose conduites eau', duree: 2, dependances: ['Démontage carrelage existant'] },
    { secteur: 'electricite', nom: 'Installation électrique', duree: 1, dependances: ['Démontage carrelage existant'] },
    { secteur: 'carrelage', nom: 'Pose nouveau carrelage', duree: 3, dependances: ['Pose conduites eau', 'Installation électrique'] },
    { secteur: 'sanitaire', nom: 'Installation équipements', duree: 1, dependances: ['Pose nouveau carrelage'] },
    { secteur: 'peinture', nom: 'Peinture finale', duree: 2, dependances: ['Installation équipements'] }
  ],
  // Exemple : Rénovation cuisine
  'renovation-cuisine': [
    { secteur: 'electricite', nom: 'Mise aux normes électrique', duree: 2, dependances: [] },
    { secteur: 'sanitaire', nom: 'Plomberie cuisine', duree: 1, dependances: ['Mise aux normes électrique'] },
    { secteur: 'carrelage', nom: 'Carrelage sol', duree: 2, dependances: ['Plomberie cuisine'] },
    { secteur: 'menuiserie', nom: 'Pose cuisine', duree: 2, dependances: ['Carrelage sol'] },
    { secteur: 'peinture', nom: 'Peinture murale', duree: 1, dependances: ['Pose cuisine'] }
  ]
};

// Service pour les plannings
export const planningService = {
  // Récupérer tous les plannings
  async getAll(): Promise<PlanningChantier[]> {
    const q = query(collection(db, 'plannings'), orderBy('dateCreation', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateDebutPrevue: doc.data().dateDebutPrevue.toDate(),
      dateFinPrevue: doc.data().dateFinPrevue.toDate(),
      dateCreation: doc.data().dateCreation.toDate()
    } as PlanningChantier));
  },

  // Créer un nouveau planning
  async create(planning: Omit<PlanningChantier, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'plannings'), {
      ...planning,
      dateDebutPrevue: Timestamp.fromDate(planning.dateDebutPrevue),
      dateFinPrevue: Timestamp.fromDate(planning.dateFinPrevue),
      dateCreation: Timestamp.fromDate(planning.dateCreation)
    });
    return docRef.id;
  },

  // Mettre à jour un planning
  async update(id: string, planning: Partial<PlanningChantier>): Promise<void> {
    const docRef = doc(db, 'plannings', id);
    const updateData: any = { ...planning };
    if (updateData.dateDebutPrevue) {
      updateData.dateDebutPrevue = Timestamp.fromDate(updateData.dateDebutPrevue);
    }
    if (updateData.dateFinPrevue) {
      updateData.dateFinPrevue = Timestamp.fromDate(updateData.dateFinPrevue);
    }
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer un planning
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'plannings', id));
  }
};

// Service pour les tâches d'un planning
export const tachesService = {
  // Récupérer toutes les tâches d'un planning
  async getByPlanning(planningId: string): Promise<TacheChantier[]> {
    const q = query(
      collection(db, `plannings/${planningId}/taches`),
      orderBy('ordre')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateDebutPrevue: doc.data().dateDebutPrevue.toDate(),
      dateFinPrevue: doc.data().dateFinPrevue.toDate(),
      dateDebutReelle: doc.data().dateDebutReelle?.toDate(),
      dateFinReelle: doc.data().dateFinReelle?.toDate()
    } as TacheChantier));
  },

  // Créer une nouvelle tâche
  async create(planningId: string, tache: Omit<TacheChantier, 'id' | 'planningId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `plannings/${planningId}/taches`), {
      ...tache,
      planningId,
      dateDebutPrevue: Timestamp.fromDate(tache.dateDebutPrevue),
      dateFinPrevue: Timestamp.fromDate(tache.dateFinPrevue),
      dateDebutReelle: tache.dateDebutReelle ? Timestamp.fromDate(tache.dateDebutReelle) : null,
      dateFinReelle: tache.dateFinReelle ? Timestamp.fromDate(tache.dateFinReelle) : null
    });
    return docRef.id;
  },

  // Mettre à jour une tâche
  async update(planningId: string, tacheId: string, tache: Partial<TacheChantier>): Promise<void> {
    const docRef = doc(db, `plannings/${planningId}/taches`, tacheId);
    const updateData: any = { ...tache };
    if (updateData.dateDebutPrevue) {
      updateData.dateDebutPrevue = Timestamp.fromDate(updateData.dateDebutPrevue);
    }
    if (updateData.dateFinPrevue) {
      updateData.dateFinPrevue = Timestamp.fromDate(updateData.dateFinPrevue);
    }
    if (updateData.dateDebutReelle) {
      updateData.dateDebutReelle = Timestamp.fromDate(updateData.dateDebutReelle);
    }
    if (updateData.dateFinReelle) {
      updateData.dateFinReelle = Timestamp.fromDate(updateData.dateFinReelle);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer une tâche
  async delete(planningId: string, tacheId: string): Promise<void> {
    await deleteDoc(doc(db, `plannings/${planningId}/taches`, tacheId));
  }
};
