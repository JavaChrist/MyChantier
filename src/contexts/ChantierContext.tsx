import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Chantier } from '../firebase/chantiers';

interface ChantierContextType {
  chantierId: string | null;
  chantierActuel: Chantier | null;
  setChantierActuel: (chantier: Chantier | null) => void;
  setChangtierId: (id: string | null) => void;
}

const ChantierContext = createContext<ChantierContextType | undefined>(undefined);

export function ChantierProvider({ children }: { children: React.ReactNode }) {
  const [chantierId, setChantierId] = useState<string | null>(null);
  const [chantierActuel, setChantierActuel] = useState<Chantier | null>(null);

  // Sauvegarder le chantier sélectionné dans le localStorage
  useEffect(() => {
    if (chantierId) {
      localStorage.setItem('selectedChantierId', chantierId);
    } else {
      localStorage.removeItem('selectedChantierId');
    }
  }, [chantierId]);

  // Charger le chantier sélectionné au démarrage
  useEffect(() => {
    const savedChantierId = localStorage.getItem('selectedChantierId');
    if (savedChantierId) {
      setChantierId(savedChantierId);
    }
  }, []);

  const setChangtierId = (id: string | null) => {
    setChantierId(id);
    if (!id) {
      setChantierActuel(null);
    }
  };

  return (
    <ChantierContext.Provider value={{
      chantierId,
      chantierActuel,
      setChantierActuel,
      setChangtierId
    }}>
      {children}
    </ChantierContext.Provider>
  );
}

export function useChantier() {
  const context = useContext(ChantierContext);
  if (context === undefined) {
    throw new Error('useChantier must be used within a ChantierProvider');
  }
  return context;
}
