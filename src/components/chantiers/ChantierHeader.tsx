import React, { useState } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { AppIcon } from '../Icon';
import { useChantier } from '../../contexts/ChantierContext';

export function ChantierHeader() {
  const { chantierActuel, setChantierActuel, setChangtierId } = useChantier();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const handleRetourSelection = () => {
    setChantierActuel(null);
    setChangtierId(null);
  };

  if (!chantierActuel) return null;

  return (
    <div className="bg-primary-600 text-white p-3 md:p-4 border-b border-primary-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <div className="p-1 md:p-2 bg-white/20 rounded-lg flex-shrink-0">
            <AppIcon size={24} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm md:text-lg font-semibold text-white truncate">
              {chantierActuel.nom}
            </h2>
            <p className="text-xs md:text-sm text-blue-100 truncate">
              {chantierActuel.clientNom}
              <span className="hidden md:inline"> • {chantierActuel.adresse}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          <div className={`px-2 py-1 rounded-full text-xs md:text-sm font-medium ${chantierActuel.statut === 'en-cours' ? 'bg-green-500 text-white' :
              chantierActuel.statut === 'planifie' ? 'bg-blue-500 text-white' :
                chantierActuel.statut === 'termine' ? 'bg-gray-500 text-white' :
                  'bg-red-500 text-white'
            }`}>
            {chantierActuel.statut === 'en-cours' ? 'En cours' :
              chantierActuel.statut === 'planifie' ? 'Planifié' :
                chantierActuel.statut === 'termine' ? 'Terminé' : 'Suspendu'}
          </div>

          <button
            onClick={handleRetourSelection}
            className="p-1 md:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
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
