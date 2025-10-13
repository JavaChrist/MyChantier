# Suivi de Chantier

Application complète de suivi et gestion de chantier développée avec React, TypeScript, Tailwind CSS et Firebase.

## 🚀 Fonctionnalités complètes

### ✅ Application 100% fonctionnelle

- **Dashboard** - Vue d'ensemble avec statistiques et activité récente
- **Entreprises** - CRUD complet avec devis, commandes et paiements intégrés par entreprise
- **Prestations** - Vue intelligente avec statuts automatiques basés sur l'avancement
- **Planning** - Calendrier avec vues mois/semaine/jour/agenda et gestion des rendez-vous
- **Paiements** - Tableau global de tous les paiements avec budget prévisionnel évolutif
- **Documents** - Gestion des assurances, garanties et documents officiels avec alertes d'expiration
- **PWA** - Application installable avec mode hors ligne

### 🏗️ Architecture

**Secteurs d'activité supportés :**

- Sanitaire (plomberie)
- Électricité
- Carrelage
- Menuiserie (fenêtres et portes)
- Peinture

**Base de données :**

- Firebase Firestore pour les données
- Firebase Storage pour les fichiers (PDF, Word, Images)
- Collections organisées par entreprise avec sous-collections

**Workflow complet :**

1. **Entreprises** → Créer et gérer les partenaires
2. **Documents** → Upload assurances, garanties, certifications
3. **Devis** → Recevoir et stocker les devis PDF/Word
4. **Commandes** → Transformer devis validés en commandes + devis signés
5. **Planning** → Calendrier des interventions + rendez-vous
6. **Paiements** → Suivi global acomptes/situations/solde + budget prévisionnel

## 🛠️ Installation

```bash
# Cloner le projet
git clone [url-du-repo]
cd SuiviDeChantier

# Installer les dépendances
npm install

# Configurer Firebase (optionnel)
# Copier .env.local.example vers .env.local et remplir les variables

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

## 📱 Utilisation

### Navigation

- **Desktop** : Menu latéral fixe avec profil utilisateur
- **Mobile** : Menu hamburger avec overlay

### Workflow par entreprise

1. **Créer une entreprise** avec contact et secteur d'activité
2. **Ajouter documents** (assurances, garanties) avec alertes d'expiration
3. **Recevoir devis** avec upload PDF/Word et gestion des statuts
4. **Créer commandes** depuis devis validés + upload devis signés
5. **Gérer paiements** (acompte 30%, situation 40%, solde 30%)
6. **Envoyer emails** avec contenu pré-formaté (Ionos, Gmail, Outlook)

### Planning et calendrier

- **4 vues** : Mois, Semaine, Jour, Agenda
- **Couleurs par secteur** : Identification visuelle des entreprises
- **Événements automatiques** : Dates de début/fin des commandes
- **Rendez-vous** : Création manuelle avec heures précises

### Paiements globaux

- **Tableau consolidé** : Tous paiements, toutes entreprises
- **Budget prévisionnel** : Modifiable selon évolution du chantier
- **Filtres avancés** : Statut, entreprise, type de paiement
- **Alertes** : Paiements en retard automatiquement détectés

## 🎨 Design

- **Mode sombre par défaut**
- **Icônes monochromes** Lucide React
- **Design professionnel** sans emojis
- **Modales personnalisées** (pas d'alerts)
- **Responsive mobile-first**

## 🔧 Technologies

- **React 18** + TypeScript
- **Vite** pour le build
- **Tailwind CSS** pour le styling
- **Firebase Firestore** pour les données
- **Firebase Storage** pour les fichiers
- **Lucide React** pour les icônes
- **PWA** avec Service Worker

## 📱 PWA (Progressive Web App)

- **Installable** sur mobile et desktop
- **Mode hors ligne** avec cache intelligent
- **Icônes complètes** (16px à 512px)
- **Manifest optimisé** pour l'installation

## 🚀 Déploiement

L'application est optimisée pour Vercel :

- **Build automatique** avec `npm run build`
- **Variables d'environnement** Firebase configurables
- **PWA** fonctionnelle en production
- **Cache optimisé** pour les performances

---

**Application développée par Christian** 🏗️
_Gestion complète de chantiers avec workflow professionnel_
