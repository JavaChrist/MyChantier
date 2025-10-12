import { db } from '../database';
import { Entreprise, Prestation } from '../types';

export async function seedDatabase() {
  try {
    // Vérifier si des données existent déjà
    const existingEntreprises = await db.entreprises.count();
    if (existingEntreprises > 0) {
      return; // Données déjà présentes
    }

    // Entreprises de test
    const entreprises: Entreprise[] = [
      {
        id: 'entreprise-1',
        nom: 'Plomberie Martin',
        secteurActivite: 'sanitaire',
        contact: {
          nom: 'Jean Martin',
          telephone: '01 23 45 67 89',
          email: 'contact@plomberie-martin.fr'
        },
        adresse: {
          rue: '123 rue de la République',
          ville: 'Paris',
          codePostal: '75001'
        },
        assurances: [],
        dateCreation: new Date('2024-01-01'),
        notes: 'Entreprise spécialisée en plomberie et sanitaire'
      },
      {
        id: 'entreprise-2',
        nom: 'Électricité Dupont',
        secteurActivite: 'electricite',
        contact: {
          nom: 'Pierre Dupont',
          telephone: '01 34 56 78 90',
          email: 'p.dupont@elec-dupont.com'
        },
        adresse: {
          rue: '456 avenue des Champs',
          ville: 'Lyon',
          codePostal: '69000'
        },
        assurances: [],
        dateCreation: new Date('2024-01-02'),
        notes: 'Installation électrique et domotique'
      },
      {
        id: 'entreprise-3',
        nom: 'Carrelage Plus',
        secteurActivite: 'carrelage',
        contact: {
          nom: 'Marie Dubois',
          telephone: '01 45 67 89 01',
          email: 'marie@carrelage-plus.fr'
        },
        adresse: {
          rue: '789 boulevard du Carrelage',
          ville: 'Marseille',
          codePostal: '13000'
        },
        assurances: [],
        dateCreation: new Date('2024-01-03'),
        notes: 'Pose et rénovation de carrelage'
      },
      {
        id: 'entreprise-4',
        nom: 'Menuiserie Bois & Co',
        secteurActivite: 'menuiserie',
        contact: {
          nom: 'Paul Leclerc',
          telephone: '01 56 78 90 12',
          email: 'paul@bois-co.fr'
        },
        adresse: {
          rue: '321 rue du Bois',
          ville: 'Toulouse',
          codePostal: '31000'
        },
        assurances: [],
        dateCreation: new Date('2024-01-04'),
        notes: 'Fenêtres, portes et aménagements sur mesure'
      },
      {
        id: 'entreprise-5',
        nom: 'Peinture Couleurs',
        secteurActivite: 'peinture',
        contact: {
          nom: 'Sophie Moreau',
          telephone: '01 67 89 01 23',
          email: 'sophie@peinture-couleurs.com'
        },
        adresse: {
          rue: '654 avenue des Couleurs',
          ville: 'Nice',
          codePostal: '06000'
        },
        assurances: [],
        dateCreation: new Date('2024-01-05'),
        notes: 'Peinture intérieure et extérieure'
      }
    ];

    // Prestations de test
    const prestations: Prestation[] = [
      {
        id: 'prestation-1',
        nom: 'Rénovation salle de bain',
        description: 'Rénovation complète de la salle de bain principale avec pose de nouveaux équipements',
        secteur: 'sanitaire',
        entreprisesInvitees: ['entreprise-1'],
        dateCreation: new Date('2024-01-10'),
        statut: 'en-cours'
      },
      {
        id: 'prestation-2',
        nom: 'Installation électrique cuisine',
        description: 'Mise aux normes de l\'installation électrique de la cuisine avec nouveaux points lumineux',
        secteur: 'electricite',
        entreprisesInvitees: ['entreprise-2'],
        dateCreation: new Date('2024-01-11'),
        statut: 'devis-recus'
      },
      {
        id: 'prestation-3',
        nom: 'Carrelage salon',
        description: 'Pose de carrelage grand format dans le salon et l\'entrée',
        secteur: 'carrelage',
        entreprisesInvitees: ['entreprise-3'],
        dateCreation: new Date('2024-01-12'),
        statut: 'en-cours'
      }
    ];

    // Insérer les données
    await db.entreprises.bulkAdd(entreprises);
    await db.prestations.bulkAdd(prestations);

    console.log('Données de test ajoutées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données de test:', error);
  }
}
