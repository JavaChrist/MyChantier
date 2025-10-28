import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { authService } from '../firebase/auth';
import type { UserProfile } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        try {
          // Charger le profil utilisateur
          const profile = await authService.getUserProfile(user.uid);

          setUserProfile(profile);

          console.log('✅ Utilisateur connecté:', user.email);
        } catch (error) {
          console.error('Erreur chargement profil:', error);
          // En cas d'erreur, créer un profil minimal
          let displayName = user.displayName;
          if (!displayName && user.email) {
            const emailPart = user.email.split('@')[0];
            // Capitaliser et nettoyer le nom depuis l'email
            displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1).replace(/[._]/g, ' ');
          }

          // Déterminer le rôle automatiquement
          const role = user.email === 'contact@javachrist.fr' ? 'professional' : 'client';

          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName || (role === 'professional' ? 'Professionnel' : 'Client'),
            role: role,
            dateCreation: new Date(),
            derniereConnexion: new Date()
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        setUserProfile(null);
        console.log('❌ Utilisateur déconnecté');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      await authService.signIn(email, password);
    } catch (error: any) {
      setError(error.message);
      console.error('Erreur de connexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Inscription normale (professionnel par défaut)
      await authService.signUp(email, password, displayName);
      setSuccess('Compte créé avec succès ! Connexion en cours...');

    } catch (error: any) {
      setError(error.message);
      console.error('Erreur d\'inscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      await authService.resetPassword(email);
      setSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte mail (et le dossier spam).');

    } catch (error: any) {
      setError(error.message);
      console.error('Erreur de réinitialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setSuccess(null);
      await authService.signOut();
    } catch (error: any) {
      setError(error.message);
      console.error('Erreur de déconnexion:', error);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    success,
    login,
    signup,
    resetPassword,
    logout,
    isAuthenticated: !!user
  };
}
