# Suivi de Chantier – Guide Développeur

Application professionnelle de suivi de chantier construite avec **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** et **Firebase** (Firestore + Storage + Auth). Elle couvre l’administration, l’espace client et fonctionne en PWA.

---

## Sommaire

1. [Aperçu fonctionnel](#aperçu-fonctionnel)
2. [Architecture & dossiers clés](#architecture--dossiers-clés)
3. [Pré-requis](#pré-requis)
4. [Installation & configuration](#installation--configuration)
5. [Scripts npm](#scripts-npm)
6. [Fonctionnalités détaillées](#fonctionnalités-détaillées)
7. [Outils internes & maintenance](#outils-internes--maintenance)
8. [Bonnes pratiques UI/UX](#bonnes-pratiques-uiux)
9. [Déploiement](#déploiement)

---

## Aperçu fonctionnel

- **Dashboard** : statistiques temps réel (budget actif, devis, commandes, paiements, activité récente).
- **Entreprises** : fiche complète avec onglets Devis, Commandes, Paiements, Documents et formulaires dédiés.
- **Prestations** : regroupement automatique par secteur avec statuts calculés (en cours, devis reçus, commandes actives, terminé).
- **Planning** : calendrier Mois / Semaine / Jour / Agenda, formulaires de rendez-vous et coloration par entreprise.
- **Paiements globaux** : échéancier consolidé, budget prévisionnel, alertes de retard, modales guidées.
- **Documents & assurances** : suivi des expirations, upload et stockage Firebase Storage.
- **Espace client** : vue responsive avec progression chantier, historique des décisions, chat, documents filtrables.
- **PWA** : installable sur desktop/mobile, mode hors-ligne léger, service worker dédié.

---

## Architecture & dossiers clés

```
src/
├─ components/
│  ├─ admin/            # Modules administrateur
│  ├─ client/           # Interface client (Chat, Documents, Paiements…)
│  ├─ entreprises/      # Gestion entreprises, Devis, Commandes, Paiements
│  ├─ paiements/        # Paiements globaux, budgets, modales spécifiques
│  ├─ planning/         # CalendarPlanning + formulaires
│  ├─ prestations/      # PrestationsManager et logique associée
│  ├─ chat/             # ChantierChat, ClientChat, composants communs
│  └─ Modal / AlertModal / ConfirmModal
├─ contexts/            # ChantierContext (chantier sélectionné, budget actif…)
├─ firebase/            # Services Firestore/Storage/Auth + unified-services
├─ hooks/               # useAuth, useChantierData, useUnreadMessages, etc.
├─ utils/               # alertBus, scripts maintenance (cleanup*, migrate*)
└─ style.css            # Styles globaux + utilitaires (scrollbar-hide…)
```

### Modèle de données

Tous les modules consomment la structure Firestore V2 :
`chantiers/{chantierId}/{collection}` avec `entreprises`, `devis`, `commandes`, `paiements`, `documents`, `planning`, `etapes`, `messages`, `budgets`.  
Les services `unified*Service` encapsulent les requêtes et assurent le typage TypeScript.

---

## Pré-requis

- Node.js 18+ (20 LTS recommandé)
- npm 9+ (ou pnpm/yarn si ajusté)
- Projet Firebase configuré (Firestore + Storage + Auth email/password)
- Navigateur Chrome/Edge avec React DevTools

---

## Installation & configuration

```bash
git clone <url-du-repo>
cd SuiviDeChantier
npm install
```

1. **Variables d’environnement**  
   Copier `.env.local.example` → `.env.local`, puis renseigner :
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
2. **Lancer le mode développement**
   ```bash
   npm run dev
   ```
3. **Build production + preview**
   ```bash
   npm run build
   npm run preview
   ```

---

## Scripts npm

| Commande          | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Serveur Vite + React Fast Refresh                  |
| `npm run build`   | Build optimisé (Vite)                              |
| `npm run preview` | Serveur local sur le build                         |
| `npm run lint`\*  | Vérifications ESLint/TS (si activé dans le projet) |

\* Les IDE (VS Code / Cursor) remontent également les erreurs TypeScript en direct.

---

## Fonctionnalités détaillées

### Dashboard & budgets

- Budget actif synchronisé via `ChantierContext`.
- Cartes cliquables vers Paiements, Prestations, Documents, Planning.
- Activité récente construite à partir des dernières actions (devis, commandes, paiements, rendez-vous).

### Entreprises & workflow devis → commandes → paiements

- Formulaire entreprise typé (`EntrepriseForm`).
- Uploads dans Firebase Storage, liens stockés dans Firestore.
- Modales personnalisées (`Modal`, `ConfirmModal`) pour toutes les actions sensibles.

### Prestations

- `PrestationsManager` agrège les devis/commandes par entreprise + secteur.
- Indicateurs haut de page basés sur les **données réelles** (useMemo).
- Boutons “Voir devis” / statut commandes par entreprise.

### Planning

- `CalendarPlanning` gère les vues Mois/Semaine/Jour/Agenda.
- Rendez-vous alignés sur le modèle `RendezVous` V2 (`dateDebut`, `statut`).
- Couleurs par entreprise pour lecture rapide.

### Paiements globaux & budgets

- Sélection guidée devis → commande → échéancier.
- Vérification des doublons, confirmation spécifique, validation stricte des montants.
- Budgets prévisionnels (actifs/terminés/suspendus) avec édition via modales.

### Espace client

- Header responsive, badge pour messages non lus (`useUnreadMessages`).
- Barre de progression basée sur tous les devis, stepper “Progression du chantier”.
- Historique des décisions (paiements en attente), chat synchronisé avec `unifiedMessagesService`.
- Documents filtrables, résumés paiements, navigation mobile dédiée.

### Alertes globales & PWA

- `AlertModal` + `useAlertModal` + `GlobalAlertListener` -> système d’alertes unifié.
- `alertBus` pour déclencher des modales depuis utilitaires non-React.
- PWA active : manifest + service worker gérés par Vite.

---

## Outils internes & maintenance

Des scripts exposent des helpers dans la console (Chrome DevTools) pour diagnostiquer ou réparer les données :

| Fichier                  | Commandes                                                                          | Description                                |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| `migrateDevisToV2.ts`    | `__migrateDevisToV2(chantierId)`, `__migrateAllToV2(chantierId)`                   | Migration vers le modèle Firestore V2      |
| `cleanupDevis.ts`        | `__supprimerTousLesDevis(chantierId)`, `__supprimerDevisOrphelins(chantierId)`     | Nettoyage des devis (⚠ irréversible)       |
| `cleanupEtapes.ts`       | `__supprimerToutesLesEtapes(chantierId)`, `__supprimerEtapesParDefaut(chantierId)` | Purge des étapes (totale ou par défaut)    |
| `fixDevisEntreprises.ts` | `__diagnosticDevisEntreprises`, `__reassocierDevis`, `__reassocierDevisParNom`     | Ré-association devis ↔ entreprises         |
| `addSecondaryEmail.ts`   | `__ajouterEmailSecondaire(chantierId, email2, email3?)`                            | Ajout d’emails secondaires sur un chantier |

> Toujours effectuer un export Firestore / backup avant exécution.

---

## Bonnes pratiques UI/UX

- **Pas d’`alert()` ni `prompt()`** : utiliser `useAlertModal`, `ConfirmModal` ou `emitGlobalAlert`.
- **Responsive & accessibilité** : classes Tailwind existantes (flex-wrap, basis, grid). Penser aux labels explicites.
- **Scrollbars custom** : utiliser l’utilitaire `.scrollbar-hide` quand il faut masquer visuellement les barres.
- **État global** : préférer `ChantierContext` et `useChantierData` plutôt que recharger Firestore manuellement.
- **TypeScript strict** : toutes les entités sont typées (`Entreprise`, `Devis`, `Paiement`, `RendezVous`…).

---

## Déploiement

- Build Vite (`npm run build`) → dossier `dist/`.
- Compatible **Vercel** / **Netlify** / serveur statique.
- Configurer les variables d’environnement Firebase sur la plateforme cible.
- La PWA (manifest + service worker) est incluse dans le build et fonctionne out-of-the-box.

---

**Application développée par Christian** 🏗️  
_Gestion complète de chantiers avec workflow professionnel._
