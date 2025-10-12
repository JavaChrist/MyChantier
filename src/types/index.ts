// Types pour l'application de suivi de chantier

export interface Entreprise {
  id: string;
  nom: string;
  secteurActivite: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  contact: {
    nom: string;
    telephone: string;
    email: string;
  };
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
  };
  assurances: Assurance[];
  dateCreation: Date;
  notes?: string;
}

export interface Assurance {
  id: string;
  entrepriseId: string;
  type: 'responsabilite-civile' | 'decennale' | 'autre';
  numeroPolice: string;
  compagnieAssurance: string;
  dateDebut: Date;
  dateFin: Date;
  montantGarantie: number;
  documentUrl?: string;
}

export interface Prestation {
  id: string;
  nom: string;
  description: string;
  secteur: 'sanitaire' | 'electricite' | 'carrelage' | 'menuiserie' | 'peinture';
  entreprisesInvitees: string[]; // IDs des entreprises
  dateCreation: Date;
  statut: 'en-cours' | 'devis-recus' | 'commande' | 'termine';
}

export interface RendezVous {
  id: string;
  prestationId: string;
  entrepriseId: string;
  type: 'visite-chantier' | 'remise-devis' | 'autre';
  dateHeure: Date;
  adresseChantier: string;
  notes?: string;
  statut: 'planifie' | 'realise' | 'annule';
}

export interface Devis {
  id: string;
  prestationId: string;
  entrepriseId: string;
  numero: string;
  montantHT: number;
  montantTTC: number;
  dateRemise: Date;
  dateValidite: Date;
  statut: 'en-attente' | 'valide' | 'refuse';
  documentUrl?: string;
  notes?: string;
}

export interface Commande {
  id: string;
  devisId: string;
  prestationId: string;
  entrepriseId: string;
  numero: string;
  montantHT: number;
  montantTTC: number;
  dateCommande: Date;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  statut: 'commandee' | 'en-cours' | 'terminee' | 'annulee';
  paiements: Paiement[];
}

export interface Paiement {
  id: string;
  commandeId: string;
  type: 'acompte' | 'situation' | 'solde';
  montant: number;
  datePrevue: Date;
  dateReglement?: Date;
  statut: 'prevu' | 'regle' | 'en-retard';
  notes?: string;
}

export interface TacheChantier {
  id: string;
  commandeId: string;
  nom: string;
  description: string;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  dateDebutReelle?: Date;
  dateFinReelle?: Date;
  dureeEstimee: number; // en jours
  statut: 'non-commencee' | 'en-cours' | 'terminee' | 'bloquee';
  dependances: string[]; // IDs des tâches qui doivent être terminées avant
  notes?: string;
}

export interface PlanningChantier {
  id: string;
  nom: string;
  adresse: string;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  taches: TacheChantier[];
  statut: 'planifie' | 'en-cours' | 'termine' | 'suspendu';
  notes?: string;
}
