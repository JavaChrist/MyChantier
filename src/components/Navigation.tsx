import React from 'react';
import {
  Download,
  Wifi,
  WifiOff,
  Smartphone
} from 'lucide-react';
import { AppIcon } from './Icon';
import { NavigationIcon } from './NavigationIcon';
import { usePWA } from '../hooks/usePWA';
import { UserHeader } from './auth/UserHeader';
import type { UserProfile } from '../firebase/auth';

interface NavigationProps {
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
  { id: 'etapes', label: 'Étapes', iconType: 'etapes' as const },
  { id: 'paiements', label: 'Paiements', iconType: 'paiements' as const },
  { id: 'assurances', label: 'Documents', iconType: 'documents' as const }
];

export function Navigation({ currentView, onViewChange, userProfile, onLogout }: NavigationProps) {
  const { isInstallable, installApp, isInstalled, isOnline } = usePWA();

  return (
    <nav className="bg-gray-800 border-r border-gray-700 w-64 min-h-screen p-4">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SC</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100">Suivi de Chantier</h1>
        </div>
        {isInstallable && (
          <button
            onClick={installApp}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Installer l'app</span>
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {navItems.map((item) => {
          return (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentView === item.id
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
            </li>
          );
        })}
      </ul>

      {/* Badges de statut dans la sidebar */}
      <div className="mt-auto pt-4 border-t border-gray-700 space-y-3">
        {/* Badges côte à côte dans la sidebar */}
        <div className="flex items-center space-x-2 w-full">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs flex-1 justify-center bg-green-600/20 text-green-400 border border-green-600/30">
            <Wifi className="w-3 h-3" />
            <span>Connecté</span>
          </div>

          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30">
            <Smartphone className="w-3 h-3" />
            <span>PWA</span>
          </div>
        </div>

        {/* En-tête utilisateur */}
        {userProfile && onLogout && (
          <UserHeader userProfile={userProfile} onLogout={onLogout} />
        )}
      </div>
    </nav>
  );
}
