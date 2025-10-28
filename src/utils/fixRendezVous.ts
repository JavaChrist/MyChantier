import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Script pour corriger les liens entreprises dans les rendez-vous
export async function fixRendezVousEntreprises(chantierId: string) {
  try {
    console.log('🔄 Correction des liens entreprises dans les rendez-vous...');

    // 1. Récupérer toutes les entreprises du chantier
    const entreprisesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/entreprises`));
    const entreprises = entreprisesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      oldId: doc.data().oldId
    }));

    console.log(`📊 ${entreprises.length} entreprises trouvées`);

    // 2. Récupérer tous les rendez-vous
    const rendezVousSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/planning`));
    const rendezVous = rendezVousSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📅 ${rendezVous.length} rendez-vous trouvés`);

    // 3. Corriger les liens
    let correctionCount = 0;
    for (const rdv of rendezVous) {
      if (rdv.entrepriseId) {
        // Chercher l'entreprise correspondante par ancien ID
        const entreprise = entreprises.find(e => e.oldId === rdv.entrepriseId);

        if (entreprise && entreprise.id !== rdv.entrepriseId) {
          // Mettre à jour le rendez-vous avec le nouvel ID
          const rdvRef = doc(db, `chantiers/${chantierId}/planning`, rdv.id);
          await updateDoc(rdvRef, {
            entrepriseId: entreprise.id
          });

          console.log(`✅ Rendez-vous "${rdv.titre}" relié à "${entreprise.nom}"`);
          correctionCount++;
        }
      }
    }

    console.log(`🎉 Correction terminée ! ${correctionCount} rendez-vous corrigés`);
    return correctionCount;

  } catch (error) {
    console.error('❌ Erreur correction rendez-vous:', error);
    throw error;
  }
}

// Fonction pour afficher un mapping manuel si nécessaire
export function afficherMappingManuel(chantierId: string) {
  console.log(`
🔧 CORRECTION MANUELLE DES RENDEZ-VOUS

1. Allez dans Firebase Console
2. Collection: chantiers/${chantierId}/planning
3. Pour chaque rendez-vous, modifiez le champ "entrepriseId"
4. Remplacez l'ancien ID par le nouvel ID de l'entreprise

💡 Correspondances à faire :
- Regardez le champ "oldId" des entreprises
- Associez aux rendez-vous correspondants
  `);
}
