import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Outil pour afficher et corriger les associations devis <-> entreprises
 */
export async function diagnosticDevisEntreprises(chantierId: string) {
  console.log(`🔍 DIAGNOSTIC DEVIS-ENTREPRISES pour: ${chantierId}`);
  console.log('─'.repeat(80));

  try {
    // Charger les entreprises
    const entreprisesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/entreprises`));
    const entreprises = entreprisesSnapshot.docs.map(doc => ({
      id: doc.id,
      nom: doc.data().nom,
      secteur: doc.data().secteurActivite
    }));

    console.log(`\n🏢 ENTREPRISES ACTUELLES (${entreprises.length}):`);
    entreprises.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.nom} (${e.secteur}) - ID: ${e.id}`);
    });

    // Charger les devis
    const devisSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/devis`));
    const devis = devisSnapshot.docs.map(doc => ({
      id: doc.id,
      numero: doc.data().numero,
      prestationNom: doc.data().prestationNom,
      entrepriseId: doc.data().entrepriseId,
      montantTTC: doc.data().montantTTC
    }));

    console.log(`\n📄 DEVIS (${devis.length}):`);
    devis.forEach((d, i) => {
      const entrepriseTrouvee = entreprises.find(e => e.id === d.entrepriseId);
      const status = entrepriseTrouvee ? '✅ OK' : '❌ ORPHELIN';
      console.log(`  ${i + 1}. ${d.numero} - ${d.prestationNom} (${d.montantTTC}€) ${status}`);
      console.log(`     entrepriseId: "${d.entrepriseId}"`);
      if (entrepriseTrouvee) {
        console.log(`     → ${entrepriseTrouvee.nom}`);
      } else {
        console.log(`     → ⚠️ Entreprise introuvable`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`📊 RÉSUMÉ:`);
    const devisOrphelins = devis.filter(d => !entreprises.find(e => e.id === d.entrepriseId));
    console.log(`  - Devis OK: ${devis.length - devisOrphelins.length}`);
    console.log(`  - Devis orphelins: ${devisOrphelins.length}`);

    if (devisOrphelins.length > 0) {
      console.log(`\n💡 POUR CORRIGER: Utilisez __reassocierDevis(chantierId, devisId, nouvelEntrepriseId)`);
    }

    return { entreprises, devis, devisOrphelins };

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return null;
  }
}

/**
 * Réassocier un devis à une nouvelle entreprise
 */
export async function reassocierDevis(chantierId: string, devisId: string, nouvelEntrepriseId: string) {
  try {
    console.log(`🔄 Réassociation devis ${devisId} → entreprise ${nouvelEntrepriseId}`);
    
    const devisRef = doc(db, `chantiers/${chantierId}/devis`, devisId);
    await updateDoc(devisRef, {
      entrepriseId: nouvelEntrepriseId
    });
    
    console.log(`✅ Devis réassocié avec succès !`);
    return true;
  } catch (error) {
    console.error('❌ Erreur réassociation:', error);
    return false;
  }
}

/**
 * Réassocier plusieurs devis en masse par nom d'entreprise
 */
export async function reassocierDevisParNom(
  chantierId: string, 
  ancienNomEntreprise: string, 
  nouveauNomEntreprise: string
) {
  console.log(`🔄 Réassociation en masse: "${ancienNomEntreprise}" → "${nouveauNomEntreprise}"`);
  
  try {
    // Charger les entreprises
    const entreprisesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/entreprises`));
    const entrepriseCible = entreprisesSnapshot.docs.find(doc => 
      doc.data().nom.toLowerCase().includes(nouveauNomEntreprise.toLowerCase())
    );
    
    if (!entrepriseCible) {
      console.error(`❌ Entreprise "${nouveauNomEntreprise}" non trouvée`);
      return 0;
    }
    
    console.log(`✅ Entreprise trouvée: ${entrepriseCible.data().nom} (ID: ${entrepriseCible.id})`);
    
    // Charger les devis et demander confirmation
    const devisSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/devis`));
    const devisAReassocier = devisSnapshot.docs.filter(doc => {
      const data = doc.data();
      // Chercher dans le nom de prestation ou description
      return data.prestationNom?.toLowerCase().includes(ancienNomEntreprise.toLowerCase()) ||
             data.description?.toLowerCase().includes(ancienNomEntreprise.toLowerCase());
    });
    
    console.log(`🎯 ${devisAReassocier.length} devis trouvés à réassocier`);
    
    if (devisAReassocier.length === 0) {
      console.log('Aucun devis à réassocier');
      return 0;
    }
    
    // Afficher les devis qui seront modifiés
    console.log('\nDevis qui seront réassociés:');
    devisAReassocier.forEach(d => {
      console.log(`  - ${d.data().numero}: ${d.data().prestationNom}`);
    });
    
    const confirmer = confirm(`Voulez-vous réassocier ${devisAReassocier.length} devis à "${entrepriseCible.data().nom}" ?`);
    
    if (!confirmer) {
      console.log('❌ Annulé par l\'utilisateur');
      return 0;
    }
    
    // Réassocier
    let count = 0;
    for (const devisDoc of devisAReassocier) {
      await updateDoc(doc(db, `chantiers/${chantierId}/devis`, devisDoc.id), {
        entrepriseId: entrepriseCible.id
      });
      console.log(`✅ Devis ${devisDoc.data().numero} réassocié`);
      count++;
    }
    
    console.log(`🎉 ${count} devis réassociés avec succès !`);
    return count;
    
  } catch (error) {
    console.error('❌ Erreur réassociation en masse:', error);
    return 0;
  }
}

// Exposer dans la console
if (typeof window !== 'undefined') {
  (window as any).__diagnosticDevisEntreprises = diagnosticDevisEntreprises;
  (window as any).__reassocierDevis = reassocierDevis;
  (window as any).__reassocierDevisParNom = reassocierDevisParNom;
  
  console.log('🔧 Outils de diagnostic disponibles:');
  console.log('  - __diagnosticDevisEntreprises(chantierId) : Analyser les associations');
  console.log('  - __reassocierDevis(chantierId, devisId, entrepriseId) : Réassocier un devis');
  console.log('  - __reassocierDevisParNom(chantierId, ancienNom, nouveauNom) : Réassocier en masse');
  console.log('\nExemple: __diagnosticDevisEntreprises("chantier-grohens-pitet")');
}

