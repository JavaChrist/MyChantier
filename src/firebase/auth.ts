import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './config';

// Fonction pour trouver des chantiers par email (principal, secondaire ou tertiaire)
async function trouverChantiersParEmail(email: string): Promise<string[]> {
  try {
    console.log(`🔎 Recherche chantier pour email: "${email}"`);
    const chantiersSnapshot = await getDocs(collection(db, 'chantiers'));
    console.log(`📦 ${chantiersSnapshot.size} chantiers trouvés`);

    const chantierIds: string[] = [];
    for (const chantierDoc of chantiersSnapshot.docs) {
      const data = chantierDoc.data();
      const emailLower = email.toLowerCase().trim();

      console.log(`  - Chantier "${data.nom}":`, {
        clientEmail: data.clientEmail,
        clientEmail2: data.clientEmail2,
        clientEmail3: data.clientEmail3
      });

      if (
        data.clientEmail?.toLowerCase().trim() === emailLower ||
        data.clientEmail2?.toLowerCase().trim() === emailLower ||
        data.clientEmail3?.toLowerCase().trim() === emailLower
      ) {
        console.log(`✅ Chantier "${data.nom}" trouvé pour email: ${email}`);
        chantierIds.push(chantierDoc.id);
      }
    }

    if (chantierIds.length === 0) {
      console.log(`❌ Aucun chantier trouvé pour email: ${email}`);
    } else {
      console.log(`✅ ${chantierIds.length} chantier(s) trouvé(s) pour email: ${email}`);
    }
    return chantierIds;
  } catch (error) {
    console.error('Erreur recherche chantier par email:', error);
    return [];
  }
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'professional' | 'client';
  chantierId?: string; // Pour les clients : ID du chantier auquel ils ont accès
  chantierIds?: string[]; // Pour les clients : liste des chantiers accessibles
  dateCreation: Date;
  derniereConnexion: Date;
}

