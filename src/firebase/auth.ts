import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'professional' | 'client';
  chantierId?: string; // Pour les clients : ID du chantier auquel ils ont accès
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

      // Créer le profil utilisateur dans Firestore
      await authService.createUserProfile(userCredential.user.uid, {
        email,
        displayName,
        role: 'professional' // Par défaut, les nouveaux utilisateurs sont 'professional'
      });

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
  async createUserProfile(uid: string, userData: { email: string; displayName: string; role: 'professional' | 'client'; chantierId?: string }): Promise<void> {
    try {
      const userProfile = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        chantierId: userData.chantierId,
        dateCreation: new Date(),
        derniereConnexion: new Date()
      };

      await setDoc(doc(db, 'users', uid), userProfile);
      console.log('✅ Profil utilisateur créé');
    } catch (error) {
      console.error('Erreur création profil:', error);
      throw error;
    }
  },

  // Récupérer le profil utilisateur
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();

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

        return {
          uid: data.uid || uid,
          email: data.email || '',
          displayName: data.displayName || 'Utilisateur',
          role: data.role || 'professional',
          chantierId: data.chantierId,
          dateCreation,
          derniereConnexion
        } as UserProfile;
      } else {
        // L'utilisateur existe dans Firebase Auth mais pas dans Firestore
        // Créer automatiquement le profil
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

          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName || 'Professionnel',
            role: 'professional', // Par défaut professionnel
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
