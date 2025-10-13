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
  role: 'admin' | 'user';
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
        role: 'user' // Par défaut, les nouveaux utilisateurs sont 'user'
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
  async createUserProfile(uid: string, userData: { email: string; displayName: string; role: 'admin' | 'user' }): Promise<void> {
    try {
      const userProfile: UserProfile = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
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
        return {
          ...data,
          dateCreation: data.dateCreation.toDate(),
          derniereConnexion: data.derniereConnexion.toDate()
        } as UserProfile;
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

  // Observer les changements d'état d'authentification
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Messages d'erreur en français
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
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
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
};
