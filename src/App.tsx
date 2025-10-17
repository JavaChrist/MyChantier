import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';
import { EntreprisesManager } from './components/entreprises/EntreprisesManager';
import { PrestationsManager } from './components/prestations/PrestationsManager';
import { CalendarPlanning } from './components/planning/CalendarPlanning';
import { PaiementsGlobaux } from './components/paiements/PaiementsGlobaux';
import { AssurancesManager } from './components/assurances/AssurancesManager';
import { PWAPrompt } from './components/PWAPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';

// Types simplifiés
interface Entreprise {
  id: string;
  nom: string;
  secteurActivite: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  contact: {
    nom: string;
    telephone: string;
    email: string;
  };
  dateCreation: Date;
}

interface Prestation {
  id: string;
  nom: string;
  description: string;
  secteur: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  entreprisesInvitees: string[];
  statut: 'en-cours' | 'devis-recus' | 'commande' | 'termine';
  dateCreation: Date;
}

// Données initiales
const initialEntreprises: Entreprise[] = [
  {
    id: '1',
    nom: 'Plomberie Martin',
    secteurActivite: 'sanitaire',
    contact: { nom: 'Jean Martin', telephone: '01 23 45 67 89', email: 'contact@plomberie-martin.fr' },
    dateCreation: new Date('2024-01-01')
  },
  {
    id: '2',
    nom: 'Électricité Dupont',
    secteurActivite: 'electricite',
    contact: { nom: 'Pierre Dupont', telephone: '01 34 56 78 90', email: 'p.dupont@elec-dupont.com' },
    dateCreation: new Date('2024-01-02')
  },
  {
    id: '3',
    nom: 'Carrelage Plus',
    secteurActivite: 'carrelage',
    contact: { nom: 'Marie Dubois', telephone: '01 45 67 89 01', email: 'marie@carrelage-plus.fr' },
    dateCreation: new Date('2024-01-03')
  },
  {
    id: '4',
    nom: 'Menuiserie Bois & Co',
    secteurActivite: 'menuiserie',
    contact: { nom: 'Paul Leclerc', telephone: '01 56 78 90 12', email: 'paul@bois-co.fr' },
    dateCreation: new Date('2024-01-04')
  },
  {
    id: '5',
    nom: 'Peinture Couleurs',
    secteurActivite: 'peinture',
    contact: { nom: 'Sophie Moreau', telephone: '01 67 89 01 23', email: 'sophie@peinture-couleurs.com' },
    dateCreation: new Date('2024-01-05')
  }
];

const initialPrestations: Prestation[] = [
  {
    id: '1',
    nom: 'Rénovation salle de bain',
    description: 'Rénovation complète de la salle de bain principale avec pose de nouveaux équipements',
    secteur: 'sanitaire',
    entreprisesInvitees: ['1'],
    statut: 'en-cours',
    dateCreation: new Date('2024-01-10')
  },
  {
    id: '2',
    nom: 'Installation électrique cuisine',
    description: 'Mise aux normes de l\'installation électrique de la cuisine avec nouveaux points lumineux',
    secteur: 'electricite',
    entreprisesInvitees: ['2'],
    statut: 'devis-recus',
    dateCreation: new Date('2024-01-11')
  },
  {
    id: '3',
    nom: 'Carrelage salon',
    description: 'Pose de carrelage grand format dans le salon et l\'entrée',
    secteur: 'carrelage',
    entreprisesInvitees: ['3'],
    statut: 'en-cours',
    dateCreation: new Date('2024-01-12')
  }
];

function EntreprisesPage({ entreprises }: { entreprises: Entreprise[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');

  const secteurs = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  const filteredEntreprises = entreprises.filter(entreprise => {
    const matchesSearch = entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSecteur = selectedSecteur === 'all' || entreprise.secteurActivite === selectedSecteur;
    return matchesSearch && matchesSecteur;
  });

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
  };

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Gestion des Entreprises</h1>
        <p className="text-gray-400 mobile-text">Gérez vos entreprises partenaires et leurs informations</p>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="input-field"
            >
              {secteurs.map(secteur => (
                <option key={secteur.value} value={secteur.value}>
                  {secteur.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des entreprises */}
      <div className="mobile-grid">
        {filteredEntreprises.map((entreprise) => (
          <div key={entreprise.id} className="card-mobile hover:bg-gray-750 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-100">{entreprise.nom}</h3>
                <p className="text-sm text-gray-400">{getSecteurLabel(entreprise.secteurActivite)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-gray-300">{entreprise.contact.nom}</div>
              <div className="text-gray-300">{entreprise.contact.telephone}</div>
              <div className="text-gray-300">{entreprise.contact.email}</div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Créée le {entreprise.dateCreation.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrestationsPage({ prestations, entreprises }: { prestations: Prestation[], entreprises: Entreprise[] }) {
  const [selectedSecteur, setSelectedSecteur] = useState<string>('all');

  const secteurs = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'sanitaire', label: 'Sanitaire' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' }
  ];

  const filteredPrestations = prestations.filter(prestation => {
    return selectedSecteur === 'all' || prestation.secteur === selectedSecteur;
  });

  const getEntrepriseNom = (entrepriseId: string) => {
    const entreprise = entreprises.find(e => e.id === entrepriseId);
    return entreprise?.nom || 'Entreprise inconnue';
  };

  const getSecteurLabel = (secteur: string) => {
    const secteurObj = secteurs.find(s => s.value === secteur);
    return secteurObj?.label || secteur;
  };

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div>
        <h1 className="mobile-header font-bold text-gray-100 mb-2">Gestion des Prestations</h1>
        <p className="text-gray-400 mobile-text">Gérez vos prestations par corps de métier</p>
      </div>

      {/* Filtre */}
      <div className="card">
        <select
          value={selectedSecteur}
          onChange={(e) => setSelectedSecteur(e.target.value)}
          className="input-field"
        >
          {secteurs.map(secteur => (
            <option key={secteur.value} value={secteur.value}>
              {secteur.label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des prestations */}
      <div className="mobile-grid">
        {filteredPrestations.map((prestation) => (
          <div key={prestation.id} className="card-mobile hover:bg-gray-750 transition-colors">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-100">{prestation.nom}</h3>
              <p className="text-sm text-gray-400">{getSecteurLabel(prestation.secteur)}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300">{prestation.description}</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Statut:</span>
                <span className="text-gray-300">{prestation.statut}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Entreprises:</span>
                <span className="text-gray-300">{prestation.entreprisesInvitees.length}</span>
              </div>

              {prestation.entreprisesInvitees.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Entreprises invitées:</p>
                  {prestation.entreprisesInvitees.map((entrepriseId) => (
                    <div key={entrepriseId} className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                      {getEntrepriseNom(entrepriseId)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Créée le {prestation.dateCreation.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const [entreprises] = useState<Entreprise[]>(initialEntreprises);
  const [prestations] = useState<Prestation[]>(initialPrestations);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'entreprises':
        return <EntreprisesManager />;
      case 'prestations':
        return <PrestationsManager />;
      case 'planning':
        return <CalendarPlanning />;
      case 'paiements':
        return <PaiementsGlobaux />;
      case 'assurances':
        return <AssurancesManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation mobile */}
      <MobileNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Layout desktop/mobile */}
      <div className="flex">
        {/* Navigation desktop - cachée sur mobile */}
        <div className="hidden lg:block">
          <Navigation
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Composants PWA et mises à jour */}
      <PWAPrompt />
      <UpdatePrompt />
    </div>
  );
}

export default App;
