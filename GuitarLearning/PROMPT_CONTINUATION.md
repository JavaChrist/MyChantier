# 🎸 Prompt pour continuer le développement Guitar Learning

## 📋 Contexte du projet

Je développe une application d'apprentissage de la guitare avec accordeur intégré. Le projet est dans le dossier `C:\Users\conta\Desktop\GuitarLearning`.

## 🎯 Objectif principal

Créer une app comme **GuitarTuna** avec un accordeur de guitare utilisant l'API Web Audio pour analyser les fréquences sonores et détecter les notes.

## 🎨 Design souhaité

**Style interface Banque Postale** :

- 📱 **Header fixe** : Logo à gauche, hauteur optimisée iPhone avec safe areas
- 🔽 **Navigation footer** : Icônes de navigation en bas comme une app bancaire
- 🎨 **Couleurs** : Bleu bancaire (#003d82), blanc, gris clair
- 📱 **Mobile-first** : Optimisé pour iPhone/Android

## 🏗️ Architecture technique

### **Technologies installées :**

- ⚛️ **React 18 + TypeScript** + Vite
- 🎨 **Tailwind CSS** (configuré avec couleurs bancaires)
- 🎵 **Pitchfinder** : Détection de fréquences audio
- 🎸 **Lucide React** : Icônes monochromes

### **Fréquences guitare standard :**

```javascript
const GUITAR_TUNING = {
  E2: 82.41, // 6ème corde (Mi grave)
  A2: 110.0, // 5ème corde (La)
  D3: 146.83, // 4ème corde (Ré)
  G3: 196.0, // 3ème corde (Sol)
  B3: 246.94, // 2ème corde (Si)
  E4: 329.63, // 1ère corde (Mi aigu)
};
```

## 📱 Structure de navigation

### **Pages principales :**

1. 🎵 **Accordeur** : Page principale avec accordeur visuel
2. 🎸 **Accords** : Bibliothèque d'accords avec diagrammes
3. 🎼 **Gammes** : Gammes et exercices
4. 🎯 **Exercices** : Exercices d'entraînement
5. ⚙️ **Paramètres** : Configuration et préférences

### **Composants à créer :**

- `Layout.tsx` : Structure header + footer (déjà commencé)
- `FooterNavigation.tsx` : Navigation en bas
- `Tuner.tsx` : Accordeur principal
- `useAudioAnalyzer.ts` : Hook pour analyse audio

## 🎵 Fonctionnalités accordeur

### **Interface accordeur :**

- 🎯 **Cercle central** : Aiguille qui bouge selon la justesse
- 🎸 **Sélecteur de corde** : E, A, D, G, B, E
- 📊 **Indicateur fréquence** : Hz et cents
- 🎨 **Couleurs** : Rouge (faux), Jaune (proche), Vert (juste)

### **Détection audio :**

- 🎤 **Microphone** : `getUserMedia()` pour capturer l'audio
- 📊 **Analyse** : Web Audio API + FFT pour détecter les fréquences
- 🎵 **Conversion** : Fréquence Hz → Note musicale + cents

## 🎨 Mes préférences de design

⚠️ **Règles strictes à respecter :**

- ❌ **Aucun emoji** dans l'interface - uniquement icônes Lucide monochromes
- ❌ **Aucun alert()** JavaScript - toujours des modales personnalisées
- ✅ **Design monochrome** et professionnel obligatoire
- 🎨 **Style bancaire** : Bleu foncé, blanc, interface épurée

## 🚀 Prochaines étapes

1. **Terminer le Layout** : FooterNavigation + responsive
2. **Créer l'accordeur** : Interface visuelle + détection audio
3. **Hook audio** : useAudioAnalyzer avec Web Audio API
4. **Pages secondaires** : Accords, gammes, exercices
5. **PWA** : Installable comme l'app Suivi de Chantier

## 📁 État actuel

- ✅ **Projet créé** : React + TypeScript + Vite
- ✅ **Tailwind configuré** : Couleurs bancaires + safe areas iPhone
- ✅ **Dépendances** : Pitchfinder pour détection audio
- 🔄 **En cours** : Layout avec header/footer navigation

## 💬 Instructions pour continuer

Utilise ce prompt au début de la nouvelle conversation pour que l'assistant comprenne le contexte complet et puisse continuer le développement de l'application d'apprentissage de la guitare exactement comme souhaité.

---

**Développé par Christian** - Style interface bancaire moderne 🎸