// Service d'authentification
export const authService = {
  // Connexion avec email/mot de passe
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Mettre à jour la dernière connexion
      await authService.updateLastLogin(userCredential.user.uid);

      return userCredential.user;
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      throw new Error(authService.getErrorMessage(error.code));
    }
  },

  // Inscription avec email/mot de passe
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Mettre à jour le profil
      await updateProfile(userCredential.user, { displayName });

      // Détecter si c'est un email client (chercher dans les chantiers)
      console.log('🔍 Vérification si email client:', email);
      const chantiersTrouves = await trouverChantiersParEmail(email);

      let role: 'professional' | 'client' = 'professional';
      let chantierId: string | undefined = undefined;
      let chantierIds: string[] | undefined = undefined;

      if (chantiersTrouves.length > 0) {
        // C'est un email de client (principal, secondaire ou tertiaire)
        console.log(`✅ Email trouvé dans ${chantiersTrouves.length} chantier(s)`);
        role = 'client';
        chantierId = chantiersTrouves[0];
        chantierIds = chantiersTrouves;
      } else {
        // Email non trouvé dans les chantiers → Professionnel
        console.log('ℹ️ Email non trouvé dans les chantiers → Professionnel');
      }

      // Créer le profil utilisateur dans Firestore
      await authService.createUserProfile(userCredential.user.uid, {
        email,
        displayName,
        role,
        chantierId,
        chantierIds
      });

      console.log(`✅ Compte créé: ${email} → ${role}${chantierId ? ` (chantier: ${chantierId})` : ''}`);

      return userCredential.user;
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      throw new Error(authService.getErrorMessage(error.code));
    }
  },

  // Déconnexion
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  },

  // Réinitialisation du mot de passe
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Email de réinitialisation envoyé');
    } catch (error: any) {
      console.error('Erreur réinitialisation:', error);
      throw new Error(authService.getErrorMessage(error.code));
    }
  },

  // Créer le profil utilisateur dans Firestore
  async createUserProfile(
    uid: string,
    userData: {
      email: string;
      displayName: string;
      role: 'professional' | 'client';
      chantierId?: string;
      chantierIds?: string[];
    }
  ): Promise<void> {
    try {
      // Ne pas inclure chantierId s'il est undefined (Firebase n'accepte pas undefined)
      const userProfile: any = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        dateCreation: new Date(),
        derniereConnexion: new Date()
      };

      // Ajouter chantierId seulement s'il existe
      if (userData.chantierId) {
        userProfile.chantierId = userData.chantierId;
      }
      if (userData.chantierIds && userData.chantierIds.length > 0) {
        userProfile.chantierIds = userData.chantierIds;
      }

      await setDoc(doc(db, 'users', uid), userProfile);
      console.log('✅ Profil utilisateur créé:', { email: userData.email, role: userData.role, chantierId: userData.chantierId });
    } catch (error) {
      console.error('Erreur création profil:', error);
      throw error;
    }
  },

  // Récupérer le profil utilisateur
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 Recherche profil pour UID:', uid);
      const docSnap = await getDoc(doc(db, 'users', uid));

      if (docSnap.exists()) {
        console.log('✅ Profil trouvé dans Firestore');
        const data = docSnap.data();
        console.log('📋 Données profil:', { email: data.email, role: data.role, chantierId: data.chantierId });

        // Gestion sécurisée des dates
        let dateCreation = new Date();
        let derniereConnexion = new Date();

        try {
          if (data.dateCreation && data.dateCreation !== null && data.dateCreation !== undefined) {
            if (typeof data.dateCreation === 'object' && data.dateCreation.toDate && typeof data.dateCreation.toDate === 'function') {
              dateCreation = data.dateCreation.toDate();
            } else if (data.dateCreation instanceof Date) {
              dateCreation = data.dateCreation;
            } else if (typeof data.dateCreation === 'string' || typeof data.dateCreation === 'number') {
              dateCreation = new Date(data.dateCreation);
            }
          }
        } catch (e) {
          console.warn('Erreur conversion dateCreation:', e);
          dateCreation = new Date();
        }

        try {
          if (data.derniereConnexion && data.derniereConnexion !== null && data.derniereConnexion !== undefined) {
            if (typeof data.derniereConnexion === 'object' && data.derniereConnexion.toDate && typeof data.derniereConnexion.toDate === 'function') {
              derniereConnexion = data.derniereConnexion.toDate();
            } else if (data.derniereConnexion instanceof Date) {
              derniereConnexion = data.derniereConnexion;
            } else if (typeof data.derniereConnexion === 'string' || typeof data.derniereConnexion === 'number') {
              derniereConnexion = new Date(data.derniereConnexion);
            }
          }
        } catch (e) {
          console.warn('Erreur conversion derniereConnexion:', e);
          derniereConnexion = new Date();
        }

        // Déterminer le rôle intelligemment si non défini
        let userRole = data.role;
        const user = auth.currentUser;

        if (!userRole) {
          userRole = (user?.email === 'contact@javachrist.fr') ? 'professional' : 'client';
          console.log('⚠️ Rôle non défini, détection automatique:', userRole);

          // Sauvegarder le rôle corrigé dans Firestore
          await setDoc(doc(db, 'users', uid), { role: userRole }, { merge: true });
        }

        // Pour les clients, récupérer tous les chantiers liés à l'email
        let chantierIds: string[] = Array.isArray(data.chantierIds) ? data.chantierIds.filter(Boolean) : [];
        if (chantierIds.length === 0 && data.chantierId) {
          chantierIds = [data.chantierId];
        }

        if (userRole === 'client' && user?.email) {
          console.log('🔍 Recherche chantiers pour email client:', user.email);
          const chantiersTrouves = await trouverChantiersParEmail(user.email);

          if (chantiersTrouves.length > 0) {
            const sameList =
              chantierIds.length === chantiersTrouves.length &&
              chantierIds.every((id) => chantiersTrouves.includes(id));
            if (!sameList) {
              chantierIds = chantiersTrouves;
              await setDoc(
                doc(db, 'users', uid),
                { chantierIds: chantiersTrouves, chantierId: chantiersTrouves[0] },
                { merge: true }
              );
            }
          } else if (chantierIds.length === 0) {
            console.warn('⚠️ Client sans chantier assigné - doit être configuré par le professionnel');
          }
        }

        const chantierId = chantierIds[0];

        // Utiliser l'email de Firebase Auth si celui de Firestore est vide
        const userEmail = data.email || user?.email || '';

        // Si l'email était vide dans Firestore, le corriger
        if (!data.email && user?.email) {
          console.log('🔧 Correction email manquant dans Firestore:', user.email);
          await setDoc(doc(db, 'users', uid), { email: user.email }, { merge: true });
        }

        return {
          uid: data.uid || uid,
          email: userEmail,
          displayName: data.displayName || 'Utilisateur',
          role: userRole,
          chantierId: chantierId,
          chantierIds: chantierIds.length > 0 ? chantierIds : undefined,
          dateCreation,
          derniereConnexion
        } as UserProfile;
      } else {
        // L'utilisateur existe dans Firebase Auth mais pas dans Firestore
        console.log('❌ Aucun profil trouvé dans Firestore pour UID:', uid);
        console.log('🔧 Création automatique du profil utilisateur manquant');

        // Récupérer les informations de l'utilisateur Firebase Auth
        const user = auth.currentUser;
        if (user) {
          // Extraire un nom plus intelligent depuis l'email
          let displayName = user.displayName;
          if (!displayName && user.email) {
            const emailPart = user.email.split('@')[0];
            // Capitaliser et nettoyer le nom
            displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1).replace(/[._]/g, ' ');
          }

          // Déterminer le rôle automatiquement
          const role = user.email === 'contact@javachrist.fr' ? 'professional' : 'client';

          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName || (role === 'professional' ? 'Professionnel' : 'Client'),
            role: role,
            dateCreation: new Date(),
            derniereConnexion: new Date()
          };

          // Sauvegarder le profil
          await authService.createUserProfile(uid, {
            email: newProfile.email,
            displayName: newProfile.displayName,
            role: newProfile.role
          });

          console.log('✅ Profil utilisateur créé automatiquement');
          return newProfile;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }
  },

  // Mettre à jour la dernière connexion
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        derniereConnexion: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erreur mise à jour connexion:', error);
    }
  },


  // Changer le rôle d'un utilisateur existant
  async changeUserRole(uid: string, newRole: 'professional' | 'client', chantierId?: string): Promise<void> {
    try {
      const updateData: any = {
        role: newRole,
        derniereConnexion: new Date()
      };

      if (newRole === 'client' && chantierId) {
        updateData.chantierId = chantierId;
        updateData.chantierIds = [chantierId];
      }

      await setDoc(doc(db, 'users', uid), updateData, { merge: true });
      console.log(`✅ Rôle utilisateur changé vers: ${newRole}`);
    } catch (error) {
      console.error('Erreur changement de rôle:', error);
      throw error;
    }
  },

  // Mettre à jour le profil utilisateur avec un nom correct
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...updates,
        derniereConnexion: new Date()
      }, { merge: true });
      console.log('✅ Profil utilisateur mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  },

  // Récupérer tous les utilisateurs (pour l'admin)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(collection(db, 'users'));

      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Gestion sécurisée des dates
        let dateCreation = new Date();
        let derniereConnexion = new Date();

        try {
          if (data.dateCreation?.toDate) {
            dateCreation = data.dateCreation.toDate();
          }
        } catch (e) {
          console.warn('Erreur conversion dateCreation:', e);
        }

        try {
          if (data.derniereConnexion?.toDate) {
            derniereConnexion = data.derniereConnexion.toDate();
          }
        } catch (e) {
          console.warn('Erreur conversion derniereConnexion:', e);
        }

        users.push({
          uid: data.uid || doc.id,
          email: data.email || '',
          displayName: data.displayName || 'Utilisateur',
          role: data.role || 'client',
          chantierId: data.chantierId,
          chantierIds: data.chantierIds,
          dateCreation,
          derniereConnexion
        });
      });

      console.log(`✅ ${users.length} utilisateurs chargés`);
      return users;
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      return [];
    }
  },

  // Fonction pour corriger l'ID de chantier d'un client
  async fixClientChantier(clientEmail: string, correctChantierId: string): Promise<void> {
    try {
      // Rechercher l'utilisateur par email (simulation)
      console.log(`🔧 Correction du chantier pour ${clientEmail} → ${correctChantierId}`);

      // Pour l'instant, on garde cette fonction pour usage manuel
      // En production, il faudrait une recherche par email dans Firestore

    } catch (error) {
      console.error('Erreur correction chantier client:', error);
      throw error;
    }
  },

  // Observer les changements d'état d'authentification
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },


  // Messages d'erreur en français
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/api-key-not-valid':
        return 'Clé API Firebase invalide. Vérifiez votre configuration dans .env.local';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre connexion Internet.';
      default:
        return `Erreur Firebase (${errorCode}). Vérifiez votre configuration.`;
    }
  }
};
