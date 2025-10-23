import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import type { UserProfile } from '../../firebase/auth';

interface UserHeaderProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

export function UserHeader({ userProfile, onLogout }: UserHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-sm font-medium text-gray-100">{userProfile.displayName}</p>
          <p className="text-xs text-gray-400">
            {userProfile.role === 'professional' ? 'Professionnel' :
              userProfile.role === 'client' ? 'Client' : 'Utilisateur'}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-100">{userProfile.displayName}</p>
                  <p className="text-sm text-gray-400">{userProfile.email}</p>
                  <p className="text-xs text-gray-500">
                    {userProfile.role === 'professional' ? 'Professionnel' :
                      userProfile.role === 'client' ? 'Client' : 'Utilisateur'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // TODO: Ajouter modal de paramètres
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>

            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
              <p>Dernière connexion :</p>
              <p>{userProfile.derniereConnexion.toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
