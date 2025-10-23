import React, { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, UserPlus, RotateCcw } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success?: string | null;
}

export function LoginForm({ onLogin, onSignUp, onResetPassword, loading, error, success }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        return; // Erreur gérée visuellement
      }
      await onSignUp(formData.email, formData.password, formData.displayName);
    } else if (mode === 'reset') {
      await onResetPassword(formData.email);
    } else {
      await onLogin(formData.email, formData.password);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100">Suivi de Chantier</h1>
          <p className="text-gray-400 mt-2">
            {mode === 'login' && 'Connectez-vous à votre compte'}
            {mode === 'signup' && 'Créez votre compte'}
            {mode === 'reset' && 'Récupérez l\'accès à votre compte'}
          </p>

          {/* Message d'aide pour les clients */}
          {mode === 'reset' && (
            <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <p className="text-xs text-blue-400 text-center">
                👤 <strong>Client d'un professionnel ?</strong> Utilisez votre email pour recevoir un lien de réinitialisation
                et définir votre mot de passe.
              </p>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom d'affichage (inscription uniquement) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Jean Dupont"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field pl-12 w-full"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Mot de passe (sauf reset) */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field pl-12 pr-12 w-full"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-100"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation mot de passe (inscription uniquement) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`input-field pl-12 w-full ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                      }`}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-3">
                <p className="text-green-400 text-sm whitespace-pre-line">{success}</p>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading || (mode === 'signup' && formData.password !== formData.confirmPassword)}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {mode === 'login' && 'Connexion...'}
                    {mode === 'signup' && 'Création du compte...'}
                    {mode === 'reset' && 'Envoi en cours...'}
                  </span>
                </>
              ) : (
                <>
                  {mode === 'login' && <LogIn className="w-5 h-5" />}
                  {mode === 'signup' && <UserPlus className="w-5 h-5" />}
                  {mode === 'reset' && <RotateCcw className="w-5 h-5" />}
                  <span>
                    {mode === 'login' && 'Se connecter'}
                    {mode === 'signup' && 'Créer le compte'}
                    {mode === 'reset' && 'Envoyer le lien'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Liens de navigation */}
          <div className="mt-6 space-y-3">
            {mode === 'login' && (
              <>
                <div className="text-center">
                  <button
                    onClick={() => switchMode('reset')}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-400">Pas encore de compte ? </span>
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    S'inscrire
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center space-y-2">
                <div>
                  <span className="text-sm text-gray-400">Déjà un compte ? </span>
                  <button
                    onClick={() => switchMode('login')}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Se connecter
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => switchMode('reset')}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="text-center">
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            )}
          </div>


          {/* Informations sur l'application */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Suivi de Chantier</h3>
              <p className="text-xs text-gray-400">
                Gestion complète de vos chantiers : entreprises, devis, commandes, planning et paiements
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span>✅ Mobile-first</span>
                <span>✅ Mode hors ligne</span>
                <span>✅ Sécurisé</span>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
