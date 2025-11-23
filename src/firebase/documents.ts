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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export interface DocumentOfficiel {
  id?: string;
  entrepriseId: string;
  type: 'assurance-rc' | 'assurance-decennale' | 'garantie' | 'certification' | 'kbis' | 'autre';
  nom: string;
  description: string;
  numeroPolice?: string;
  compagnieAssurance?: string;
  dateDebut?: Date;
  dateFin?: Date;
  montantGarantie?: number;
  fichierUrl: string;
  fichierNom: string;
  tailleFichier: number;
  typeFichier: string;
  dateUpload: Date;
  statut: 'valide' | 'expire' | 'bientot-expire' | 'en-attente';
  notes?: string;
}

// Upload d'un document officiel
export const uploadDocumentFile = async (
  entrepriseId: string,
  documentId: string,
  file: File
): Promise<{ url: string; nom: string; taille: number; type: string }> => {
  try {
    console.log('Upload document:', file.name);

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`);
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 15MB).');
    }

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;

    const filePath = `entreprises/${entrepriseId}/documents/${documentId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      nom: file.name,
      taille: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Erreur upload document:', error);
    throw error;
  }
};

// Service pour les documents officiels
export const documentsService = {
  // Récupérer tous les documents d'une entreprise
  async getByEntreprise(entrepriseId: string): Promise<DocumentOfficiel[]> {
    const q = query(
      collection(db, `entreprises/${entrepriseId}/documents`),
      orderBy('dateUpload', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateDebut: data.dateDebut?.toDate(),
        dateFin: data.dateFin?.toDate(),
        dateUpload: data.dateUpload.toDate()
      } as DocumentOfficiel;
    });
  },

  // Récupérer tous les documents de toutes les entreprises
  async getAll(): Promise<(DocumentOfficiel & { entrepriseNom: string })[]> {
    // Cette fonction sera appelée depuis le composant qui a accès aux entreprises
    return [];
  },

  // Créer un nouveau document
  async create(entrepriseId: string, document: Omit<DocumentOfficiel, 'id' | 'entrepriseId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `entreprises/${entrepriseId}/documents`), {
      ...document,
      entrepriseId,
      dateDebut: document.dateDebut ? Timestamp.fromDate(document.dateDebut) : null,
      dateFin: document.dateFin ? Timestamp.fromDate(document.dateFin) : null,
      dateUpload: Timestamp.fromDate(document.dateUpload)
    });
    return docRef.id;
  },

  // Mettre à jour un document
  async update(entrepriseId: string, documentId: string, document: Partial<DocumentOfficiel>): Promise<void> {
    const docRef = doc(db, `entreprises/${entrepriseId}/documents`, documentId);
    const updateData: any = { ...document };
    if (updateData.dateDebut) {
      updateData.dateDebut = Timestamp.fromDate(updateData.dateDebut);
    }
    if (updateData.dateFin) {
      updateData.dateFin = Timestamp.fromDate(updateData.dateFin);
    }
    if (updateData.dateUpload) {
      updateData.dateUpload = Timestamp.fromDate(updateData.dateUpload);
    }
    await updateDoc(docRef, updateData);
  },

  // Supprimer un document
  async delete(entrepriseId: string, documentId: string): Promise<void> {
    await deleteDoc(doc(db, `entreprises/${entrepriseId}/documents`, documentId));
  },

  // Calculer le statut d'un document basé sur ses dates
  calculateStatut(document: DocumentOfficiel): DocumentOfficiel['statut'] {
    if (!document.dateFin) return 'valide';

    const maintenant = new Date();
    const dateFin = document.dateFin;
    const joursRestants = Math.ceil((dateFin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) return 'expire';
    if (joursRestants <= 30) return 'bientot-expire'; // Expire dans 30 jours
    return 'valide';
  }
};
