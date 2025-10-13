import React, { useState } from 'react';
import {
  Building2,
  ClipboardList,
  FileText,
  ShoppingCart,
  Calendar,
  CreditCard,
  Users,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { UserHeader } from './auth/UserHeader';
import type { UserProfile } from '../firebase/auth';

interface MobileNavigationProps {
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

export function MobileNavigation({ currentView, onViewChange, userProfile, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const currentItem = navItems.find(item => item.id === currentView);
  const CurrentIcon = currentItem?.icon || ClipboardList;

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <CurrentIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">Suivi de Chantier</h1>
            <p className="text-xs text-gray-400">{currentItem?.label}</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Menu mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-gray-800 border-r border-gray-700 p-4">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-xl font-bold text-gray-100">Suivi de Chantier</h1>
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
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${currentView === item.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
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
