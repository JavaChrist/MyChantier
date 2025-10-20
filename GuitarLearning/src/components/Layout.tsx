import React from 'react';
import { Music, Settings } from 'lucide-react';
import { FooterNavigation } from './FooterNavigation';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe style Banque Postale */}
      <header className="header-bank">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Guitar Learning</h1>
              <p className="text-xs text-blue-100">Votre coach guitare</p>
            </div>
          </div>
          
          <button className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="main-content">
        {children}
      </main>

      {/* Navigation footer */}
      <FooterNavigation 
        currentView={currentView} 
        onViewChange={onViewChange} 
      />
    </div>
  );
}

