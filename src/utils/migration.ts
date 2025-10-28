import {
  collection,
  doc,
  addDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Fonction helper pour convertir les dates en sécurité
function safeDate(dateValue: any, fallback: Date = new Date()): Date {
  if (!dateValue) {
    console.warn('Date manquante, utilisation fallback:', fallback);
    return fallback;
  }
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) return dateValue;

  try {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    } else {
      console.warn('Date invalide détectée:', dateValue, 'utilisation fallback:', fallback);
    }
  } catch (e) {
    console.warn('Erreur parsing date:', dateValue, 'utilisation fallback:', fallback);
  }
  return fallback;
}

// Script de migration vers la structure V2 cohérente
export class MigrationV2 {

  // 1. Migrer le chantier principal vers la nouvelle structure
  static async migrerChantierPrincipal(backupData: any): Promise<void> {
    try {
      console.log('🔄 MIGRATION V2 : Début de la migration du chantier principal');

      const chantierId = 'chantier-grohens-pitet';
      const batch = writeBatch(db);

      // 1. Créer les informations du chantier avec gestion sécurisée des dates
      const chantierInfoRef = doc(db, `chantiers/${chantierId}/info`, 'details');

      batch.set(chantierInfoRef, {
        nom: backupData.chantier.nom || '🏠 Rénovation ancien chemin du halage',
        description: backupData.chantier.description || 'Rénovation complète',
        clientNom: backupData.chantier.clientNom || 'Grohens Pitet',
        clientEmail: backupData.chantier.clientEmail || 'coralie.grohens@gmail.com',
        adresse: backupData.chantier.adresse || '27 ancien chemin du halage 31170 Tournefeuille',
        dateDebut: Timestamp.fromDate(safeDate(backupData.chantier.dateDebut, new Date('2025-01-10'))),
        dateFinPrevue: Timestamp.fromDate(safeDate(backupData.chantier.dateFinPrevue, new Date('2025-01-02'))),
        budget: backupData.chantier.budget || 35000,
        statut: backupData.chantier.statut || 'en-cours',
        professionalId: backupData.chantier.professionalId || 'professional-1',
        dateCreation: Timestamp.fromDate(safeDate(backupData.chantier.dateCreation, new Date('2024-01-01'))),
        dateModification: Timestamp.fromDate(new Date())
      });

      console.log('📝 Informations du chantier préparées');

      // 2. Migrer les entreprises directement avec addDoc
      console.log(`📊 Migration de ${backupData.entreprises.length} entreprises...`);

      // Committer d'abord les infos du chantier
      await batch.commit();
      console.log('✅ Informations du chantier sauvegardées');

      // Migrer les entreprises une par une avec addDoc
      for (const entreprise of backupData.entreprises) {
        // Nettoyer les données pour éviter les valeurs undefined
        const cleanData: any = {
          nom: entreprise.nom || 'Entreprise',
          siret: entreprise.siret || '',
          secteurActivite: entreprise.secteurActivite || 'sanitaire',
          contact: entreprise.contact || { nom: '', telephone: '', email: '' },
          adresse: entreprise.adresse || { rue: '', ville: '', codePostal: '' },
          notes: entreprise.notes || '',
          dateCreation: Timestamp.fromDate(safeDate(entreprise.dateCreation, new Date())),
          oldId: entreprise.id || ''
        };

        // Ajouter rib seulement s'il existe et n'est pas undefined/null
        if (entreprise.rib && typeof entreprise.rib === 'object' &&
          entreprise.rib.iban && entreprise.rib.bic) {
          cleanData.rib = {
            iban: entreprise.rib.iban || '',
            bic: entreprise.rib.bic || '',
            titulaire: entreprise.rib.titulaire || '',
            banque: entreprise.rib.banque || ''
          };
        }

        await addDoc(collection(db, `chantiers/${chantierId}/entreprises`), cleanData);
      }

      console.log('✅ Chantier principal et entreprises migrés');

      // 3. Migrer les devis (nouveau batch)
      await this.migrerDevis(chantierId, backupData.devis);

      // 4. Migrer les commandes
      await this.migrerCommandes(chantierId, backupData.commandes);

      // 5. Migrer les paiements
      await this.migrerPaiements(chantierId, backupData.paiements);

      // 6. Migrer les documents
      await this.migrerDocuments(chantierId, backupData.documents);

      // 7. Migrer les rendez-vous
      await this.migrerRendezVous(chantierId, backupData.rendezVous);

      console.log('🎉 MIGRATION TERMINÉE ! Chantier principal migré vers structure V2');

    } catch (error) {
      console.error('❌ Erreur migration chantier principal:', error);
      throw error;
    }
  }

  // Migrer les devis
  static async migrerDevis(chantierId: string, devis: any[]): Promise<void> {
    console.log(`📋 Migration de ${devis.length} devis...`);

    for (const d of devis) {
      const cleanData: any = {
        entrepriseId: d.entrepriseId || '',
        numero: d.numero || '',
        prestationNom: d.prestationNom || '',
        description: d.description || '',
        montantHT: d.montantHT || 0,
        montantTTC: d.montantTTC || 0,
        dateRemise: Timestamp.fromDate(safeDate(d.dateRemise)),
        dateValidite: Timestamp.fromDate(safeDate(d.dateValidite)),
        statut: d.statut || 'en-attente',
        oldId: d.id || ''
      };

      // Ajouter les champs optionnels seulement s'ils existent
      if (d.fichierUrl) cleanData.fichierUrl = d.fichierUrl;
      if (d.notes) cleanData.notes = d.notes;

      await addDoc(collection(db, `chantiers/${chantierId}/devis`), cleanData);
    }
    console.log('✅ Devis migrés');
  }

