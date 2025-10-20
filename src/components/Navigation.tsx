import React from 'react';
import {
  Building2,
  ClipboardList,
  FileText,
  ShoppingCart,
  Calendar,
  CreditCard,
  Users,
  Shield,
  Download,
  Wifi,
  WifiOff,
  Smartphone
} from 'lucide-react';
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
  { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
  { id: 'entreprises', label: 'Entreprises', icon: Building2 },
  { id: 'prestations', label: 'Prestations', icon: Users },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
  { id: 'assurances', label: 'Documents', icon: Shield },
];

export function Navigation({ currentView, onViewChange, userProfile, onLogout }: NavigationProps) {
  const { isInstallable, installApp, isInstalled, isOnline } = usePWA();

  return (
    <nav className="bg-gray-800 border-r border-gray-700 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-100">Suivi de Chantier</h1>
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
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentView === item.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
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
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs flex-1 justify-center transition-all ${isOnline
            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
            : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
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
