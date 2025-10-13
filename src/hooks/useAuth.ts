import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { authService } from '../firebase/auth';
import type { UserProfile } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        // Charger le profil utilisateur
        const profile = await authService.getUserProfile(user.uid);
        setUserProfile(profile);
        console.log('✅ Utilisateur connecté:', user.email);
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
      setLoading(true);
      await authService.signUp(email, password, displayName);
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
      setLoading(true);
      await authService.resetPassword(email);
      setError('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
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
    login,
    signup,
    resetPassword,
    logout,
    isAuthenticated: !!user
  };
}
