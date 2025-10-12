import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Upload d'un fichier de devis
export const uploadDevisFile = async (
  entrepriseId: string,
  devisId: string,
  file: File
): Promise<string> => {
  try {
    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Utilisez PDF, Word, JPEG ou PNG.');
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 10MB).');
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Chemin dans Firebase Storage
    const filePath = `entreprises/${entrepriseId}/devis/${devisId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    // Upload du fichier
    const snapshot = await uploadBytes(storageRef, file);

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw error;
  }
};

// Supprimer un fichier de devis
export const deleteDevisFile = async (fileUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
};

// Obtenir l'extension du fichier à partir de l'URL
export const getFileExtension = (url: string): string => {
  try {
    const urlParts = url.split('?')[0].split('.');
    return urlParts[urlParts.length - 1].toLowerCase();
  } catch {
    return '';
  }
};

// Obtenir le type de fichier pour l'affichage
export const getFileType = (url: string): 'pdf' | 'word' | 'image' | 'other' => {
  const extension = getFileExtension(url);

  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
  return 'other';
};

// Obtenir le nom du fichier à partir de l'URL
export const getFileName = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    const fileName = fileNameWithParams.split('?')[0];

    // Enlever le timestamp du début si présent
    const cleanName = fileName.replace(/^\d+_/, '');
    return decodeURIComponent(cleanName);
  } catch {
    return 'Fichier';
  }
};
