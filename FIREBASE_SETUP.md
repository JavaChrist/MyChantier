# Configuration Firebase pour Suivi de Chantier

## 1. Firebase Storage - Configuration CORS

### Étape 1: Activer Firebase Storage

1. Va dans **Firebase Console** → Ton projet "mychantier-c317b"
2. Dans le menu latéral → **Storage**
3. Clique **"Commencer"**
4. Choisis **"Commencer en mode test"** (ou production selon tes préférences)
5. Sélectionne une région (ex: europe-west1)

### Étape 2: Configurer les règles Storage

1. Va dans **Storage** → **Rules**
2. Remplace les règles par :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Règles pour les fichiers de devis
    match /entreprises/{entrepriseId}/devis/{devisId}/{fileName} {
      allow read, write: if true;
    }

    // Autoriser tous les autres fichiers (temporaire pour les tests)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique **"Publier"**

### Étape 3: Configuration CORS (si nécessaire)

Si tu as encore des erreurs CORS, exécute cette commande :

```bash
# Installer Google Cloud SDK si pas déjà fait
# Puis configurer CORS pour Firebase Storage

echo '[
  {
    "origin": ["http://localhost:3002", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

gsutil cors set cors.json gs://mychantier-c317b.firebasestorage.app
```

## 2. Test de l'upload

Une fois configuré, teste :

1. Va dans **Entreprises** → **Devis** d'une entreprise
2. **"Recevoir un devis"**
3. Sélectionne un fichier PDF
4. Sauvegarde

## 3. Vérification

- Va dans **Firebase Console** → **Storage**
- Tu devrais voir le dossier `entreprises/` avec tes fichiers
- Les URLs des fichiers devraient être accessibles
