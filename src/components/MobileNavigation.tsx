import React, { useState } from 'react';
import {
  Menu,
  X
} from 'lucide-react';
import { AppIcon } from './Icon';
import { NavigationIcon } from './NavigationIcon';
import { UserHeader } from './auth/UserHeader';
import type { UserProfile } from '../firebase/auth';

interface MobileNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userProfile?: UserProfile | null;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', iconType: 'dashboard' as const },
  { id: 'entreprises', label: 'Entreprises', iconType: 'entreprises' as const },
  { id: 'prestations', label: 'Prestations', iconType: 'prestations' as const },
  { id: 'planning', label: 'Planning', iconType: 'planning' as const },
  { id: 'paiements', label: 'Paiements', iconType: 'paiements' as const },
  { id: 'assurances', label: 'Documents', iconType: 'documents' as const },
];

export function MobileNavigation({ currentView, onViewChange, userProfile, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const currentItem = navItems.find(item => item.id === currentView);

  return (
    <>
      {/* Bouton menu mobile (en bas à droite pour éviter conflits) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Menu mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-gray-800 border-r border-gray-700 p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <AppIcon size={32} />
                <h1 className="text-xl font-bold text-gray-100">Suivi de Chantier</h1>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* En-tête utilisateur mobile */}
            {userProfile && onLogout && (
              <div className="mb-6 pb-4 border-b border-gray-700">
                <UserHeader userProfile={userProfile} onLogout={onLogout} />
              </div>
            )}

            <nav className="space-y-2">
              {navItems.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${currentView === item.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                      }`}
                  >
                    <NavigationIcon
                      type={item.iconType}
                      isActive={currentView === item.id}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
