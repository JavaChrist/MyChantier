import Dexie, { type Table } from 'dexie';
import type {
  Entreprise,
  Assurance,
  Prestation,
  RendezVous,
  Devis,
  Commande,
  Paiement,
  TacheChantier,
  PlanningChantier
} from '../types';

export class SuiviChantierDB extends Dexie {
  entreprises!: Table<Entreprise>;
  assurances!: Table<Assurance>;
  prestations!: Table<Prestation>;
  rendezVous!: Table<RendezVous>;
  devis!: Table<Devis>;
  commandes!: Table<Commande>;
  paiements!: Table<Paiement>;
  taches!: Table<TacheChantier>;
  plannings!: Table<PlanningChantier>;

  constructor() {
    super('SuiviChantierDB');

    this.version(1).stores({
      entreprises: 'id, nom, secteurActivite, dateCreation',
      assurances: 'id, entrepriseId, type, dateFin',
      prestations: 'id, nom, secteur, statut, dateCreation',
      rendezVous: 'id, prestationId, entrepriseId, dateHeure, statut',
      devis: 'id, prestationId, entrepriseId, dateRemise, statut',
      commandes: 'id, devisId, prestationId, entrepriseId, dateCommande, statut',
      paiements: 'id, commandeId, type, datePrevue, statut',
      taches: 'id, commandeId, dateDebutPrevue, dateFinPrevue, statut',
      plannings: 'id, nom, dateDebutPrevue, statut'
    });
  }
}

export const db = new SuiviChantierDB();
