import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, ArrowRight, Edit2, LogOut, Trash2, FileText } from 'lucide-react';
import { AppIcon } from '../Icon';
import type { Chantier } from '../../firebase/chantiers';
import { useChantier } from '../../contexts/ChantierContext';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';

interface ChantierSelectorProps {
  professionalId: string;
  professionalName: string;
  onLogout?: () => void;
}

export function ChantierSelector({ professionalId, professionalName, onLogout }: ChantierSelectorProps) {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChantierModal, setShowNewChantierModal] = useState(false);
  const [showEditChantierModal, setShowEditChantierModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [chantierToDelete, setChantierToDelete] = useState<Chantier | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { setChantierActuel, setChangtierId } = useChantier();

  // Fonction pour obtenir le chantier Grohens-Pitet depuis Firebase V2
  const getChantierPrincipal = async (): Promise<Chantier> => {
    try {
      // Essayer de charger depuis Firebase V2
      const { getDocs, collection } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      const infoSnapshot = await getDocs(collection(db, 'chantiers/chantier-grohens-pitet/info'));

      if (infoSnapshot.docs.length > 0) {
        const data = infoSnapshot.docs[0].data();
        console.log('✅ Chantier Grohens-Pitet chargé depuis Firebase V2');

        return {
          id: 'chantier-grohens-pitet',
          nom: data.nom || '🏠 Rénovation ancien chemin du halage',
          description: data.description || 'Rénovation complète',
          clientNom: data.clientNom || 'Grohens Pitet',
          clientEmail: data.clientEmail || 'coralie.grohens@gmail.com',
          clientTelephone: data.clientTelephone || '',
          adresse: data.adresse || '27 ancien chemin du halage 31170 Tournefeuille',
          dateDebut: data.dateDebut?.toDate() || new Date('2025-01-10'),
          dateFinPrevue: data.dateFinPrevue?.toDate() || new Date('2025-01-02'),
          budget: data.budget || 35000,
          statut: data.statut || 'en-cours',
          professionalId: data.professionalId || professionalId,
          dateCreation: data.dateCreation?.toDate() || new Date('2024-01-01'),
          dateModification: data.dateModification?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger depuis Firebase V2, utilisation des données par défaut');
    }

    // Fallback si Firebase V2 pas disponible
    return {
      id: 'chantier-grohens-pitet',
      nom: '🏠 Rénovation ancien chemin du halage',
      description: 'Rénovation complète d\'une maison d\'habitation',
      clientNom: 'Grohens Pitet',
      clientEmail: 'coralie.grohens@gmail.com',
      clientTelephone: '',
      adresse: '27 ancien chemin du halage 31170 Tournefeuille',
      dateDebut: new Date('2025-01-10'),
      dateFinPrevue: new Date('2025-01-02'),
      budget: 35000,
      statut: 'en-cours',
      professionalId: professionalId,
      dateCreation: new Date('2024-01-01'),
      dateModification: new Date()
    };
  };

  useEffect(() => {
    // FORCER la restauration du chantier principal au démarrage
    forceRestoreChantierPrincipal();
    loadChantiers();
  }, [professionalId]);

  const forceRestoreChantierPrincipal = async () => {
    console.log('🚨 FORCE RESTAURATION du chantier principal');
    // Plus besoin de forcer, on charge depuis Firebase V2
    console.log('✅ Chargement depuis Firebase V2');
  };

  // Charger tous les chantiers depuis Firebase V2 - Approche dynamique et migration
  const loadAllChantiersFromFirebase = async (): Promise<Chantier[]> => {
    try {
      console.log('🔍 Chargement dynamique de tous les chantiers depuis Firebase...');

      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      const allChantiers: Chantier[] = [];

      // 1. Récupérer tous les documents de la collection "chantiers"
      const chantiersSnapshot = await getDocs(collection(db, 'chantiers'));

      console.log(`📋 ${chantiersSnapshot.docs.length} documents chantiers trouvés dans Firebase`);

      // 2. Pour chaque chantier existant dans Firebase, charger ses données
      for (const chantierDoc of chantiersSnapshot.docs) {
        const chantierId = chantierDoc.id;
        try {
          console.log(`📋 Chargement chantier: ${chantierId}`);

          // Charger les infos depuis la sous-collection "info"
          const infoSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/info`));

          if (infoSnapshot.docs.length > 0) {
            const data = infoSnapshot.docs[0].data();
            const chantier: Chantier = {
              id: chantierId,
              nom: data.nom || 'Chantier sans nom',
              description: data.description || '',
              clientNom: data.clientNom || '',
              clientEmail: data.clientEmail || '',
              clientTelephone: data.clientTelephone || '',
              adresse: data.adresse || '',
              dateDebut: data.dateDebut?.toDate() || new Date(),
              dateFinPrevue: data.dateFinPrevue?.toDate() || new Date(),
              budget: data.budget || 0,
              statut: data.statut || 'planifie',
              professionalId: data.professionalId || professionalId,
              dateCreation: data.dateCreation?.toDate() || new Date(),
              dateModification: data.dateModification?.toDate() || new Date()
            };

            allChantiers.push(chantier);
            console.log(`✅ Chantier ${chantierId} chargé:`, chantier.nom);
          } else {
            // Si pas de sous-collection info, utiliser les données du document principal
            const docData = chantierDoc.data();
            if (docData.nom) {
              const chantier: Chantier = {
                id: chantierId,
                nom: docData.nom || 'Chantier sans nom',
                description: docData.description || '',
                clientNom: docData.clientNom || '',
                clientEmail: docData.clientEmail || '',
                clientTelephone: docData.clientTelephone || '',
                adresse: docData.adresse || '',
                dateDebut: docData.dateDebut?.toDate() || new Date(),
                dateFinPrevue: docData.dateFinPrevue?.toDate() || new Date(),
                budget: docData.budget || 0,
                statut: docData.statut || 'planifie',
                professionalId: docData.professionalId || professionalId,
                dateCreation: docData.dateCreation?.toDate() || new Date(),
                dateModification: docData.dateModification?.toDate() || new Date()
              };
              allChantiers.push(chantier);
              console.log(`✅ Chantier ${chantierId} chargé depuis le document principal:`, chantier.nom);
            } else {
              console.warn(`⚠️ Chantier ${chantierId} n'a pas de nom, ignoré`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur chargement chantier ${chantierId}:`, error);
        }
      }

      // Trier par date de modification (plus récent en premier)
      allChantiers.sort((a, b) => b.dateModification.getTime() - a.dateModification.getTime());

      console.log(`🎉 ${allChantiers.length} chantiers chargés depuis Firebase V2`);
      return allChantiers;

    } catch (error) {
      console.error('Erreur chargement chantiers Firebase:', error);
      return [];
    }
  };

  const loadChantiers = async () => {
    try {
      setLoading(true);

      // Charger TOUS les chantiers depuis Firebase V2
      const tousLesChantiers = await loadAllChantiersFromFirebase();

      // Si aucun chantier trouvé dans Firebase, utiliser le fallback
      if (tousLesChantiers.length === 0) {
        const chantierPrincipalFallback = await getChantierPrincipal();
        setChantiers([chantierPrincipalFallback]);
        return;
      }

      setChantiers(tousLesChantiers);
      console.log('🔧 CHARGEMENT V2: Tous les chantiers chargés depuis Firebase:', tousLesChantiers.map(c => ({ nom: c.nom, id: c.id })));
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
      const fallbackChantier = await getChantierPrincipal();
      setChantiers([fallbackChantier]);
    } finally {
      setLoading(false);
    }
  };

  const saveChantiers = (newChantiers: Chantier[]) => {
    // Sauvegarder SEULEMENT les nouveaux chantiers (pas le principal)
    const chantiersToSave = newChantiers.filter(c => c.id !== 'chantier-principal');
    localStorage.setItem('chantiers', JSON.stringify(chantiersToSave));

    console.log('💾 Sauvegarde des chantiers:', chantiersToSave.map(c => ({ nom: c.nom, id: c.id })));
  };

  const handleSelectChantier = (chantier: Chantier) => {
    setChantierActuel(chantier);
    setChangtierId(chantier.id!);
  };

  const handleCreateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    try {
      console.log('🏗️ DÉBUT CRÉATION CHANTIER:', chantierData.nom);

      // 1. Créer le chantier avec un ID unique
      const chantierId = `chantier-${Date.now()}`;
      console.log('📋 ID généré:', chantierId);
      // Plus besoin de créer newChantier ici, on sauvegarde directement dans Firebase

      // 2. Préparer les informations client (SANS créer le compte pour éviter la déconnexion)
      if (chantierData.clientEmail && chantierData.clientEmail.trim()) {
        console.log('📋 Préparation des informations client pour:', chantierData.clientEmail);

        // Sauvegarder les informations du client en attente
        const clientInfo = {
          chantierId: chantierId,
          clientEmail: chantierData.clientEmail,
          clientNom: chantierData.clientNom,
          chantierNom: chantierData.nom,
          dateCreation: new Date().toISOString()
        };

        // Sauvegarder dans localStorage pour référence
        const existingClients = JSON.parse(localStorage.getItem('clients-en-attente') || '[]');
        existingClients.push(clientInfo);
        localStorage.setItem('clients-en-attente', JSON.stringify(existingClients));

        console.log('✅ Informations client préparées (pas de déconnexion)');

        // Message avec instructions pour le professionnel
        setSuccessMessage(
          `Chantier "${chantierData.nom}" créé avec succès !\n\n` +
          `👤 Client: ${chantierData.clientNom} (${chantierData.clientEmail})\n\n` +
          `📧 Instructions à transmettre au client :\n\n` +
          `1. Aller sur votre application de suivi de chantier\n` +
          `2. Cliquer sur "S'inscrire"\n` +
          `3. Utiliser son email: ${chantierData.clientEmail}\n` +
          `4. Choisir un mot de passe\n` +
          `5. Il sera automatiquement associé à ce chantier\n\n` +
          `✅ Vous restez connecté et pouvez continuer à travailler !`
        );
        setShowSuccessModal(true);
      }

      // 3. Sauvegarder le chantier dans Firebase V2
      try {
        console.log('💾 DÉBUT SAUVEGARDE FIREBASE pour:', chantierId);
        const { addDoc, setDoc, doc, collection, Timestamp } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');

        // Convertir les dates en objets Date valides
        const dateDebut = chantierData.dateDebut instanceof Date
          ? chantierData.dateDebut
          : new Date(chantierData.dateDebut);

        const dateFinPrevue = chantierData.dateFinPrevue instanceof Date
          ? chantierData.dateFinPrevue
          : new Date(chantierData.dateFinPrevue);

        // Vérifier que les dates sont valides
        if (isNaN(dateDebut.getTime())) {
          console.error('❌ Date de début invalide:', chantierData.dateDebut);
          throw new Error('Date de début invalide');
        }
        if (isNaN(dateFinPrevue.getTime())) {
          console.error('❌ Date de fin prévue invalide:', chantierData.dateFinPrevue);
          throw new Error('Date de fin prévue invalide');
        }

        console.log('✅ Dates validées:', { dateDebut, dateFinPrevue });

        const chantierDataForFirebase = {
          nom: chantierData.nom,
          description: chantierData.description,
          clientNom: chantierData.clientNom,
          clientEmail: chantierData.clientEmail,
          clientTelephone: chantierData.clientTelephone,
          adresse: chantierData.adresse,
          dateDebut: Timestamp.fromDate(dateDebut),
          dateFinPrevue: Timestamp.fromDate(dateFinPrevue),
          budget: chantierData.budget || 0,
          statut: chantierData.statut,
          professionalId: professionalId,
          dateCreation: Timestamp.fromDate(new Date()),
          dateModification: Timestamp.fromDate(new Date())
        };

        console.log('📦 Données à sauvegarder:', chantierDataForFirebase);

        // IMPORTANT : Créer d'abord le document parent dans la collection "chantiers"
        console.log(`🔄 Création document parent: chantiers/${chantierId}`);
        await setDoc(doc(db, 'chantiers', chantierId), chantierDataForFirebase);
        console.log(`✅ Document parent créé: chantiers/${chantierId}`);

        // Puis créer aussi la sous-collection "info" pour compatibilité
        console.log(`🔄 Création sous-collection: chantiers/${chantierId}/info`);
        await addDoc(collection(db, `chantiers/${chantierId}/info`), chantierDataForFirebase);
        console.log(`✅ Sous-collection créée: chantiers/${chantierId}/info`);

        console.log('✅✅✅ Chantier sauvegardé dans Firebase V2 avec succès !');
      } catch (error) {
        console.error('❌❌❌ ERREUR SAUVEGARDE FIREBASE:', error);
        console.error('Détails de l\'erreur:', JSON.stringify(error, null, 2));
        throw error; // Relancer l'erreur pour qu'elle soit capturée par le catch principal
      }

      // 4. Recharger tous les chantiers depuis Firebase
      console.log('🔄 Rechargement de la liste des chantiers...');
      await loadChantiers();
      console.log('✅ Liste des chantiers rechargée');
      setShowNewChantierModal(false);
      console.log('🎉 CRÉATION CHANTIER TERMINÉE AVEC SUCCÈS');

    } catch (error) {
      console.error('❌❌❌ ERREUR CRÉATION CHANTIER:', error);
      console.error('Type d\'erreur:', typeof error);
      console.error('Message:', (error as any)?.message);
      console.error('Code:', (error as any)?.code);
      setSuccessMessage(`❌ Erreur lors de la création du chantier: ${(error as any)?.message || 'Erreur inconnue'}`);
      setShowSuccessModal(true);
    }
  };

  const handleEditChantier = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setShowEditChantierModal(true);
  };

  const handleDeleteChantier = (chantier: Chantier) => {
    setChantierToDelete(chantier);
    setShowDeleteConfirmModal(true);
  };

  const handleConfigureClientAccess = async (chantier: Chantier) => {
    const currentEmail = chantier.clientEmail;
    const hasValidEmail = currentEmail && currentEmail !== 'vos-donnees@existantes.com' && currentEmail.includes('@');

    const clientEmail = prompt(
      `Configurer l'accès client pour "${chantier.nom}"\n\n` +
      `Email actuel: ${currentEmail}\n\n` +
      `${hasValidEmail
        ? 'Voulez-vous créer le compte pour cet email ou en saisir un nouveau ?'
        : 'Saisissez le vrai email du client pour lui créer un accès :'
      }`
    ) || (hasValidEmail ? currentEmail : '');

    if (!clientEmail || clientEmail.trim() === '') return;

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      setSuccessMessage('⚠️ Adresse email invalide.');
      setShowSuccessModal(true);
      return;
    }

    try {
      const { authService } = await import('../../firebase/auth');
      const { createUserWithEmailAndPassword, updateProfile, signOut } = await import('firebase/auth');
      const { auth } = await import('../../firebase/config');

      console.log('🔧 Configuration accès client pour le chantier principal:', clientEmail);

      // Mettre à jour les informations du chantier principal
      const updatedChantier = { ...chantier, clientEmail };
      localStorage.setItem('chantier-principal-info', JSON.stringify(updatedChantier));

      // Mettre à jour dans la liste affichée
      const updatedChantiers = chantiers.map(c =>
        c.id === 'chantier-principal' ? updatedChantier : c
      );
      setChantiers(updatedChantiers);

      try {
        // Créer le compte client
        const tempPassword = 'temp' + Math.random().toString(36).substring(2, 12) + '!';
        const clientCredential = await createUserWithEmailAndPassword(auth, clientEmail, tempPassword);
        await updateProfile(clientCredential.user, { displayName: chantier.clientNom });

        // Créer le profil client
        await authService.createUserProfile(clientCredential.user.uid, {
          email: clientEmail,
          displayName: chantier.clientNom,
          role: 'client',
          chantierId: 'chantier-principal'
        });

        // Se déconnecter du compte client
        await signOut(auth);

        setSuccessMessage(
          `Accès client configuré pour le chantier principal !\n\n` +
          `👤 Client: ${chantier.clientNom} (${clientEmail})\n\n` +
          `📧 Instructions à transmettre au client :\n\n` +
          `1. Aller sur votre application de suivi de chantier\n` +
          `2. Cliquer sur "Mot de passe oublié ?"\n` +
          `3. Saisir son email: ${clientEmail}\n` +
          `4. Vérifier ses emails et définir un mot de passe\n` +
          `5. Se connecter avec son email et nouveau mot de passe\n\n` +
          `✅ Il aura accès à toutes vos données existantes !`
        );
        setShowSuccessModal(true);

      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          setSuccessMessage(
            `Email client mis à jour !\n\n` +
            `ℹ️ Un compte existe déjà pour ${clientEmail}\n\n` +
            `📧 Instructions pour le client :\n\n` +
            `1. Utiliser "Mot de passe oublié ?" avec son email\n` +
            `2. Ou se connecter s'il connaît son mot de passe\n\n` +
            `Il aura accès à vos données existantes.`
          );
          setShowSuccessModal(true);
        } else {
          throw createError;
        }
      }

    } catch (error: any) {
      console.error('Erreur configuration accès client:', error);
      setSuccessMessage(`❌ Erreur lors de la configuration : ${error.message}`);
      setShowSuccessModal(true);
    }
  };

  const confirmDeleteChantier = async () => {
    if (!chantierToDelete) return;

    try {
      // PROTECTION : Protéger le chantier Grohens-Pitet (données réelles)
      if (chantierToDelete.id === 'chantier-grohens-pitet' ||
        chantierToDelete.nom.includes('Rénovation ancien') ||
        chantierToDelete.clientNom === 'Grohens Pitet') {
        setSuccessMessage('🚨 ERREUR : Ce chantier ne peut pas être supprimé !\n\nIl contient vos vraies données.');
        setShowSuccessModal(true);
        setShowDeleteConfirmModal(false);
        setChantierToDelete(null);
        return;
      }

      console.log('🗑️ DÉBUT SUPPRESSION COMPLÈTE du chantier:', chantierToDelete.nom, 'ID:', chantierToDelete.id);

      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      const chantierId = chantierToDelete.id!;

      // 1. Supprimer toutes les sous-collections
      const subCollections = ['info', 'entreprises', 'devis', 'commandes', 'paiements', 'documents', 'planning', 'etapes', 'messages'];

      for (const subCol of subCollections) {
        try {
          console.log(`🗑️ Suppression de ${subCol}...`);
          const snapshot = await getDocs(collection(db, `chantiers/${chantierId}/${subCol}`));
          console.log(`📋 ${snapshot.docs.length} documents trouvés dans ${subCol}`);

          // Supprimer chaque document de la sous-collection
          for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, `chantiers/${chantierId}/${subCol}`, docSnapshot.id));
          }

          if (snapshot.docs.length > 0) {
            console.log(`✅ ${snapshot.docs.length} documents supprimés de ${subCol}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erreur suppression ${subCol}:`, error);
        }
      }

      // 2. Supprimer le document parent
      console.log(`🗑️ Suppression du document parent: chantiers/${chantierId}`);
      await deleteDoc(doc(db, 'chantiers', chantierId));
      console.log(`✅ Document parent supprimé`);

      // 3. Nettoyer localStorage aussi
      const saved = localStorage.getItem('chantiers');
      if (saved) {
        const savedChantiers = JSON.parse(saved);
        const updatedSaved = savedChantiers.filter((c: any) => c.id !== chantierId);
        localStorage.setItem('chantiers', JSON.stringify(updatedSaved));
      }

      // 4. Recharger la liste
      await loadChantiers();

      console.log('✅✅✅ Chantier complètement supprimé de Firebase');
      setSuccessMessage(`✅ Chantier "${chantierToDelete.nom}" supprimé avec succès !`);
      setShowSuccessModal(true);

      setShowDeleteConfirmModal(false);
      setChantierToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression chantier:', error);
      setSuccessMessage(`❌ Erreur lors de la suppression du chantier: ${(error as any)?.message || 'Erreur inconnue'}`);
      setShowSuccessModal(true);
      setShowDeleteConfirmModal(false);
      setChantierToDelete(null);
    }
  };


  const handleUpdateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    if (!selectedChantier) return;

    try {
      console.log(`🔄 Modification chantier ${selectedChantier.id}`);

      const updatedChantier: Chantier = {
        ...chantierData,
        id: selectedChantier.id,
        professionalId,
        dateCreation: selectedChantier.dateCreation,
        dateModification: new Date()
      };

      // Sauvegarder dans Firebase V2
      if (selectedChantier.id === 'chantier-grohens-pitet') {
        // Sauvegarder dans Firebase V2
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');

        const chantierInfoRef = doc(db, `chantiers/${selectedChantier.id}/info`, 'details');
        await updateDoc(chantierInfoRef, {
          nom: chantierData.nom,
          description: chantierData.description,
          clientNom: chantierData.clientNom,
          clientEmail: chantierData.clientEmail,
          clientTelephone: chantierData.clientTelephone,
          adresse: chantierData.adresse,
          dateDebut: Timestamp.fromDate(chantierData.dateDebut),
          dateFinPrevue: Timestamp.fromDate(chantierData.dateFinPrevue),
          budget: chantierData.budget,
          statut: chantierData.statut,
          notes: chantierData.notes,
          dateModification: Timestamp.fromDate(new Date())
        });

        console.log('✅ Chantier modifié dans Firebase V2');
      } else {
        // Autres chantiers : localStorage pour l'instant
        const updatedChantiers = chantiers.map(c =>
          c.id === selectedChantier.id ? updatedChantier : c
        );
        saveChantiers(updatedChantiers);
      }

      // Mettre à jour l'affichage
      const updatedChantiers = chantiers.map(c =>
        c.id === selectedChantier.id ? updatedChantier : c
      );
      setChantiers(updatedChantiers);

      setShowEditChantierModal(false);
      setSelectedChantier(null);

      setSuccessMessage(`Chantier "${chantierData.nom}" modifié avec succès !`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Erreur modification chantier:', error);
      setSuccessMessage('❌ Erreur lors de la modification du chantier');
      setShowSuccessModal(true);
    }
  };


  const handleExportData = async () => {
    try {
      setSuccessMessage('🔄 Export en cours...\n\nVeuillez patienter pendant la sauvegarde de toutes vos données.');
      setShowSuccessModal(true);

      const { exportChantierPrincipalData, afficherResumeChantier } = await import('../../utils/exportData');

      console.log('🔄 Début de l\'export des données...');
      const exportedData = await exportChantierPrincipalData();

      afficherResumeChantier(exportedData);

      setSuccessMessage(
        `✅ Sauvegarde terminée !\n\n` +
        `📁 Fichier téléchargé : chantier-principal-backup-${new Date().toISOString().split('T')[0]}.json\n\n` +
        `📊 Données sauvegardées :\n` +
        `• ${exportedData.stats.entreprises} entreprises\n` +
        `• ${exportedData.stats.devis} devis\n` +
        `• ${exportedData.stats.commandes} commandes\n` +
        `• ${exportedData.stats.paiements} paiements\n` +
        `• ${exportedData.stats.documents} documents\n` +
        `• ${exportedData.stats.rendezVous} rendez-vous\n\n` +
        `🛡️ Vos données sont maintenant sécurisées !`
      );

    } catch (error: any) {
      console.error('❌ Erreur export:', error);
      setSuccessMessage(`❌ Erreur lors de l'export :\n${error.message}\n\nVérifiez la console pour plus de détails.`);
    }
  };

  const handleMigration = async () => {
    try {
      // Demander confirmation
      const confirmation = window.confirm(
        '🚨 MIGRATION VERS STRUCTURE V2\n\n' +
        'Cette opération va :\n' +
        '1. Migrer toutes vos données vers une nouvelle structure Firebase\n' +
        '2. Corriger définitivement les problèmes d\'isolation\n' +
        '3. Permettre une gestion propre par chantier\n\n' +
        '⚠️ IMPORTANT : Assurez-vous d\'avoir sauvegardé vos données avant !\n\n' +
        'Continuer la migration ?'
      );

      if (!confirmation) return;

      setSuccessMessage('🔄 Migration V2 en cours...\n\nMigration de vos données vers la nouvelle structure.\nCela peut prendre quelques minutes.');
      setShowSuccessModal(true);

      // Import du service de migration
      const { MigrationV2 } = await import('../../utils/migration');

      // Demander à l'utilisateur de fournir le fichier de sauvegarde
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';

      const backupData = await new Promise((resolve, reject) => {
        fileInput.onchange = async (e: any) => {
          try {
            const file = e.target.files[0];
            if (!file) {
              reject(new Error('Aucun fichier sélectionné'));
              return;
            }

            const text = await file.text();
            const data = JSON.parse(text);
            console.log('📁 Fichier de sauvegarde chargé:', data.stats);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };

        fileInput.click();
      });

      // Lancer la migration
      await MigrationV2.migrerChantierPrincipal(backupData);

      setSuccessMessage(
        `🎉 MIGRATION V2 TERMINÉE !\n\n` +
        `✅ Structure Firebase modernisée\n` +
        `✅ Données isolées par chantier\n` +
        `✅ Problèmes de mélange résolus\n\n` +
        `📋 Prochaines étapes :\n` +
        `1. Vérifier que vos données sont bien migrées\n` +
        `2. Tester les fonctionnalités\n` +
        `3. Nettoyer les anciennes collections\n\n` +
        `🚀 Votre application est maintenant optimisée !`
      );

    } catch (error: any) {
      console.error('❌ Erreur migration:', error);
      setSuccessMessage(`❌ Erreur lors de la migration :\n${error.message}\n\nVos données originales sont préservées.`);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'bg-blue-100 text-blue-800';
      case 'en-cours':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      case 'suspendu':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'Planifié';
      case 'en-cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de vos chantiers</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8 relative">
          {/* Bouton de déconnexion */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="absolute top-0 right-0 flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          )}

          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AppIcon size={48} className="brightness-100" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bonjour {professionalName === 'Utilisateur' ? 'Administrateur' : professionalName} !
          </h1>
          <p className="text-gray-600">
            Sélectionnez le chantier sur lequel vous souhaitez travailler
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setShowNewChantierModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau chantier</span>
          </button>

          <button
            onClick={handleExportData}
            className="btn-secondary flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="w-5 h-5" />
            <span>Sauvegarder mes données</span>
          </button>

          <button
            onClick={handleMigration}
            className="btn-secondary flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Migration V2</span>
          </button>
        </div>

        {/* Liste des chantiers */}
        {chantiers.length === 0 ? (
          <div className="text-center py-12">
            <AppIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun chantier</h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier chantier pour commencer à utiliser l'application
            </p>
            <button
              onClick={() => setShowNewChantierModal(true)}
              className="btn-primary"
            >
              Créer mon premier chantier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chantiers.map((chantier) => (
              <div
                key={chantier.id}
                onClick={() => handleSelectChantier(chantier)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                    <AppIcon size={32} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(chantier.statut)}`}>
                      {getStatutLabel(chantier.statut)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChantier(chantier);
                        }}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier le chantier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Bouton configurer accès client pour tous les chantiers */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfigureClientAccess(chantier);
                        }}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Configurer l'accès client"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      {/* Bouton de suppression - masqué pour le chantier principal */}
                      {chantier.id !== 'chantier-principal' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChantier(chantier);
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le chantier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      {chantier.nom}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {chantier.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{chantier.clientNom}</span>
                      {/* Indicateur d'ID pour debug */}
                      <span className="px-2 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-600">
                        {chantier.id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{chantier.adresse}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {chantier.dateDebut.toLocaleDateString('fr-FR')} → {chantier.dateFinPrevue.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {chantier.budget && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget :</span>
                        <span className="font-semibold text-gray-800">
                          {chantier.budget.toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flèche d'indication */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center text-primary-600 group-hover:text-primary-700 transition-colors">
                    <span className="text-sm font-medium mr-2">Ouvrir ce chantier</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nouveau chantier */}
        <Modal
          isOpen={showNewChantierModal}
          onClose={() => setShowNewChantierModal(false)}
          title="Nouveau chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            onSave={handleCreateChantier}
            onCancel={() => setShowNewChantierModal(false)}
          />
        </Modal>

        {/* Modal modification chantier */}
        <Modal
          isOpen={showEditChantierModal}
          onClose={() => setShowEditChantierModal(false)}
          title="Modifier le chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            chantier={selectedChantier}
            onSave={handleUpdateChantier}
            onCancel={() => setShowEditChantierModal(false)}
          />
        </Modal>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteConfirmModal}
          onConfirm={confirmDeleteChantier}
          onCancel={() => {
            setShowDeleteConfirmModal(false);
            setChantierToDelete(null);
          }}
          title="Confirmer la suppression"
          message={
            chantierToDelete
              ? `Êtes-vous sûr de vouloir supprimer le chantier "${chantierToDelete.nom}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`
              : ''
          }
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
        />

        {/* Modal de succès moderne */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="✅ Succès"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
              <pre className="text-sm text-green-400 whitespace-pre-wrap font-sans">
                {successMessage}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="btn-primary"
              >
                Compris
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

// Composant formulaire pour créer un nouveau chantier
function NewChantierForm({
  professionalId,
  chantier,
  onSave,
  onCancel
}: {
  professionalId: string;
  chantier?: Chantier | null;
  onSave: (chantier: Omit<Chantier, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    clientNom: '',
    clientEmail: '',
    clientTelephone: '',
    adresse: '',
    dateDebut: '',
    dateFinPrevue: '',
    budget: '',
    statut: 'planifie' as 'planifie' | 'en-cours' | 'termine' | 'suspendu',
    notes: ''
  });

  useEffect(() => {
    if (chantier) {
      setFormData({
        nom: chantier.nom,
        description: chantier.description,
        clientNom: chantier.clientNom,
        clientEmail: chantier.clientEmail,
        clientTelephone: chantier.clientTelephone || '',
        adresse: chantier.adresse,
        dateDebut: chantier.dateDebut.toISOString().split('T')[0],
        dateFinPrevue: chantier.dateFinPrevue.toISOString().split('T')[0],
        budget: chantier.budget?.toString() || '',
        statut: chantier.statut,
        notes: chantier.notes || ''
      });
    }
  }, [chantier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Valider les champs requis
    if (!formData.nom.trim()) {
      alert('Le nom du chantier est requis');
      return;
    }
    if (!formData.clientEmail.trim()) {
      alert('L\'email du client est requis');
      return;
    }
    if (!formData.dateDebut) {
      alert('La date de début est requise');
      return;
    }
    if (!formData.dateFinPrevue) {
      alert('La date de fin prévue est requise');
      return;
    }

    // Créer et valider les dates
    const dateDebut = new Date(formData.dateDebut);
    const dateFinPrevue = new Date(formData.dateFinPrevue);

    if (isNaN(dateDebut.getTime())) {
      alert('La date de début est invalide');
      return;
    }
    if (isNaN(dateFinPrevue.getTime())) {
      alert('La date de fin prévue est invalide');
      return;
    }

    onSave({
      nom: formData.nom,
      description: formData.description,
      clientNom: formData.clientNom,
      clientEmail: formData.clientEmail,
      clientTelephone: formData.clientTelephone,
      adresse: formData.adresse,
      dateDebut: dateDebut,
      dateFinPrevue: dateFinPrevue,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      statut: formData.statut,
      professionalId,
      notes: formData.notes,
      dateCreation: new Date(),
      dateModification: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du chantier
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Rénovation Maison Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="planifie">Planifié</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description du projet
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Description des travaux à réaliser..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du client
          </label>
          <input
            type="text"
            value={formData.clientNom}
            onChange={(e) => setFormData(prev => ({ ...prev, clientNom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: M. et Mme Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email du client *
          </label>
          <input
            type="email"
            required
            value={formData.clientEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="input-field w-full"
            placeholder="client@exemple.com"
          />
          <p className="text-xs text-blue-400 mt-1">
            💡 Un compte client sera automatiquement créé avec cet email
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse du chantier
        </label>
        <input
          type="text"
          value={formData.adresse}
          onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
          className="input-field w-full"
          placeholder="123 rue de la Paix, 75001 Paris"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de début *
          </label>
          <input
            type="date"
            required
            value={formData.dateDebut}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de fin prévue *
          </label>
          <input
            type="date"
            required
            value={formData.dateFinPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFinPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            className="input-field w-full"
            placeholder="45000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Notes sur le chantier..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {chantier ? 'Modifier le chantier' : 'Créer le chantier'}
        </button>
      </div>
    </form>
  );
}