  // Migrer les commandes
  static async migrerCommandes(chantierId: string, commandes: any[]): Promise<void> {
    console.log(`🛒 Migration de ${commandes.length} commandes...`);

    const batch = writeBatch(db);
    for (const c of commandes) {
      const commandeRef = doc(collection(db, `chantiers/${chantierId}/commandes`));
      batch.set(commandeRef, {
        entrepriseId: c.entrepriseId,
        devisId: c.devisId,
        numero: c.numero,
        prestationNom: c.prestationNom,
        montantHT: c.montantHT,
        montantTTC: c.montantTTC,
        dateCommande: Timestamp.fromDate(new Date(c.dateCommande)),
        dateDebutPrevue: Timestamp.fromDate(new Date(c.dateDebutPrevue)),
        dateFinPrevue: Timestamp.fromDate(new Date(c.dateFinPrevue)),
        statut: c.statut,
        devisSigneUrl: c.devisSigneUrl,
        oldId: c.id
      });
    }
    await batch.commit();
    console.log('✅ Commandes migrées');
  }

  // Migrer les paiements
  static async migrerPaiements(chantierId: string, paiements: any[]): Promise<void> {
    console.log(`💰 Migration de ${paiements.length} paiements...`);

    const batch = writeBatch(db);
    for (const p of paiements) {
      const paiementRef = doc(collection(db, `chantiers/${chantierId}/paiements`));
      batch.set(paiementRef, {
        entrepriseId: p.entrepriseId,
        commandeId: p.commandeId,
        type: p.type,
        montant: p.montant,
        datePrevue: Timestamp.fromDate(new Date(p.datePrevue)),
        dateReglement: p.dateReglement ? Timestamp.fromDate(new Date(p.dateReglement)) : null,
        statut: p.statut,
        notes: p.notes,
        oldId: p.id
      });
    }
    await batch.commit();
    console.log('✅ Paiements migrés');
  }

  // Migrer les documents
  static async migrerDocuments(chantierId: string, documents: any[]): Promise<void> {
    console.log(`📄 Migration de ${documents.length} documents...`);

    const batch = writeBatch(db);
    for (const d of documents) {
      const documentRef = doc(collection(db, `chantiers/${chantierId}/documents`));
      batch.set(documentRef, {
        entrepriseId: d.entrepriseId,
        type: d.type,
        nom: d.nom,
        statut: d.statut,
        fichierUrl: d.fichierUrl,
        fichierNom: d.fichierNom,
        typeFichier: d.typeFichier,
        tailleFichier: d.tailleFichier,
        dateUpload: Timestamp.fromDate(new Date(d.dateUpload)),
        oldId: d.id
      });
    }
    await batch.commit();
    console.log('✅ Documents migrés');
  }

  // Migrer les rendez-vous
  static async migrerRendezVous(chantierId: string, rendezVous: any[]): Promise<void> {
    console.log(`📅 Migration de ${rendezVous.length} rendez-vous...`);

    let fallbackIndex = 0;
    for (const rv of rendezVous) {
      // Créer des dates par défaut étalées si les dates sont invalides
      const baseFallbackDate = new Date();
      baseFallbackDate.setDate(baseFallbackDate.getDate() + fallbackIndex); // Étaler sur plusieurs jours

      // Gestion intelligente des dates selon l'ancienne structure
      let dateDebut: Date;
      let dateFin: Date;

      if (rv.dateHeure) {
        // Ancienne structure avec dateHeure
        dateDebut = safeDate(rv.dateHeure, baseFallbackDate);
        dateFin = new Date(dateDebut.getTime() + 60 * 60 * 1000); // +1h par défaut
      } else {
        // Nouvelle structure avec dateDebut/dateFin
        dateDebut = safeDate(rv.dateDebut, baseFallbackDate);
        dateFin = safeDate(rv.dateFin, new Date(dateDebut.getTime() + 60 * 60 * 1000));
      }

      const cleanData: any = {
        titre: rv.titre || 'Rendez-vous',
        dateDebut: Timestamp.fromDate(dateDebut),
        dateFin: Timestamp.fromDate(dateFin),
        type: rv.type || 'autre',
        statut: rv.statut || 'planifie',
        oldId: rv.id || ''
      };

      // Ajouter les champs optionnels seulement s'ils existent
      if (rv.description && rv.description !== undefined && rv.description !== null) {
        cleanData.description = rv.description;
      }
      if (rv.entrepriseId && rv.entrepriseId !== undefined && rv.entrepriseId !== null) {
        cleanData.entrepriseId = rv.entrepriseId;
      }
      if (rv.notes && rv.notes !== undefined && rv.notes !== null) {
        cleanData.notes = rv.notes;
      }

      await addDoc(collection(db, `chantiers/${chantierId}/planning`), cleanData);
      fallbackIndex++;
    }
    console.log('✅ Rendez-vous migrés avec dates étalées');
  }

  // Nettoyer les anciennes collections
  static async nettoyerAnciennesCollections(): Promise<void> {
    console.log('🧹 Nettoyage des anciennes collections...');

    // Cette fonction supprimera les anciennes collections globales
    // après confirmation que la migration a réussi

    console.log('⚠️ Nettoyage manuel requis dans Firebase Console');
    console.log('Collections à supprimer après validation :');
    console.log('- entreprises (globale)');
    console.log('- users (à nettoyer)');
    console.log('- documents (globale)');
    console.log('- calendar (globale)');
  }
}
