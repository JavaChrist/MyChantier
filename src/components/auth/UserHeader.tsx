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
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-750 rounded-lg">
      {/* Avatar et info utilisateur */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100 truncate">
            {userProfile.displayName === 'Utilisateur' ? 'Administrateur' : userProfile.displayName}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {userProfile.role === 'professional' ? 'Professionnel' :
              userProfile.role === 'client' ? 'Client' : 'Utilisateur'}
          </p>
        </div>
      </div>

      {/* Bouton de déconnexion direct */}
      <button
        onClick={handleLogout}
        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        title="Se déconnecter"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
