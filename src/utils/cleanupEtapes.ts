import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Supprimer TOUTES les étapes d'un chantier
 */
export async function supprimerToutesLesEtapes(chantierId: string): Promise<number> {
  console.log(`🗑️  SUPPRESSION DE TOUTES LES ÉTAPES du chantier: ${chantierId}`);
  
  // Confirmation
  const confirmer = confirm(
    `⚠️ Supprimer toutes les étapes du chantier ?\n\n` +
    `Cette opération est IRRÉVERSIBLE.\n\n` +
    `Continuer ?`
  );
  
  if (!confirmer) {
    console.log('❌ Suppression annulée');
    return 0;
  }

  try {
    // Charger toutes les étapes
    const etapesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/etapes`));
    console.log(`📦 ${etapesSnapshot.size} étapes trouvées`);

    if (etapesSnapshot.size === 0) {
      console.log('✅ Aucune étape à supprimer');
      return 0;
    }

    // Afficher la liste
    console.log('\n📋 Étapes qui seront supprimées:');
    etapesSnapshot.docs.forEach((etapeDoc, i) => {
      const data = etapeDoc.data();
      console.log(`  ${i + 1}. ${data.nom} (${data.statut})`);
    });

    // Supprimer toutes les étapes
    let count = 0;
    for (const etapeDoc of etapesSnapshot.docs) {
      await deleteDoc(doc(db, `chantiers/${chantierId}/etapes`, etapeDoc.id));
      console.log(`🗑️  Étape "${etapeDoc.data().nom}" supprimée`);
      count++;
    }

    console.log(`\n🎉 ${count} étapes supprimées avec succès !`);
    
    // Recharger la page après 1 seconde
    setTimeout(() => {
      console.log('🔄 Rechargement de la page...');
      window.location.reload();
    }, 1000);

    return count;

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return 0;
  }
}

/**
 * Supprimer uniquement les étapes par défaut (génériques)
 */
export async function supprimerEtapesParDefaut(chantierId: string): Promise<number> {
  console.log(`🧹 NETTOYAGE - Suppression des étapes par défaut pour: ${chantierId}`);

  const nomsParDefaut = [
    'Préparation du chantier',
    'Gros œuvre', 
    'Second œuvre',
    'Finitions'
  ];

  try {
    // Charger toutes les étapes
    const etapesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/etapes`));
    
    // Filtrer les étapes par défaut
    const etapesParDefaut = etapesSnapshot.docs.filter(etapeDoc => {
      const nom = etapeDoc.data().nom;
      return nomsParDefaut.includes(nom);
    });

    console.log(`🎯 ${etapesParDefaut.length} étapes par défaut trouvées`);

    if (etapesParDefaut.length === 0) {
      console.log('✅ Aucune étape par défaut à supprimer');
      return 0;
    }

    // Afficher
    console.log('\n📋 Étapes par défaut qui seront supprimées:');
    etapesParDefaut.forEach((etapeDoc, i) => {
      console.log(`  ${i + 1}. ${etapeDoc.data().nom}`);
    });

    // Confirmer
    const confirmer = confirm(
      `Supprimer ${etapesParDefaut.length} étapes par défaut ?\n\n` +
      `(Les étapes personnalisées seront conservées)`
    );

    if (!confirmer) {
      console.log('❌ Suppression annulée');
      return 0;
    }

    // Supprimer
    let count = 0;
    for (const etapeDoc of etapesParDefaut) {
      await deleteDoc(doc(db, `chantiers/${chantierId}/etapes`, etapeDoc.id));
      console.log(`🗑️  "${etapeDoc.data().nom}" supprimée`);
      count++;
    }

    console.log(`\n🎉 ${count} étapes par défaut supprimées !`);
    
    // Recharger
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return count;

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return 0;
  }
}

// Exposer dans la console
if (typeof window !== 'undefined') {
  (window as any).__supprimerToutesLesEtapes = supprimerToutesLesEtapes;
  (window as any).__supprimerEtapesParDefaut = supprimerEtapesParDefaut;
  
  console.log('🗑️  Outils de nettoyage étapes disponibles:');
  console.log('  - __supprimerToutesLesEtapes(chantierId) : ⚠️  Supprimer TOUTES les étapes');
  console.log('  - __supprimerEtapesParDefaut(chantierId) : Supprimer uniquement les 4 étapes par défaut');
  console.log('\nExemple: __supprimerEtapesParDefaut("chantier-grohens-pitet")');
}

