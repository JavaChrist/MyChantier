import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { emitGlobalAlert } from './alertBus';

/**
 * Ajouter un email secondaire à un chantier
 */
export async function ajouterEmailSecondaire(
  chantierId: string,
  email2: string,
  email3?: string
): Promise<boolean> {
  try {
    console.log(`📧 Ajout email(s) secondaire(s) au chantier: ${chantierId}`);
    
    // Vérifier d'abord le chantier
    const chantierRef = doc(db, 'chantiers', chantierId);
    const chantierDoc = await getDoc(chantierRef);
    
    if (!chantierDoc.exists()) {
      console.error(`❌ Chantier ${chantierId} non trouvé`);
      emitGlobalAlert({
        title: 'Chantier introuvable',
        message: `Chantier ${chantierId} non trouvé`,
        type: 'error'
      });
      return false;
    }
    
    const data = chantierDoc.data();
    console.log('📋 Données actuelles:', {
      nom: data.nom,
      clientEmail: data.clientEmail,
      clientEmail2: data.clientEmail2,
      clientEmail3: data.clientEmail3
    });
    
    // Préparer les mises à jour
    const updates: any = {};
    
    if (email2 && email2.trim()) {
      updates.clientEmail2 = email2.trim();
    }
    
    if (email3 && email3.trim()) {
      updates.clientEmail3 = email3.trim();
    }
    
    console.log('📝 Mise à jour avec:', updates);
    
    // Confirmer
    const confirmer = confirm(
      `Ajouter email(s) au chantier "${data.nom}" ?\n\n` +
      `Email principal actuel: ${data.clientEmail}\n` +
      (updates.clientEmail2 ? `Email secondaire: ${updates.clientEmail2}\n` : '') +
      (updates.clientEmail3 ? `Email tertiaire: ${updates.clientEmail3}\n` : '') +
      `\nContinuer ?`
    );
    
    if (!confirmer) {
      console.log('❌ Annulé');
      return false;
    }
    
    // Mettre à jour
    await updateDoc(chantierRef, updates);
    
    console.log('✅ Email(s) ajouté(s) avec succès !');
    
    // Vérifier
    const updatedDoc = await getDoc(chantierRef);
    console.log('✅ Vérification après mise à jour:', {
      clientEmail: updatedDoc.data()?.clientEmail,
      clientEmail2: updatedDoc.data()?.clientEmail2,
      clientEmail3: updatedDoc.data()?.clientEmail3
    });
    
    emitGlobalAlert({
      title: 'Emails ajoutés',
      message: 'Email(s) ajouté(s) avec succès ! Rechargez la page pour voir les changements.',
      type: 'success'
    });
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Erreur ajout email:', error);
    console.error('Détails:', error.message, error.code);
    emitGlobalAlert({
      title: 'Erreur ajout email',
      message: `Erreur lors de l'ajout de l'email:\n\n${error.message}`,
      type: 'error'
    });
    return false;
  }
}

// Exposer dans la console
if (typeof window !== 'undefined') {
  (window as any).__ajouterEmailSecondaire = ajouterEmailSecondaire;
  
  console.log('📧 Outil disponible:');
  console.log('  - __ajouterEmailSecondaire(chantierId, email2, email3?) : Ajouter emails secondaires');
  console.log('\nExemple:');
  console.log('  __ajouterEmailSecondaire("chantier-grohens-pitet", "support@javachrist.fr")');
}

