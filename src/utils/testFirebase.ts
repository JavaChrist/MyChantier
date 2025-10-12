import { db, storage } from '../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Test de Firestore
export const testFirestore = async () => {
  try {
    console.log('🔥 Test Firestore...');

    // Test d'écriture
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Test de connexion',
      timestamp: new Date()
    });
    console.log('✅ Firestore écriture OK, ID:', testDoc.id);

    // Test de lecture
    const snapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Firestore lecture OK, docs:', snapshot.size);

    return true;
  } catch (error) {
    console.error('❌ Erreur Firestore:', error);
    return false;
  }
};

// Test de Firebase Storage
export const testStorage = async () => {
  try {
    console.log('🔥 Test Firebase Storage...');

    // Créer un fichier de test
    const testContent = 'Test de Firebase Storage';
    const testFile = new Blob([testContent], { type: 'text/plain' });

    // Upload
    const storageRef = ref(storage, 'test/test.txt');
    const snapshot = await uploadBytes(storageRef, testFile);
    console.log('✅ Storage upload OK');

    // Récupérer l'URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Storage URL OK:', downloadURL);

    return true;
  } catch (error) {
    console.error('❌ Erreur Storage:', error);
    console.error('Détails:', error.message);
    return false;
  }
};

// Test complet
export const testFirebaseSetup = async () => {
  console.log('🚀 Test de la configuration Firebase...');

  const firestoreOK = await testFirestore();
  const storageOK = await testStorage();

  if (firestoreOK && storageOK) {
    console.log('🎉 Firebase entièrement configuré !');
    return true;
  } else {
    console.log('⚠️ Problèmes de configuration Firebase détectés');
    if (!firestoreOK) console.log('- Problème Firestore');
    if (!storageOK) console.log('- Problème Storage');
    return false;
  }
};
