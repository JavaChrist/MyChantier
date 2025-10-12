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
  Download
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
  { id: 'entreprises', label: 'Entreprises', icon: Building2 },
  { id: 'prestations', label: 'Prestations', icon: Users },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
  { id: 'assurances', label: 'Documents', icon: Shield },
];

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { isInstallable, installApp } = usePWA();

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
    </nav>
  );
}
