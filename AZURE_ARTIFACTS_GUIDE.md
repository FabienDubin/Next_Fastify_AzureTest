# 📦 Guide Complet : Publier @repo/shared sur Azure Artifacts

## 🎯 Objectif

Transformer `packages/shared` en un **vrai package npm privé** hébergé sur Azure Artifacts pour éviter les problèmes de symlinks lors du déploiement.

---

## 📋 Ce qu'on va faire

1. ✅ Créer un compte Azure DevOps (si tu n'en as pas)
2. ✅ Créer un "Feed" (registry npm privé)
3. ✅ Configurer le package `@repo/shared`
4. ✅ Publier le package sur Azure Artifacts
5. ✅ Modifier le backend pour l'utiliser
6. ✅ Automatiser avec GitHub Actions

**Durée totale estimée : 30-40 minutes**

---

## 🔐 Étape 0 : Compte Azure DevOps

### Option A : Tu as déjà un compte Azure

Si tu as déjà un compte Azure (celui qu'on utilise pour le déploiement), **tu peux utiliser le même** !

1. Va sur : **https://dev.azure.com**
2. Connecte-toi avec ton compte Microsoft/Azure

### Option B : Tu n'as pas de compte

1. Va sur : **https://dev.azure.com**
2. Clique sur **"Start free"**
3. Connecte-toi avec un compte Microsoft (Gmail, Outlook, etc.)
4. C'est **gratuit** (pas besoin de carte bancaire)

**Résultat** : Tu arrives sur la page d'accueil Azure DevOps

---

## 🏢 Étape 1 : Créer une Organisation

### 1.1 Première connexion

Quand tu te connectes pour la première fois à Azure DevOps, on te demande de **créer une organisation**.

**Configuration** :

| Champ | Valeur à mettre |
|-------|-----------------|
| **Organization name** | `TestAzure` (ou ton prénom, ex: `FabOrg`) |
| **We'll host your projects in** | `West Europe` |

Clique sur **"Continue"**

### 1.2 Si tu as déjà une organisation

1. Clique sur l'icône **Azure DevOps** (en haut à gauche)
2. Tu verras la liste de tes organisations
3. Utilise une existante **OU** clique sur **"+ Create new organization"**

**⚠️ Note importante** : L'URL de ton organisation sera :
```
https://dev.azure.com/TestAzure
```

Copie cette URL quelque part, on en aura besoin !

---

## 📁 Étape 2 : Créer un Projet

### 2.1 Page de création

Une fois l'organisation créée, on te demande de créer un **projet**.

**Configuration** :

| Champ | Valeur |
|-------|--------|
| **Project name** | `TestAzure` |
| **Description** | `Monorepo Next.js + Fastify` (optionnel) |
| **Visibility** | `Private` ⚠️ Important ! |

Clique sur **"+ Create project"**

### 2.2 Si tu as déjà un projet

1. En haut à gauche, clique sur **"Azure DevOps"**
2. Sélectionne ton organisation
3. Clique sur **"+ New project"**

**Résultat** : Tu arrives sur la page d'accueil du projet

---

## 📦 Étape 3 : Créer le Feed (Registry npm)

### 3.1 Accéder à Artifacts

**Navigation** :

1. Dans le menu de gauche, clique sur **"Artifacts"** (icône de boîte 📦)
2. Tu verras une page vide avec **"+ Create Feed"**

### 3.2 Créer le Feed

Clique sur **"+ Create Feed"**

**Configuration dans la popup** :

| Champ | Valeur | Explication |
|-------|--------|-------------|
| **Name** | `testazure-packages` | Nom du registry npm |
| **Visibility** | `Members of TestAzure` | Privé (seulement toi) |
| **Upstream sources** | ☑️ **Coché** | Permet d'utiliser npm public en plus |
| **Scope** | `Project: TestAzure` | Limité à ce projet |

Clique sur **"Create"**

**Résultat** : Le feed est créé ! Tu arrives sur la page du feed (vide pour l'instant).

### 3.3 Récupérer l'URL du feed

Sur la page du feed :

1. Clique sur **"Connect to feed"** (en haut à droite)
2. Dans le panneau de gauche, sélectionne **"npm"**
3. Tu verras une URL comme ça :

```
https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/
```

**📝 COPIE CETTE URL** dans un fichier texte, on en aura besoin !

---

## 🔑 Étape 4 : Créer un Personal Access Token (PAT)

### 4.1 Accéder aux PAT

1. En haut à droite, clique sur l'**icône de profil** (ton avatar)
2. Dans le menu déroulant, clique sur **"Personal access tokens"**

### 4.2 Créer un nouveau token

Clique sur **"+ New Token"**

**Configuration** :

| Champ | Valeur |
|-------|--------|
| **Name** | `npm-publish-token` |
| **Organization** | `TestAzure` (sélectionne ton organisation) |
| **Expiration (UTC)** | `90 days` (ou Custom si tu veux plus long) |
| **Scopes** | Clique sur **"Show all scopes"** en bas |

**Dans les scopes** :

1. Cherche **"Packaging"** dans la liste
2. Coche ✅ **"Read, write, & manage"**

Clique sur **"Create"**

### 4.3 ⚠️ IMPORTANT : Copier le token

**Une popup s'affiche avec ton token** :

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6...
```

**📝 COPIE CE TOKEN IMMÉDIATEMENT** et sauvegarde-le dans un fichier texte sécurisé !

⚠️ **Tu ne pourras JAMAIS le revoir** ! Si tu le perds, il faudra en créer un nouveau.

---

## 📝 Étape 5 : Préparer le package `@repo/shared`

### 5.1 Modifier `packages/shared/package.json`

**Ouvre le fichier** :

```bash
code packages/shared/package.json
```

**Remplace TOUT le contenu par** :

```json
{
  "name": "@testazure/shared",
  "version": "1.0.0",
  "private": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "prepublishOnly": "pnpm build"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  },
  "publishConfig": {
    "registry": "https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/"
  }
}
```

**⚠️ CHANGE l'URL** dans `publishConfig.registry` avec **ton URL** copiée à l'étape 3.3 !

**Changements importants** :
- `"name": "@testazure/shared"` → Nom du package publié
- `"private": false"` → Permet la publication
- `"files": ["dist/**/*"]` → Seul le dossier `dist/` est publié
- `"publishConfig"` → URL de ton feed Azure Artifacts

---

## 🔐 Étape 6 : Configurer l'authentification locale

### 6.1 Créer un fichier `.npmrc` à la racine du projet

**Créer le fichier** :

```bash
touch .npmrc
code .npmrc
```

**Ajouter** (remplace `VOTRE_PAT_ICI` par le token copié à l'étape 4.3) :

```
registry=https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/
always-auth=true

//pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/:_authToken=VOTRE_PAT_ICI
```

**⚠️ REMPLACE** :
- L'URL par la tienne (étape 3.3)
- `VOTRE_PAT_ICI` par ton PAT (étape 4.3)

### 6.2 Ajouter `.npmrc` au `.gitignore`

**IMPORTANT** : Ne jamais commit le `.npmrc` avec le PAT !

```bash
echo ".npmrc" >> .gitignore
```

---

## 🚀 Étape 7 : Publier le package

### 7.1 Build le package

```bash
cd packages/shared
pnpm build
```

**Résultat attendu** :
```
dist/
├── index.js
├── index.d.ts
├── types/
└── ...
```

### 7.2 Publier sur Azure Artifacts

```bash
npm publish
```

**Résultat attendu** :
```
npm notice
npm notice 📦  @testazure/shared@1.0.0
npm notice === Tarball Contents ===
npm notice 145B  package.json
npm notice 1.2kB dist/index.js
npm notice 523B  dist/index.d.ts
npm notice === Tarball Details ===
npm notice name:          @testazure/shared
npm notice version:       1.0.0
npm notice package size:  1.1 kB
npm notice unpacked size: 1.9 kB
npm notice shasum:        abc123...
npm notice integrity:     sha512-xyz...
npm notice total files:   3
npm notice
+ @testazure/shared@1.0.0
```

### 7.3 Vérifier sur Azure DevOps

1. Retourne sur **https://dev.azure.com/TestAzure**
2. Projet → **Artifacts**
3. Feed → **testazure-packages**
4. Tu devrais voir **@testazure/shared@1.0.0** dans la liste ! 🎉

---

## 🔄 Étape 8 : Modifier le backend pour utiliser le package

### 8.1 Modifier `apps/backend/package.json`

**Ouvre le fichier** :

```bash
code apps/backend/package.json
```

**Change la ligne** :

```json
{
  "dependencies": {
    "@testazure/shared": "^1.0.0",  // ← AVANT: "@repo/shared": "workspace:*"
    // ... autres dépendances
  }
}
```

### 8.2 Créer `apps/backend/.npmrc`

**Créer le fichier** :

```bash
touch apps/backend/.npmrc
code apps/backend/.npmrc
```

**Ajouter** :

```
@testazure:registry=https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/
always-auth=true
```

⚠️ **NE PAS mettre le PAT ici** ! On l'ajoutera dans GitHub Actions.

### 8.3 Réinstaller les dépendances

```bash
cd apps/backend

# Configurer l'authentification (temporaire pour tester)
echo "//pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/:_authToken=VOTRE_PAT" >> ~/.npmrc

# Réinstaller
pnpm install
```

**Résultat** : `@testazure/shared` est installé depuis Azure Artifacts ! ✅

### 8.4 Tester que ça marche

```bash
# Build le backend
pnpm build

# Si ça compile sans erreur, c'est bon !
```

---

## 🤖 Étape 9 : Configurer GitHub Actions

### 9.1 Ajouter le PAT aux secrets GitHub

1. **GitHub** → Ton repo → **Settings**
2. Menu gauche → **Secrets and variables** → **Actions**
3. Clique sur **"New repository secret"**

**Créer le secret** :

| Champ | Valeur |
|-------|--------|
| **Name** | `AZURE_ARTIFACTS_PAT` |
| **Secret** | Colle ton PAT (de l'étape 4.3) |

Clique sur **"Add secret"**

### 9.2 Modifier le workflow backend

**Ouvre** `.github/workflows/main_api-testazure-prod.yml`

**Trouve la section** `Install dependencies` et **remplace** par :

```yaml
      - name: Configure Azure Artifacts authentication
        run: |
          echo "//pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/:_authToken=${{ secrets.AZURE_ARTIFACTS_PAT }}" > ~/.npmrc
          echo "@testazure:registry=https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/" >> ~/.npmrc
          echo "always-auth=true" >> ~/.npmrc

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

### 9.3 (Optionnel) Automatiser la publication de `shared`

**Créer** `.github/workflows/publish-shared.yml` :

```yaml
name: Publish Shared Package

on:
  push:
    branches:
      - main
    paths:
      - 'packages/shared/**'
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.x'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared package
        run: pnpm --filter @testazure/shared build

      - name: Configure Azure Artifacts
        run: |
          echo "//pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/:_authToken=${{ secrets.AZURE_ARTIFACTS_PAT }}" > ~/.npmrc
          echo "registry=https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/" >> ~/.npmrc
          echo "always-auth=true" >> ~/.npmrc

      - name: Publish to Azure Artifacts
        run: |
          cd packages/shared
          npm publish
```

---

## ✅ Étape 10 : Tester le déploiement complet

### 10.1 Commit et push

```bash
git add .
git commit -m "feat: Migrate @repo/shared to Azure Artifacts"
git push origin main
```

### 10.2 Vérifier GitHub Actions

1. **GitHub** → Onglet **"Actions"**
2. Tu devrais voir le workflow **"Build and deploy Node.js app to Azure Web App"** démarrer
3. Attendre qu'il soit ✅ vert

### 10.3 Vérifier Azure

1. Logs Azure → Web App → **Log stream**
2. Tu devrais voir :
   ```
   === Starting deployment script ===
   Generating Prisma Client...
   ✔ Generated Prisma Client
   Starting Fastify server...
   Server listening on 0.0.0.0:8080
   ```

### 10.4 Tester l'API

```bash
curl https://api-testazure-prod.azurewebsites.net/health
```

**Résultat attendu** :
```json
{"status":"ok","timestamp":"2025-11-16T..."}
```

---

## 🎉 C'est terminé !

### ✅ Ce qu'on a accompli

- ✅ Feed Azure Artifacts créé
- ✅ `@testazure/shared` publié comme package npm privé
- ✅ Backend utilise le package depuis Azure Artifacts
- ✅ Plus de problème de symlinks !
- ✅ Déploiement automatisé

### 🔄 Workflow de développement futur

**Quand tu modifies `packages/shared`** :

```bash
cd packages/shared

# 1. Faire tes modifications
# ...

# 2. Incrémenter la version
npm version patch  # 1.0.0 → 1.0.1

# 3. Build
pnpm build

# 4. Publier
npm publish

# 5. Mettre à jour le backend
cd ../apps/backend
# Modifier package.json: "@testazure/shared": "^1.0.1"
pnpm install

# 6. Commit
git add .
git commit -m "chore: Update @testazure/shared to 1.0.1"
git push
```

---

## 💡 Aide-mémoire des URLs importantes

| Resource | URL |
|----------|-----|
| **Azure DevOps** | https://dev.azure.com/TestAzure |
| **Feed Artifacts** | https://dev.azure.com/TestAzure/TestAzure/_artifacts |
| **Registry URL** | https://pkgs.dev.azure.com/TestAzure/_packaging/testazure-packages/npm/registry/ |
| **PAT Management** | https://dev.azure.com/TestAzure/_usersSettings/tokens |

---

## 🆘 Problèmes fréquents

### "Unable to authenticate" lors de `npm publish`

**Solution** : Vérifie que ton PAT est bien dans `~/.npmrc` et qu'il n'a pas expiré.

```bash
cat ~/.npmrc  # Vérifier
```

### "Package name must start with @scope"

**Solution** : Dans `package.json`, le nom doit être `@testazure/shared` (pas juste `shared`).

### "Conflict: Package version already exists"

**Solution** : Incrémente la version dans `package.json` avant de publier.

```bash
npm version patch  # 1.0.0 → 1.0.1
npm publish
```

---

**Auteur** : Fab
**Date** : 2025-11-16
**Version** : 1.0
