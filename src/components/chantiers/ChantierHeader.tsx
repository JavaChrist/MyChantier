import React, { useState } from 'react';
import { ChevronDown, ArrowLeft, LogOut, User, MessageCircle } from 'lucide-react';
import { AppIcon } from '../Icon';
import { useChantier } from '../../contexts/ChantierContext';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

interface ChantierHeaderProps {
  userProfile?: any;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
}

export function ChantierHeader({ userProfile, onLogout, onNavigate }: ChantierHeaderProps) {
  const { chantierActuel, setChantierActuel, setChangtierId } = useChantier();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Compter les messages non lus
  const unreadCount = useUnreadMessages(
    chantierActuel?.id || null,
    userProfile?.role || 'professional'
  );

  const handleRetourSelection = () => {
    setChantierActuel(null);
    setChangtierId(null);
  };

  if (!chantierActuel) return null;

  return (
    <div className="bg-primary-600 text-white p-2 md:p-4 border-b border-primary-500 sticky top-0 z-40" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <div className="p-1 md:p-2 bg-white/20 rounded-lg flex-shrink-0">
            <AppIcon size={20} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs md:text-lg font-semibold text-white truncate">
              {chantierActuel.nom}
            </h2>
            <p className="text-xs md:text-sm text-blue-100 truncate hidden md:block">
              {chantierActuel.clientNom}
              <span className="hidden md:inline"> • {chantierActuel.adresse}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          {/* Badge messages non lus */}
          {unreadCount > 0 && onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="relative p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={`${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''}`}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-primary-600">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>
          )}
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium hidden sm:block ${chantierActuel.statut === 'en-cours' ? 'bg-green-500 text-white' :
              chantierActuel.statut === 'planifie' ? 'bg-blue-500 text-white' :
                chantierActuel.statut === 'termine' ? 'bg-gray-500 text-white' :
                  'bg-red-500 text-white'
            }`}>
            {chantierActuel.statut === 'en-cours' ? 'En cours' :
              chantierActuel.statut === 'planifie' ? 'Planifié' :
                chantierActuel.statut === 'termine' ? 'Terminé' : 'Suspendu'}
          </div>

          {/* Bouton profil/déconnexion - visible sur mobile */}
          {userProfile && onLogout && (
            <div className="relative lg:hidden">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title={userProfile.displayName || 'Menu utilisateur'}
              >
                <User className="w-4 h-4 text-white" />
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userProfile.displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userProfile.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleRetourSelection}
            className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Changer de chantier"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>
      </div>

      {chantierActuel.budget && (
        <div className="mt-3 pt-3 border-t border-primary-500/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-100">Budget :</span>
            <span className="font-semibold text-white">
              {chantierActuel.budget.toLocaleString()} €
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
