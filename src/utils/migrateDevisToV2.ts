import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Migration des devis de l'ancienne structure vers V2
 * Ancienne: devis/ (collection globale)
 * Nouvelle: chantiers/{chantierId}/devis/ (sous-collection)
 */
export async function migrateDevisToV2(chantierId: string): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  try {
    console.log(`🔄 MIGRATION DEVIS vers V2 pour chantier: ${chantierId}`);

    // 1. Charger les anciens devis (collection globale)
    const oldDevisSnapshot = await getDocs(collection(db, 'devis'));
    console.log(`📦 ${oldDevisSnapshot.size} devis trouvés dans l'ancienne collection`);

    // 2. Filtrer ceux qui appartiennent à ce chantier
    const devisToMigrate = oldDevisSnapshot.docs.filter(doc => {
      const data = doc.data();
      // Vérifier si le devis appartient à une entreprise de ce chantier
      // (on vérifiera l'entrepriseId plus tard)
      return data.entrepriseId; // Tous les devis avec un entrepriseId
    });

    console.log(`🎯 ${devisToMigrate.length} devis à potentiellement migrer`);

    // 3. Charger les entreprises du chantier pour vérifier
    const entreprisesSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/entreprises`));
    const entrepriseIds = new Set(entreprisesSnapshot.docs.map(doc => doc.id));
    
    console.log(`🏢 ${entrepriseIds.size} entreprises dans le chantier`);

    // 4. Migrer chaque devis
    for (const devisDoc of devisToMigrate) {
      const data = devisDoc.data();
      
      // Vérifier si l'entreprise appartient bien à ce chantier
      if (!entrepriseIds.has(data.entrepriseId)) {
        continue; // Skip, pas pour ce chantier
      }

      try {
        // Vérifier si le devis existe déjà dans la nouvelle structure
        const newDevisSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/devis`));
        const exists = newDevisSnapshot.docs.some(doc => 
          doc.data().numero === data.numero && 
          doc.data().entrepriseId === data.entrepriseId
        );

        if (exists) {
          console.log(`⏭️  Devis ${data.numero} déjà migré`);
          continue;
        }

        // Créer dans la nouvelle structure
        const newDevisData = {
          entrepriseId: data.entrepriseId,
          numero: data.numero,
          prestationNom: data.prestationNom || 'Prestation',
          description: data.description || '',
          montantHT: data.montantHT || 0,
          montantTTC: data.montantTTC || 0,
          dateRemise: data.dateRemise ? (data.dateRemise.toDate ? data.dateRemise : Timestamp.fromDate(new Date(data.dateRemise))) : Timestamp.now(),
          dateValidite: data.dateValidite ? (data.dateValidite.toDate ? data.dateValidite : Timestamp.fromDate(new Date(data.dateValidite))) : Timestamp.now(),
          statut: data.statut || 'en-attente',
          fichierUrl: data.fichierUrl || null,
          dateValidation: data.dateValidation || null
        };

        await addDoc(collection(db, `chantiers/${chantierId}/devis`), newDevisData);
        console.log(`✅ Devis ${data.numero} migré vers V2`);
        success++;
      } catch (error) {
        console.error(`❌ Erreur migration devis ${data.numero}:`, error);
        errors++;
      }
    }

    console.log(`🎉 MIGRATION TERMINÉE: ${success} réussis, ${errors} erreurs`);
    return { success, errors };

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return { success: 0, errors: 1 };
  }
}

/**
 * Fonction pour migrer toutes les données d'un chantier
 */
export async function migrateAllToV2(chantierId: string) {
  console.log(`🚀 MIGRATION COMPLÈTE vers V2 pour chantier: ${chantierId}`);
  
  const results = await migrateDevisToV2(chantierId);
  
  console.log(`📊 RÉSULTAT MIGRATION:`);
  console.log(`  ✅ Devis migrés: ${results.success}`);
  console.log(`  ❌ Erreurs: ${results.errors}`);
  
  return results;
}

// Exposer dans la console pour debug
if (typeof window !== 'undefined') {
  (window as any).__migrateDevisToV2 = migrateDevisToV2;
  (window as any).__migrateAllToV2 = migrateAllToV2;
  
  console.log('🔧 Outils de migration disponibles:');
  console.log('  - __migrateDevisToV2(chantierId) : Migrer les devis');
  console.log('  - __migrateAllToV2(chantierId) : Migration complète');
}

