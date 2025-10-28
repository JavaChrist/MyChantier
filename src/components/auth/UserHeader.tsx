import React from 'react';
import { User, LogOut } from 'lucide-react';
import type { UserProfile } from '../../firebase/auth';

interface UserHeaderProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

export function UserHeader({ userProfile, onLogout }: UserHeaderProps) {
  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="flex items-center space-x-3 p-2">
      {/* Avatar et info utilisateur */}
      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="text-left hidden lg:block flex-1">
        <p className="text-sm font-medium text-gray-100">
          {userProfile.displayName === 'Utilisateur' ? 'Administrateur' : userProfile.displayName}
        </p>
        <p className="text-xs text-gray-400">
          {userProfile.role === 'professional' ? 'Professionnel' :
            userProfile.role === 'client' ? 'Client' : 'Utilisateur'}
        </p>
      </div>

      {/* Bouton de déconnexion direct */}
      <button
        onClick={handleLogout}
        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
        title="Se déconnecter"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
