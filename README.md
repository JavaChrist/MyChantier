# Suivi de Chantier

Application moderne de suivi et gestion de chantier développée avec React, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

### ✅ Modules terminés

- **Dashboard** - Vue d'ensemble avec statistiques et activité récente
- **Gestion des Entreprises** - CRUD complet des entreprises partenaires par secteur
- **Gestion des Prestations** - Création et suivi des prestations par corps de métier
- **Planning des Travaux** - Planification avec gestion des dépendances entre métiers
- **Interface Mobile-First** - Navigation optimisée pour mobile et desktop

### 🔄 Modules en développement

- **Gestion des Devis** - Upload PDF/Word, validation/refus, dates
- **Gestion des Paiements** - Acomptes, situations, paiement final

### 🏗️ Architecture

**Secteurs d'activité supportés :**

- Sanitaire (plomberie)
- Électricité
- Carrelage
- Menuiserie (fenêtres et portes)
- Peinture

**Base de données :**

- IndexedDB via Dexie pour stockage local
- Données persistantes côté client
- Données de test pré-chargées

## 🛠️ Installation

```bash
# Cloner le projet
git clone [url-du-repo]
cd SuiviDeChantier

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

## 📱 Utilisation

### Navigation

- **Desktop** : Menu latéral fixe
- **Mobile** : Menu hamburger avec overlay

### Workflow type

1. **Créer des entreprises** par secteur d'activité
2. **Créer des prestations** et inviter les entreprises
3. **Recevoir et valider les devis**
4. **Créer des commandes** et gérer les paiements
5. **Planifier les travaux** avec gestion des dépendances

### Exemple de dépendances

- Le carreleur doit démonter avant que le plombier intervienne
- Le plombier pose les conduites avant que le carreleur repose
- Puis le plombier peut installer les équipements

## 🎨 Design

- **Mode sombre par défaut**
- **Icônes monochromes** Lucide React
- **Pas d'emojis** - design professionnel
- **Modales personnalisées** au lieu d'alerts
- **Responsive mobile-first**

## 🔧 Technologies

- **React 18** + TypeScript
- **Vite** pour le build
- **Tailwind CSS** pour le styling
- **Dexie** pour IndexedDB
- **Lucide React** pour les icônes

## 📊 Données de test

L'application se charge avec des données d'exemple :

- 5 entreprises (une par secteur)
- 3 prestations en cours
- Statistiques du dashboard

## 🚀 Prochaines étapes

1. Module de gestion des devis avec upload de fichiers
2. Système de paiements complet
3. Gestion des assurances d'entreprises
4. Export/import de données
5. Notifications et rappels
6. Calendrier intégré pour les rendez-vous

---

Développé par Christian avec Claude Sonnet 4 🤝
