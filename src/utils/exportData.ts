import { entreprisesService, devisService, commandesService, paiementsService } from '../firebase/entreprises';
import { documentsService } from '../firebase/documents';
import { rendezVousService } from '../firebase/calendar';

// Script de sauvegarde complète des données du chantier principal
export async function exportChantierPrincipalData() {
  try {
    console.log('🔄 Début de l\'export des données du chantier principal...');

    // 1. Exporter toutes les entreprises
    const entreprises = await entreprisesService.getAll();
    console.log(`📊 ${entreprises.length} entreprises exportées`);

    // 2. Exporter tous les devis, commandes, paiements pour chaque entreprise
    let tousDevis: any[] = [];
    let toutesCommandes: any[] = [];
    let tousPaiements: any[] = [];
    let tousDocuments: any[] = [];

    for (const entreprise of entreprises) {
      if (entreprise.id) {
        try {
          const [devis, commandes, paiements, documents] = await Promise.all([
            devisService.getByEntreprise(entreprise.id),
            commandesService.getByEntreprise(entreprise.id),
            paiementsService.getByEntreprise(entreprise.id),
            documentsService.getByEntreprise(entreprise.id)
          ]);

          // Ajouter l'ID de l'entreprise à chaque élément pour la migration
          tousDevis.push(...devis.map(d => ({ ...d, entrepriseId: entreprise.id, entrepriseNom: entreprise.nom })));
          toutesCommandes.push(...commandes.map(c => ({ ...c, entrepriseId: entreprise.id, entrepriseNom: entreprise.nom })));
          tousPaiements.push(...paiements.map(p => ({ ...p, entrepriseId: entreprise.id, entrepriseNom: entreprise.nom })));
          tousDocuments.push(...documents.map(d => ({ ...d, entrepriseId: entreprise.id, entrepriseNom: entreprise.nom })));
        } catch (error) {
          console.warn(`Erreur export entreprise ${entreprise.nom}:`, error);
        }
      }
    }

    // 3. Exporter les rendez-vous
    const rendezVous = await rendezVousService.getAll();
    console.log(`📅 ${rendezVous.length} rendez-vous exportés`);

    // 4. Créer la structure d'export
    const exportData = {
      chantier: {
        id: 'chantier-principal',
        nom: '🏠 Rénovation ancien chemin du halage',
        description: 'Rénovation complète d\'une maison d\'habitation',
        clientNom: 'Grohens Pitet',
        clientEmail: 'coralie.grohens@gmail.com',
        adresse: '27 ancien chemin du halage 31170 Tournefeuille',
        dateDebut: new Date('2025-01-10'),
        dateFinPrevue: new Date('2025-01-02'),
        budget: 35000,
        statut: 'en-cours',
        dateExport: new Date()
      },
      entreprises: entreprises,
      devis: tousDevis,
      commandes: toutesCommandes,
      paiements: tousPaiements,
      documents: tousDocuments,
      rendezVous: rendezVous,
      stats: {
        entreprises: entreprises.length,
        devis: tousDevis.length,
        commandes: toutesCommandes.length,
        paiements: tousPaiements.length,
        documents: tousDocuments.length,
        rendezVous: rendezVous.length
      }
    };

    // 5. Sauvegarder en JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    // 6. Télécharger le fichier
    const a = document.createElement('a');
    a.href = url;
    a.download = `chantier-principal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Export terminé ! Fichier téléchargé.');
    console.log('📊 Statistiques:', exportData.stats);

    return exportData;

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
}

// Fonction pour afficher un résumé des données
export function afficherResumeChantier(data: any) {
  console.log('📋 RÉSUMÉ DU CHANTIER PRINCIPAL:');
  console.log('🏠 Nom:', data.chantier.nom);
  console.log('👤 Client:', data.chantier.clientNom, '(' + data.chantier.clientEmail + ')');
  console.log('💰 Budget:', data.chantier.budget?.toLocaleString() + ' €');
  console.log('📊 Statistiques:');
  console.log('  - Entreprises:', data.stats.entreprises);
  console.log('  - Devis:', data.stats.devis);
  console.log('  - Commandes:', data.stats.commandes);
  console.log('  - Paiements:', data.stats.paiements);
  console.log('  - Documents:', data.stats.documents);
  console.log('  - Rendez-vous:', data.stats.rendezVous);
}
