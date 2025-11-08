import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Supprimer TOUS les devis d'un chantier
 * ⚠️ ATTENTION : Opération irréversible !
 */
export async function supprimerTousLesDevis(chantierId: string): Promise<number> {
  console.log(`⚠️  SUPPRESSION DE TOUS LES DEVIS du chantier: ${chantierId}`);
  
  // Confirmation
  const confirmer = confirm(
    `⚠️ ATTENTION ⚠️\n\n` +
    `Vous allez SUPPRIMER TOUS LES DEVIS du chantier.\n` +
    `Cette opération est IRRÉVERSIBLE.\n\n` +
    `Assurez-vous d'avoir une sauvegarde !\n\n` +
    `Voulez-vous continuer ?`
  );
  
  if (!confirmer) {
    console.log('❌ Suppression annulée');
    return 0;
  }

  try {
    // Charger tous les devis
    const devisSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/devis`));
    console.log(`📦 ${devisSnapshot.size} devis trouvés`);

    if (devisSnapshot.size === 0) {
      console.log('✅ Aucun devis à supprimer');
      return 0;
    }

    // Afficher la liste
    console.log('\n📋 Devis qui seront supprimés:');
    devisSnapshot.docs.forEach((devisDoc, i) => {
      const data = devisDoc.data();
      console.log(`  ${i + 1}. ${data.numero} - ${data.prestationNom} (${data.montantTTC}€)`);
    });

    // Dernière confirmation
    const confirmerFinal = confirm(
      `Dernière confirmation:\n\n` +
      `${devisSnapshot.size} devis vont être SUPPRIMÉS DÉFINITIVEMENT.\n\n` +
      `Êtes-vous ABSOLUMENT SÛR ?`
    );

    if (!confirmerFinal) {
      console.log('❌ Suppression annulée');
      return 0;
    }

    // Supprimer tous les devis
    let count = 0;
    for (const devisDoc of devisSnapshot.docs) {
      await deleteDoc(doc(db, `chantiers/${chantierId}/devis`, devisDoc.id));
      console.log(`🗑️  Devis ${devisDoc.data().numero} supprimé`);
      count++;
    }

    console.log(`\n🎉 ${count} devis supprimés avec succès !`);
    console.log(`✅ Vous pouvez maintenant recréer vos devis proprement`);
    
    // Recharger la page après 2 secondes
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return count;

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return 0;
  }
}

/**
 * Supprimer les devis orphelins uniquement (sans entreprise valide)
 */
export async function supprimerDevisOrphelins(chantierId: string): Promise<number> {
  console.log(`🧹 NETTOYAGE - Suppression des devis orphelins pour: ${chantierId}`);

  try {
    // Charger les entreprises
    const entreprisesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/entreprises`));
    const entrepriseIds = new Set(entreprisesSnapshot.docs.map(doc => doc.id));
    console.log(`🏢 ${entrepriseIds.size} entreprises valides`);

    // Charger les devis
    const devisSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/devis`));
    console.log(`📦 ${devisSnapshot.size} devis au total`);

    // Trouver les orphelins
    const devisOrphelins = devisSnapshot.docs.filter(devisDoc => {
      const entrepriseId = devisDoc.data().entrepriseId;
      return !entrepriseIds.has(entrepriseId);
    });

    console.log(`🎯 ${devisOrphelins.length} devis orphelins trouvés`);

    if (devisOrphelins.length === 0) {
      console.log('✅ Aucun devis orphelin à supprimer');
      return 0;
    }

    // Afficher les orphelins
    console.log('\n📋 Devis orphelins qui seront supprimés:');
    devisOrphelins.forEach((devisDoc, i) => {
      const data = devisDoc.data();
      console.log(`  ${i + 1}. ${data.numero} - ${data.prestationNom} (entrepriseId: ${data.entrepriseId})`);
    });

    // Demander confirmation
    const confirmer = confirm(
      `${devisOrphelins.length} devis orphelins vont être supprimés.\n\n` +
      `Ces devis n'ont plus d'entreprise associée.\n\n` +
      `Continuer ?`
    );

    if (!confirmer) {
      console.log('❌ Suppression annulée');
      return 0;
    }

    // Supprimer
    let count = 0;
    for (const devisDoc of devisOrphelins) {
      await deleteDoc(doc(db, `chantiers/${chantierId}/devis`, devisDoc.id));
      console.log(`🗑️  Devis orphelin ${devisDoc.data().numero} supprimé`);
      count++;
    }

    console.log(`\n🎉 ${count} devis orphelins supprimés !`);
    
    // Recharger la page
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return count;

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return 0;
  }
}

// Exposer dans la console
if (typeof window !== 'undefined') {
  (window as any).__supprimerTousLesDevis = supprimerTousLesDevis;
  (window as any).__supprimerDevisOrphelins = supprimerDevisOrphelins;
  
  console.log('🧹 Outils de nettoyage disponibles:');
  console.log('  - __supprimerTousLesDevis(chantierId) : ⚠️  SUPPRIMER TOUS les devis');
  console.log('  - __supprimerDevisOrphelins(chantierId) : Supprimer uniquement les orphelins');
  console.log('\n⚠️  Assurez-vous d\'avoir une sauvegarde avant de supprimer !');
}

