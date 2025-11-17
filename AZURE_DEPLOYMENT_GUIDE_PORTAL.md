# 🖱️ Guide de Déploiement Azure - Interface Portail Web

## 📋 Vue d'ensemble

Ce guide te montre comment déployer une application **monorepo pnpm** (Next.js + Fastify + packages partagés) sur Azure, entièrement depuis le portail web, **sans ligne de commande** !

### Architecture finale

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD                               │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Static Web App   │──────│  App Service     │            │
│  │ (Next.js)        │ CORS │  (Fastify API)   │            │
│  │ 0€/mois          │      │  ~13€/mois       │            │
│  └──────────────────┘      └────────┬─────────┘            │
│                                     │                        │
│                            ┌────────▼─────────┐             │
│                            │   PostgreSQL     │             │
│                            │   ~20€/mois      │             │
│                            └──────────────────┘             │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Azure DevOps - Artifacts Feed                   │      │
│  │  @mcigroupfrance/testazure-shared (npm privé)    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘

       ▲                                   ▲
       │                                   │
       │  GitHub Actions                   │
       │  (CI/CD automatique)              │
       │                                   │
   ┌───┴──────────────────────────────────┴───┐
   │         GitHub Repository                 │
   │  - apps/frontend/                         │
   │  - apps/backend/                          │
   │  - packages/shared/  ────────────────────►│
   └───────────────────────────────────────────┘
            (Published to Azure Artifacts)
```

**URL du portail** : https://portal.azure.com

---

## 🎯 Prérequis

### 1. Compte Azure

- Aller sur : https://azure.microsoft.com/free/
- Créer un compte (gratuit)
- 200€ de crédit pendant 30 jours
- Carte bancaire nécessaire (mais pas de débit automatique)

### 2. Compte Azure DevOps

- Aller sur : https://dev.azure.com
- Se connecter avec le **même compte Microsoft** qu'Azure
- Gratuit pour jusqu'à 5 utilisateurs

### 3. Repository GitHub

- Ton projet doit être sur GitHub (pour le déploiement automatique)
- Repository public ou privé (les deux fonctionnent)

### 4. Structure de projet (monorepo pnpm)

```
ton-projet/
├── apps/
│   ├── backend/          # API Fastify
│   └── frontend/         # App Next.js
├── packages/
│   └── shared/           # Schémas Zod partagés
├── package.json
├── pnpm-workspace.yaml
└── .github/
    └── workflows/        # GitHub Actions (créés automatiquement)
```

---

## 🗂️ Étape 0 : Se connecter et créer un Resource Group

### 0.1 Connexion au portail

1. Aller sur https://portal.azure.com
2. Se connecter avec ton compte Microsoft
3. Tu arrives sur le **Dashboard Azure**

### 0.2 Créer un Resource Group

**Qu'est-ce qu'un Resource Group ?**
Un dossier qui contient toutes les ressources de ton projet (base de données, serveurs, etc.)

**Étapes** :

1. Dans la barre de recherche en haut, taper **"Resource groups"**
2. Cliquer sur **"Resource groups"** dans les résultats
3. Cliquer sur **"+ Create"** (en haut à gauche)

**Configuration** :

- **Subscription** : Sélectionner ta souscription (ex: "Pay-As-You-Go" ou "Free Trial")
- **Resource group name** : `rg-testazure-prod`
- **Region** : `West Europe` (serveurs en Europe de l'Ouest)

4. Cliquer sur **"Review + Create"**
5. Cliquer sur **"Create"**

✅ **Résultat** : Ton Resource Group est créé !

---

## 🗄️ Étape 1 : Déployer PostgreSQL Database

### 1.1 Créer le serveur PostgreSQL

1. Dans la barre de recherche, taper **"Azure Database for PostgreSQL"**
2. Cliquer sur **"Azure Database for PostgreSQL flexible servers"**
3. Cliquer sur **"+ Create"**

### 1.2 Configuration du serveur

**Onglet "Basics"** :

**Project details** :

- **Subscription** : Ta souscription
- **Resource group** : `rg-testazure-prod` (sélectionner celui créé)

**Server details** :

- **Server name** : `psql-testazure-prod` (doit être unique mondialement)
- **Region** : `West Europe`
- **PostgreSQL version** : `16` (la plus récente)
- **Workload type** : `Development` (pour commencer, moins cher)

**Authentication** :

- **Authentication method** : `PostgreSQL authentication only`
- **Admin username** : `azureadmin`
- **Password** : Créer un mot de passe fort (note-le bien !)
  - Ex: `TestAzure2025!`
- **Confirm password** : Répéter le mot de passe

**Onglet "Networking"** :

**Connectivity method** :

- Sélectionner : ☑️ **"Public access (allowed IP addresses)"**

⚠️ **TRÈS IMPORTANT - Firewall rules** :

- **OBLIGATOIRE** : Cocher ☑️ **"Allow public access from any Azure service within Azure to this server"**
  - Sans cette case, ta Web App Azure **ne pourra pas** se connecter à PostgreSQL !
  - Cette règle autorise uniquement les services Azure (pas Internet en général)
- Cocher ☑️ **"Add current client IP address"** (pour te connecter depuis ton PC)

**Onglet "Tags"** (optionnel) :

- **Name** : `Environment` | **Value** : `Production`
- **Name** : `Project` | **Value** : `TestAzure`

**Onglet "Review + create"** :

4. Vérifier le récapitulatif (surtout le coût estimé : ~20€/mois)
5. Cliquer sur **"Create"**

⏳ **Attendre 5-10 minutes** que le déploiement se termine.

### 1.3 Créer la base de données

Une fois le serveur créé :

1. Cliquer sur **"Go to resource"**
2. Dans le menu de gauche, cliquer sur **"Databases"**
3. Cliquer sur **"+ Add"**
4. **Database name** : `testazure`
5. Cliquer sur **"Save"**

✅ **Résultat** : La base de données est créée !

### 1.4 Récupérer la connection string

1. Toujours sur la page du serveur PostgreSQL
2. Dans le menu de gauche, cliquer sur **"Connect"**
3. Tu verras un bloc **"Connection strings"**
4. Copier la connection string (format : `postgresql://...`)

**Format** :

```
postgresql://azureadmin:VOTRE_MOT_DE_PASSE@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require
```

⚠️ **Remplacer** `VOTRE_MOT_DE_PASSE` par ton mot de passe !

📝 **Sauvegarder cette connection string** dans un fichier texte temporaire.

### 1.5 Exécuter les migrations Prisma

**Option A : Depuis ton PC (recommandé)**

```bash
# Dans apps/backend/

# 1. Créer .env.azure avec la connection string
echo 'DATABASE_URL="postgresql://azureadmin:TestAzure2025!@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require"' > .env.azure

# 2. Exécuter les migrations
dotenv -e .env.azure -- pnpm prisma migrate deploy

# 3. Seed les données (optionnel)
dotenv -e .env.azure -- pnpm prisma:seed
```

**Option B : Via Prisma Studio (plus tard)**

✅ **Checkpoint** : PostgreSQL est prêt !

---

## 📦 Étape 2 : Configurer Azure Artifacts (Package npm privé)

### Pourquoi Azure Artifacts ?

**Problème** : Azure casse les symlinks des workspaces pnpm lors du déploiement.
**Solution** : Publier `packages/shared/` comme package npm privé sur Azure Artifacts.

**Avantages** :

- ✅ Pas de problème de symlinks
- ✅ Déploiement plus rapide (~10-20 MB au lieu de 900 MB)
- ✅ Dev local reste identique (workspace pnpm)
- ✅ Versioning du package

### 2.1 Créer l'organisation Azure DevOps

1. Aller sur https://dev.azure.com
2. Se connecter avec ton compte Microsoft (le même qu'Azure)
3. Cliquer sur **"Create new organization"** ou **"New organization"**
4. **Organisation name** : `mcigroupfrance` (ou ton nom d'organisation)
   - ⚠️ Utilise un nom général réutilisable pour tous tes projets
5. **Region** : `West Europe` (ou proche de toi)
6. Cliquer sur **"Continue"**

✅ **Résultat** : Organisation créée !

### 2.2 Créer un projet

1. Tu es redirigé vers la page de création de projet
2. **Project name** : `TestAzure` (nom de ce projet)
3. **Description** : "Test deployment Azure with monorepo"
4. **Visibility** : `Private`
5. Cliquer sur **"Create project"**

✅ **Résultat** : Projet créé !

### 2.3 Créer le Feed Azure Artifacts

1. Dans ton projet `TestAzure`, menu de gauche : **"Artifacts"** (icône de boîte)
2. Cliquer sur **"Create Feed"** ou **"+ Create Feed"**

**Configuration** :

- **Name** : `testazure-package` (nom du feed)
- **Visibility** :
  - ☑️ **"Members of [organization]"** (accessible à tous les membres de ton organisation)
  - Ou **"Private"** si tu veux limiter l'accès
- **Upstream sources** :
  - ☑️ Cocher **"Include packages from common public sources"**
  - Permet d'utiliser npmjs.com comme fallback
- **Scope** : `Organization`

3. Cliquer sur **"Create"**

✅ **Résultat** : Feed créé !

**URL du feed** :

```
https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/
```

📝 **Note cette URL** pour plus tard !

### 2.4 Générer un Personal Access Token (PAT)

1. En haut à droite, cliquer sur ton **avatar/icône utilisateur**
2. Cliquer sur **"Personal access tokens"** ou **"Security"**
3. Cliquer sur **"+ New Token"**

**Configuration** :

- **Name** : `GitHub Actions - TestAzure Packages`
- **Organization** : `mcigroupfrance`
- **Expiration** : `90 days` (ou Custom si tu veux plus long)
- **Scopes** : Cliquer sur **"Show all scopes"** en bas
  - Chercher **"Packaging"**
  - Cocher ☑️ **"Read"** (pour installer)
  - Cocher ☑️ **"Write"** (pour publier)

4. Cliquer sur **"Create"**

⚠️ **IMPORTANT** : Copie le token qui s'affiche et **garde-le précieusement** quelque part !

**Format du token** :

```
abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

📝 **Tu en auras besoin pour** :

- Publier manuellement le package (première fois)
- Configurer GitHub Actions

### 2.5 Préparer le package `shared` pour publication

**1. Modifier `packages/shared/package.json`** :

```json
{
  "name": "@mcigroupfrance/testazure-shared",
  "version": "1.0.0",
  "private": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  },
  "publishConfig": {
    "registry": "https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/"
  }
}
```

**Changements** :

- ✅ `name`: `@mcigroupfrance/testazure-shared` (scope = organisation)
- ✅ `version`: `1.0.0` (version initiale)
- ✅ `private`: `false` (permet la publication)
- ✅ `publishConfig`: URL du feed Azure Artifacts

**2. Créer `.npmrc` du projet (à la racine)** :

```bash
# .npmrc (racine du projet)
@mcigroupfrance:registry=https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/
always-auth=true
```

⚠️ **Ce fichier doit être commité dans Git** (pas de secret dedans).

**3. Créer `.npmrc` user (dans ton home directory)** :

```bash
# ~/.npmrc (dans /Users/toi/ ou C:\Users\toi\)

; begin auth token
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:username=mcigroupfrance
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:_password=[BASE64_ENCODED_TOKEN]
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:email=ton-email@example.com
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:username=mcigroupfrance
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:_password=[BASE64_ENCODED_TOKEN]
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:email=ton-email@example.com
; end auth token
```

**Encoder ton token en Base64** :

```bash
# Sur macOS/Linux
echo -n "ton_token_azure" | base64

# Sur Windows PowerShell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("ton_token_azure"))
```

Remplace `[BASE64_ENCODED_TOKEN]` par le résultat (les **deux occurrences**).

⚠️ **Ce fichier NE DOIT PAS être commité** (secret personnel).

**4. Ajouter `.npmrc` au .gitignore** :

```bash
# .gitignore
.npmrc
```

**5. Créer `.npmrc.example` (template pour les autres devs)** :

```bash
# .npmrc.example (à commiter)
@mcigroupfrance:registry=https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/
always-auth=true

; begin auth token
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:username=mcigroupfrance
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:email=ton-email@example.com
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:username=mcigroupfrance
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:email=ton-email@example.com
; end auth token
```

### 2.6 Publier le package (première fois)

```bash
# Dans packages/shared/

# 1. Build
pnpm build

# 2. Publish
npm publish
```

**Résultat attendu** :

```
+ @mcigroupfrance/testazure-shared@1.0.0
```

✅ **Vérification** :

1. Aller sur Azure DevOps → Artifacts → testazure-package
2. Tu verras `@mcigroupfrance/testazure-shared` version 1.0.0

### 2.7 Comprendre le workflow dev local vs production

**En développement local** :

- Tu continues à utiliser `@repo/shared` via workspace pnpm
- Les imports TypeScript restent `import { ... } from '@repo/shared'`
- `packages/shared/package.json` contient les deux noms :
  - Pour la publication : `@mcigroupfrance/testazure-shared`
  - Pour le workspace : symlink géré par pnpm
- **Aucun changement pour les développeurs** ✅

**Au déploiement Azure (GitHub Actions)** :

- Le workflow publie automatiquement `@mcigroupfrance/testazure-shared` sur Azure Artifacts
- Le workflow remplace `"@repo/shared": "workspace:*"` par `"@mcigroupfrance/testazure-shared": "^1.0.0"` dans `package.json`
- Le workflow remplace les imports `@repo/shared` par `@mcigroupfrance/testazure-shared` dans le code TypeScript
- Le backend s'installe avec `npm install` depuis Azure Artifacts
- **Tout est automatique** ✅

---

## 🖥️ Étape 3 : Déployer le Backend (Fastify)

### 3.1 Créer l'App Service (Web App)

1. Dans la barre de recherche, taper **"App Services"**
2. Cliquer sur **"App Services"**
3. Cliquer sur **"+ Create"**
4. Sélectionner **"Web App"**

### 3.2 Configuration de la Web App

**Onglet "Basics"** :

**Project Details** :

- **Subscription** : Ta souscription
- **Resource Group** : `rg-testazure-prod`

**Instance Details** :

- **Name** : `api-testazure-prod` (doit être unique mondialement)
- **Publish** : `Code` (pas Docker pour le moment)
- **Runtime stack** : `Node 22 LTS`
- **Operating System** : `Linux`
- **Region** : `West Europe`

**Pricing plans** :

Cliquer sur **"Explore pricing plans"**

**Pour débuter (moins cher)** :

- Sélectionner **"Basic B1"** : ~13€/mois (1 vCore, 1.75GB RAM)

**Pour production** :

- Sélectionner **"Standard S1"** : ~75€/mois (staging slots, autoscale)

Cliquer sur **"Select"**

**Onglet "Deployment"** :

**GitHub Actions settings** :

- **Continuous deployment** : Cocher ☑️ **"Enable"**
- **GitHub account** : Se connecter à GitHub
- **Organization** : Ton compte GitHub
- **Repository** : Sélectionner `TestAzure`
- **Branch** : `main`

⚠️ **Note** : Azure va créer automatiquement un workflow GitHub Actions !

**Onglet "Monitoring"** :

- **Enable Application Insights** : Cocher ☑️ **"Yes"**
- **Application Insights** : Créer nouveau → `appi-testazure-prod`

**Onglet "Tags"** (optionnel) :

- **Name** : `Environment` | **Value** : `Production`

**Onglet "Review + create"** :

4. Vérifier le récapitulatif
5. Cliquer sur **"Create"**

⏳ **Attendre 2-3 minutes** que le déploiement se termine.

### 3.3 Configurer les variables d'environnement

Une fois la Web App créée :

1. Cliquer sur **"Go to resource"**
2. Dans le menu de gauche, chercher **"Settings"** → **"Environment variables"**
3. Cliquer sur l'onglet **"App settings"**
4. Cliquer sur **"+ Add"** pour chaque variable

**Variables à ajouter** :

| Name                             | Value                                                                                                                   | Description                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`                   | `postgresql://azureadmin:TestAzure2025!@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require` | Connection string PostgreSQL                         |
| `JWT_SECRET`                     | `[générer 32 caractères aléatoires]`                                                                                    | Secret pour signer les tokens JWT                    |
| `NODE_ENV`                       | `production`                                                                                                            | Environnement Node.js                                |
| `PORT`                           | `8080`                                                                                                                  | Port d'écoute de l'app                               |
| `WEBSITES_PORT`                  | `8080`                                                                                                                  | Port que Azure doit exposer                          |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false`                                                                                                                 | Désactive le build Azure (on utilise GitHub Actions) |

**Générer un JWT_SECRET** :

- Aller sur : https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
- Copier la chaîne générée

5. Cliquer sur **"Apply"** en bas
6. Cliquer sur **"Confirm"** dans la popup

⚠️ **Variables OBSOLÈTES (ne plus utiliser)** :

- `WEBSITE_NODE_MODULES_USE_TARBALL` - N'est plus nécessaire avec Azure Artifacts

### 3.4 Créer le script de démarrage

⚠️ **IMPORTANT** : Azure exclut les dossiers cachés (comme `.prisma/`) lors du déploiement. Il faut régénérer le Prisma Client au démarrage.

**1. Créer `apps/backend/startup.sh`** :

```bash
#!/bin/sh
echo "=== Starting deployment script ==="
echo "Generating Prisma Client..."

# Use node directly to avoid permission issues with npx
node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

echo "Prisma Client generated successfully!"
echo "Starting Fastify server..."
node dist/server.js
```

**Pourquoi ce script ?**

- Azure compresse `node_modules` avec `tar -zcf node_modules.tar.gz *`
- Le wildcard `*` exclut les dossiers cachés comme `.prisma/`, `.bin/`, `.pnpm/`
- On régénère donc Prisma Client à chaque démarrage

**2. Rendre le script exécutable** :

```bash
chmod +x apps/backend/startup.sh
```

**3. Commit et push** :

```bash
git add apps/backend/startup.sh
git commit -m "Add startup script for Prisma generation"
git push origin main
```

### 3.5 Configurer le démarrage dans Azure

1. Dans le menu de gauche, aller dans **"Settings"** → **"Configuration"**
2. Onglet **"General settings"**
3. **Startup Command** : `bash startup.sh`
4. Cliquer sur **"Save"** en haut

### 3.6 Préparer le backend pour le déploiement

**IMPORTANT : Modifications à faire dans le code**

**1. Modifier `apps/backend/src/server.ts`** :

```typescript
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    // ⚠️ IMPORTANT : host doit être '0.0.0.0' pour Azure
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
```

**2. Modifier `apps/backend/package.json`** :

Ajouter/vérifier ces scripts :

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --build",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "postinstall": "prisma generate"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**3. Commit et push sur GitHub** :

```bash
git add .
git commit -m "Configure backend for Azure deployment"
git push origin main
```

---

## ⚙️ Étape 4 : Configurer le Workflow GitHub Actions

Azure a créé automatiquement un workflow lors de la création de la Web App, **mais il faut le modifier** pour intégrer Azure Artifacts.

### 4.1 Ajouter le secret Azure Artifacts Token

1. Aller sur GitHub → Ton repo → **Settings** → **Secrets and variables** → **Actions**
2. Cliquer sur **"New repository secret"**
3. **Name** : `AZURE_ARTIFACTS_TOKEN`
4. **Secret** : Coller ton **token encodé en Base64** (celui du `~/.npmrc`)
5. Cliquer sur **"Add secret"**

### 4.2 Modifier le workflow

Le workflow se trouve dans `.github/workflows/main_api-testazure-prod.yml`.

**Workflow complet** :

```yaml
name: Build and deploy Node.js app to Azure Web App - api-testazure-prod

on:
  push:
    branches:
      - main
    paths:
      - "apps/backend/**"
      - "packages/shared/**"
      - ".github/workflows/main_api-testazure-prod.yml"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js version
        uses: actions/setup-node@v3
        with:
          node-version: "22.x"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Install dependencies for building
        run: pnpm install --frozen-lockfile

      - name: Build and publish shared package to Azure Artifacts
        run: |
          cd packages/shared
          pnpm build

          # Configure npm authentication for Azure Artifacts
          echo "@mcigroupfrance:registry=https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/" > .npmrc
          echo "always-auth=true" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:username=mcigroupfrance" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:_password=${{ secrets.AZURE_ARTIFACTS_TOKEN }}" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:email=ci@github.com" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:username=mcigroupfrance" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:_password=${{ secrets.AZURE_ARTIFACTS_TOKEN }}" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:email=ci@github.com" >> .npmrc

          # Increment version to next patch
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          echo "Current version: $CURRENT_VERSION"
          npm version patch --no-git-tag-version
          NEW_VERSION=$(node -p "require('./package.json').version")
          echo "New version: $NEW_VERSION"

          # Try to publish, ignore error if version already exists
          npm publish || echo "⚠️ Package already published or publish failed, continuing..."

      - name: Prepare backend for Azure deployment
        run: |
          cd apps/backend

          # Replace @repo/shared workspace dependency with published package in package.json
          sed -i 's/"@repo\/shared": "workspace:\*"/"@mcigroupfrance\/testazure-shared": "^1.0.0"/g' package.json

          # Replace @repo/shared imports in source code
          find src -type f -name "*.ts" -exec sed -i "s/@repo\/shared/@mcigroupfrance\/testazure-shared/g" {} +

          echo "Updated package.json:"
          cat package.json | grep -A 2 -B 2 "testazure-shared"

          # Configure npm authentication for installing from Azure Artifacts
          echo "@mcigroupfrance:registry=https://pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/" > .npmrc
          echo "always-auth=true" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:username=mcigroupfrance" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:_password=${{ secrets.AZURE_ARTIFACTS_TOKEN }}" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/registry/:email=ci@github.com" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:username=mcigroupfrance" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:_password=${{ secrets.AZURE_ARTIFACTS_TOKEN }}" >> .npmrc
          echo "//pkgs.dev.azure.com/mcigroupfrance/testazure/_packaging/testazure-package/npm/:email=ci@github.com" >> .npmrc

          # Install ALL dependencies (not just production - we need devDependencies for build)
          rm -rf node_modules
          npm install

          # Generate Prisma Client
          npx prisma generate

          # Build backend
          npm run build

          # Remove devDependencies after build
          npm prune --production

          # Make startup.sh executable
          chmod +x startup.sh

          echo "✅ Backend prepared with @mcigroupfrance/testazure-shared from Azure Artifacts"

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: node-app
          path: apps/backend/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: "Production"
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: node-app

      - name: "Deploy to Azure Web App"
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: "api-testazure-prod"
          slot-name: "Production"
          package: .
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_xxx }}
```

### 4.3 Explication détaillée du workflow

**Job 1 : Build**

1. **Checkout du code** : `actions/checkout@v4`

   - Récupère le code du repo

2. **Setup Node.js 22** : `actions/setup-node@v3`

   - Configure la version de Node.js

3. **Install pnpm** : `pnpm/action-setup@v2`

   - Installe pnpm version 10.20.0

4. **Install dependencies** : `pnpm install --frozen-lockfile`

   - Installe toutes les dépendances du monorepo avec workspaces

5. **Build and publish shared package**

   - `pnpm build` : Compile `packages/shared/` → génère `dist/`
   - Configure `.npmrc` avec le token Azure Artifacts
   - `npm version patch` : Incrémente la version (1.0.0 → 1.0.1 → 1.0.2...)
   - `npm publish` : Publie sur Azure Artifacts
   - Continue même si la publication échoue (version déjà existante)

6. **Prepare backend for Azure**

   - **Replacement package.json** : `sed` remplace `"@repo/shared": "workspace:*"` par `"@mcigroupfrance/testazure-shared": "^1.0.0"`
   - **Replacement imports** : `sed` remplace tous les `@repo/shared` par `@mcigroupfrance/testazure-shared` dans `src/*.ts`
   - **Configure .npmrc** : Pour télécharger depuis Azure Artifacts
   - **npm install** : Installe toutes les dépendances (y compris devDependencies)
   - **Prisma generate** : Génère le Prisma Client
   - **npm run build** : Compile le backend TypeScript
   - **npm prune --production** : Supprime les devDependencies (pour réduire la taille)
   - **chmod +x startup.sh** : Rend le script exécutable

7. **Upload artifact** : `actions/upload-artifact@v4`
   - Upload `apps/backend/` complet pour le job deploy

**Job 2 : Deploy**

1. **Download artifact** : Récupère l'artefact du job build
2. **Deploy to Azure** : Déploie sur Azure Web App avec `azure/webapps-deploy@v3`

### 4.4 Versioning automatique du package

**Comment fonctionne le versioning ?**

- À chaque déploiement, `npm version patch` incrémente la version "patch" (dernier chiffre)
- `1.0.0` → `1.0.1` → `1.0.2` → ...
- Le `^1.0.0` dans le backend signifie "n'importe quelle version 1.0.x"
- `npm install` prendra automatiquement la **dernière version compatible**

**Changer manuellement la version** :

Si tu veux passer à `1.1.0` (nouvelle feature) ou `2.0.0` (breaking change) :

1. Modifier `packages/shared/package.json` : `"version": "1.1.0"`
2. Commit et push
3. Le prochain déploiement publiera `1.1.0`
4. Ensuite auto-increment : `1.1.1`, `1.1.2`, etc.

### 4.5 Tester le déploiement

**Voir le déploiement en cours** :

1. Aller sur GitHub → Ton repo → Onglet **"Actions"**
2. Tu verras le workflow en cours d'exécution
3. Attendre qu'il soit ✅ vert (~5-10 minutes)

### 4.6 Tester l'API

1. Retourner sur le portail Azure → Ta Web App
2. En haut à droite, cliquer sur **"Browse"** (ou **"URL"**)
3. Ajouter `/health` à l'URL : `https://api-testazure-prod.azurewebsites.net/health`

✅ **Résultat attendu** : `{"status":"ok"}`

**Tester le login** :

Ouvrir un terminal :

```bash
curl -X POST https://api-testazure-prod.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

✅ **Résultat** : Tu devrais recevoir un token JWT !

---

## 🌐 Étape 5 : Déployer le Frontend (Next.js)

### 5.1 Préparer Next.js pour le déploiement

**Modifications à faire dans le code**

**1. Modifier `apps/frontend/next.config.ts` (ou `next.config.mjs`)** :

```typescript
// apps/frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ⚠️ IMPORTANT pour Static Web Apps
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

**ℹ️ Note** : Les deux formats fonctionnent :

- `next.config.ts` (TypeScript) - **Recommandé** pour le typage
- `next.config.mjs` (JavaScript ES Module) - Aussi valide

**2. ⚠️ NE PAS créer de fichier `.env.production`**

Contrairement à une configuration classique, **n'utilise PAS de fichier `.env.production`** car :

- ✅ Ce fichier serait bloqué par le `.gitignore`
- ✅ Il ne serait jamais disponible dans GitHub Actions
- ✅ Les variables d'environnement Azure Static Web App (dans le Portail) ne fonctionnent **pas** pour les variables `NEXT_PUBLIC_*` avec export statique

**Pourquoi ?**

- Next.js avec `output: 'export'` génère du HTML/JS/CSS statique
- Les variables `NEXT_PUBLIC_*` sont **inlinées au BUILD TIME** (dans GitHub Actions)
- Les variables du Portail Azure sont pour le **RUNTIME** (serveur) → mais export statique = pas de serveur !
- **C'est exactement le même problème que Vite avec Azure** 🎯

**Solution : Utiliser GitHub Secrets** (voir étape 5.2)

**3. Commit et push** :

```bash
git add .
git commit -m "Configure frontend for Azure Static Web Apps"
git push origin main
```

### 5.2 Configurer la variable d'environnement dans GitHub

**1. Créer un GitHub Secret** :

1. Aller sur GitHub → Ton repo → **Settings** → **Secrets and variables** → **Actions**
2. Cliquer sur **"New repository secret"**
3. **Name** : `NEXT_PUBLIC_API_URL`
4. **Secret** : `https://api-testazure-prod.azurewebsites.net`
5. Cliquer sur **"Add secret"**

**Pourquoi un secret ?**

- Bien que l'URL de l'API soit publique, utiliser un secret permet de :
  - ✅ Changer l'URL facilement sans modifier le code
  - ✅ Avoir des URLs différentes par environnement (staging, prod)
  - ✅ Séparer la configuration du code (bonne pratique)

**2. Le workflow utilisera cette variable** :

Lors de la création de la Static Web App (étape 5.3), Azure générera automatiquement un workflow GitHub Actions. **Après la création**, tu devras modifier ce workflow pour ajouter la variable d'environnement au build.

### 5.3 Créer la Static Web App

1. Dans la barre de recherche du portail Azure, taper **"Static Web Apps"**
2. Cliquer sur **"Static Web Apps"**
3. Cliquer sur **"+ Create"**

### 5.4 Configuration de la Static Web App

**Onglet "Basics"** :

**Project Details** :

- **Subscription** : Ta souscription
- **Resource group** : `rg-testazure-prod`

**Static Web App details** :

- **Name** : `swa-testazure-prod`
- **Plan type** : `Free` (0€/mois, largement suffisant)
- **Region for Azure Functions API** : `West Europe`

**Deployment details** :

**Source** : `GitHub`

1. Cliquer sur **"Sign in with GitHub"**
2. Autoriser Azure

**Build Details** :

- **Organization** : Ton compte GitHub
- **Repository** : `TestAzure`
- **Branch** : `main`

**Build Presets** : `Next.js`

**App location** : `/apps/frontend`
**Api location** : (laisser vide)
**Output location** : `out`

**Onglet "Tags"** (optionnel) :

- **Name** : `Environment` | **Value** : `Production`

**Onglet "Review + create"** :

4. Vérifier le récapitulatif (Free = 0€)
5. Cliquer sur **"Create"**

⏳ **Attendre 1-2 minutes**.

### 5.5 Modifier le workflow généré par Azure

**⚠️ IMPORTANT** : Azure a créé automatiquement un workflow GitHub Actions, **mais il faut le modifier** pour ajouter la variable d'environnement `NEXT_PUBLIC_API_URL`.

**1. Trouver le fichier workflow** :

Le workflow se trouve dans `.github/workflows/azure-static-web-apps-xxx.yml` (le nom exact varie).

**2. Modifier le workflow** :

Trouve la section `Build And Deploy` et ajoute `env:` **avant** la ligne `with:` :

```yaml
- name: Build And Deploy
  id: builddeploy
  uses: Azure/static-web-apps-deploy@v1
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_xxx }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/apps/frontend"
    api_location: ""
    output_location: "out"
```

**Explication** :

- La section `env:` rend la variable `NEXT_PUBLIC_API_URL` disponible pendant le build
- Next.js lira cette variable et l'inlinera dans le JavaScript généré
- L'URL de ton API sera donc "bakée" dans le bundle final

**3. Commit et push** :

```bash
git add .github/workflows/azure-static-web-apps-xxx.yml
git commit -m "Add NEXT_PUBLIC_API_URL to frontend workflow"
git push origin main
```

### 5.6 Déploiement automatique

**Ce qui se passe** :

1. Azure a créé automatiquement le fichier `.github/workflows/azure-static-web-apps-xxx.yml`
2. Ce workflow se déclenche à chaque push sur `main`
3. Le frontend est automatiquement buildé et déployé avec `NEXT_PUBLIC_API_URL`

**Voir le déploiement** :

1. Aller sur GitHub → Ton repo → Onglet **"Actions"**
2. Tu verras un nouveau workflow (Static Web Apps)
3. Attendre qu'il soit ✅ vert (~5 minutes)

### 5.7 Tester le frontend

1. Retourner sur le portail Azure → Ta Static Web App
2. Dans l'aperçu, tu verras l'**URL** : `https://xxx.azurestaticapps.net`
3. Cliquer dessus pour ouvrir l'application

✅ **Résultat** : Ton frontend est en ligne !

**Tester le login** :

- Email : `admin@test.com`
- Password : `password123`

---

## 🔒 Étape 6 : Sécurité et CORS

### 6.1 Configurer CORS sur le backend

**Problème** : Le frontend ne peut pas appeler l'API (erreur CORS)

**Solution** :

**1. Modifier `apps/backend/src/server.ts`** :

```typescript
import cors from "@fastify/cors";

// Enregistrer CORS avec l'URL du frontend
await server.register(cors, {
  origin: [
    "http://localhost:3000", // Dev local
    "https://xxx.azurestaticapps.net", // ⚠️ Remplacer par ton URL !
  ],
  credentials: true,
});
```

**2. Commit et push** :

```bash
git add .
git commit -m "Configure CORS for frontend"
git push origin main
```

GitHub Actions va automatiquement redéployer le backend ! ✅

### 6.2 Vérifier que tout fonctionne

1. Ouvrir le frontend : `https://xxx.azurestaticapps.net`
2. Tester le login
3. Créer un provider
4. Tester la recherche

✅ **Si tout fonctionne** : Félicitations, ton app est déployée ! 🎉

---

## 📊 Étape 7 : Monitoring (optionnel mais recommandé)

### 7.1 Voir les logs du backend

1. Aller sur Azure Portal → Ta Web App (`api-testazure-prod`)
2. Dans le menu de gauche : **"Monitoring"** → **"Log stream"**
3. Tu verras les logs en temps réel

### 7.2 Voir les métriques

1. Toujours dans ta Web App
2. Menu de gauche : **"Monitoring"** → **"Metrics"**
3. Tu peux voir : CPU, Memory, Requests, Response time, etc.

### 7.3 Application Insights (monitoring avancé)

1. Menu de gauche : **"Monitoring"** → **"Application Insights"**
2. Cliquer sur ton Application Insights (`appi-testazure-prod`)
3. Tu auras accès à :
   - **Live Metrics** : métriques en temps réel
   - **Failures** : erreurs et exceptions
   - **Performance** : temps de réponse des API
   - **Users** : nombre d'utilisateurs connectés

---

## 💰 Coûts estimés mensuels

| Service                    | Configuration            | Coût             |
| -------------------------- | ------------------------ | ---------------- |
| **Static Web Apps**        | Free tier                | 0€               |
| **Web App (Backend)**      | Basic B1                 | ~13€             |
| **PostgreSQL**             | Burstable B1ms           | ~20€             |
| **Application Insights**   | Basic (1GB/mois gratuit) | 0-5€             |
| **Azure DevOps Artifacts** | 2GB gratuits             | 0€               |
| **Bandwidth**              | 5GB gratuits             | 0-2€             |
| **TOTAL**                  |                          | **~35-40€/mois** |

**Notes** :

- Premier mois gratuit avec les 200€ de crédit
- Tu peux arrêter les ressources pour ne pas payer
- Les services Free tier sont vraiment gratuits
- Azure Artifacts : 2GB gratuits, puis ~2€/GB supplémentaire

---

## 🛑 Comment arrêter les services (ne plus payer)

### Arrêter temporairement (les données restent)

**Web App (Backend)** :

1. Aller sur ta Web App
2. En haut, cliquer sur **"Stop"**
3. ✅ Plus de frais pour la Web App !

**PostgreSQL** :

1. Aller sur ton serveur PostgreSQL
2. En haut, cliquer sur **"Stop"**
3. ✅ Plus de frais tant qu'il est arrêté !

**Static Web App** :

- Gratuit, rien à arrêter !

**Azure Artifacts** :

- Gratuit jusqu'à 2GB, rien à arrêter !

### Supprimer définitivement (⚠️ perte de données)

1. Aller sur **"Resource groups"**
2. Sélectionner `rg-testazure-prod`
3. Cliquer sur **"Delete resource group"**
4. Taper le nom pour confirmer
5. Cliquer sur **"Delete"**

⚠️ **Attention** : Toutes les ressources et données seront supprimées !

---

## 🐛 Problèmes fréquents et solutions

### "Cannot find module '.prisma/client/default'"

**Cause** : Azure exclut les dossiers cachés (commençant par `.`) lors de la compression tar.gz des `node_modules`. Le dossier `.prisma/` n'est donc pas déployé.

**Solution** : Utiliser le startup script (voir section 3.4) qui régénère Prisma Client au démarrage de l'app.

**Détails techniques** :

- Azure utilise `/opt/Kudu/Scripts/absoluteTar.sh`
- Commande : `tar -zcf node_modules.tar.gz *`
- Le wildcard `*` exclut : `.prisma/`, `.bin/`, `.pnpm/`, `.cache/`
- Depuis Kudu version `20250502.11`

### "Cannot find module '@repo/shared'" ou "@mcigroupfrance/testazure-shared"

**Cause** : Problème d'authentification avec Azure Artifacts ou package non publié.

**Solutions** :

1. **Vérifier que le package est publié** :

   - Aller sur Azure DevOps → Artifacts → testazure-package
   - Vérifier que `@mcigroupfrance/testazure-shared` existe

2. **Vérifier le secret GitHub** :

   - GitHub → Settings → Secrets → `AZURE_ARTIFACTS_TOKEN`
   - Doit contenir le token **encodé en Base64**

3. **Vérifier les logs GitHub Actions** :

   - Onglet "Actions" → Workflow en échec
   - Chercher "Build and publish shared package"
   - Vérifier qu'il n'y a pas d'erreur 401 ou 403

4. **Republier manuellement** :
   ```bash
   cd packages/shared
   pnpm build
   npm publish
   ```

### "npm error 403 - The feed already contains file"

**Cause** : Tu essaies de publier une version qui existe déjà sur Azure Artifacts.

**Solution** : Azure Artifacts ne permet pas de republier la même version.

**Options** :

1. **Incrémenter la version manuellement** :

   ```bash
   cd packages/shared
   npm version patch  # 1.0.1 → 1.0.2
   npm publish
   ```

2. **Laisser le workflow continuer** : Le workflow actuel ignore cette erreur et continue le déploiement.

### "Application Error" sur le backend

**Causes possibles** :

1. **Port binding incorrect** → Vérifier que `host: '0.0.0.0'` dans le code
2. **DATABASE_URL manquante** → Vérifier dans Environment variables
3. **Build failed** → Voir les logs dans GitHub Actions
4. **Prisma Client non généré** → Vérifier le startup script

**Solution** :

1. Aller sur ta Web App → **"Log stream"**
2. Lire les erreurs
3. Corriger dans le code
4. Push sur GitHub

### Le frontend ne charge pas l'API (CORS error)

**Solution** :

1. Vérifier que l'URL du frontend est dans la liste CORS du backend
2. Redéployer le backend (push sur GitHub)
3. Vider le cache du navigateur (Ctrl+Shift+R)

### "Can't connect to PostgreSQL"

**Erreur** : `Can't reach database server at psql-testazure-prod.postgres.database.azure.com:5432`

**Solution** :

1. **Vérifier que PostgreSQL est démarré** :

   - Azure Portal → Ton serveur PostgreSQL
   - Status doit être **"Available"** (pas "Stopped")
   - Si arrêté, cliquer sur **"Start"**

2. **⚠️ CRITIQUE - Vérifier les firewall rules** :

   - Menu gauche → **"Networking"**
   - **Public access** : Doit être sur **"Public access (allowed IP addresses)"** (pas "Disabled")
   - **Firewall rules** : **OBLIGATOIRE** → Cocher ☑️ **"Allow public access from any Azure service within Azure to this server"**
   - Sans cette case, ta Web App **ne pourra jamais** se connecter !
   - Cliquer sur **"Save"**

3. **Vérifier la DATABASE_URL** :
   - Ta Web App → **"Environment variables"**
   - Format : `postgresql://user:password@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require`
   - Vérifier que le mot de passe est correct (pas de caractères spéciaux mal encodés)

### Le build frontend échoue dans GitHub Actions

**Solution** :

1. Vérifier que `output: 'export'` est dans `next.config.ts` (ou `.mjs`)
2. Vérifier que le secret GitHub `NEXT_PUBLIC_API_URL` existe
3. Vérifier que le workflow contient la section `env:` avec `NEXT_PUBLIC_API_URL`
4. Voir les logs détaillés dans GitHub Actions

### L'API URL n'est pas définie dans le frontend (`undefined`)

**Erreur** : Dans le frontend, `process.env.NEXT_PUBLIC_API_URL` est `undefined` ou l'application essaie d'appeler `http://localhost:3001` au lieu de l'API Azure.

**Cause** : La variable `NEXT_PUBLIC_API_URL` n'a pas été injectée au BUILD TIME.

**Solutions** :

1. **Vérifier le GitHub Secret** :

   - GitHub → Settings → Secrets and variables → Actions
   - Vérifier que `NEXT_PUBLIC_API_URL` existe avec la bonne valeur

2. **Vérifier le workflow** :

   - Ouvrir `.github/workflows/azure-static-web-apps-xxx.yml`
   - Vérifier que la section `env:` est présente :

   ```yaml
   - name: Build And Deploy
     uses: Azure/static-web-apps-deploy@v1
     env:
       NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
     with:
       # ...
   ```

3. **Rebuild et redéployer** :
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push origin main
   ```

**⚠️ Rappel important** :

- ❌ Les variables Azure Static Web App (dans le Portail) **ne fonctionnent PAS** pour `NEXT_PUBLIC_*` avec export statique
- ❌ Le fichier `.env.production` est bloqué par le `.gitignore`
- ✅ **Seule solution** : GitHub Secret + section `env:` dans le workflow

### "sed: command not found" dans GitHub Actions

**Cause** : Le runner GitHub Actions n'a pas `sed` (rare).

**Solution** : Utiliser `sed -i` avec le flag approprié selon l'OS :

```bash
# Linux (GitHub Actions)
sed -i 's/old/new/g' file

# macOS
sed -i '' 's/old/new/g' file
```

Le workflow actuel utilise `sed -i` qui fonctionne sur Linux (runners GitHub).

---

## ✅ Checklist de déploiement complète

### Configuration Azure

- [ ] Compte Azure créé
- [ ] Resource Group créé (`rg-testazure-prod`)
- [ ] PostgreSQL déployé et database créée
- [ ] Migrations Prisma exécutées
- [ ] Backend Web App créé
- [ ] Variables d'environnement backend configurées (6 variables)
- [ ] Startup command configuré (`bash startup.sh`)

### Configuration Azure DevOps Artifacts

- [ ] Compte Azure DevOps créé
- [ ] Organisation créée (`mcigroupfrance`)
- [ ] Projet créé (`TestAzure`)
- [ ] Feed Artifacts créé (`testazure-package`)
- [ ] Personal Access Token (PAT) généré
- [ ] Package `@mcigroupfrance/testazure-shared` publié

### Configuration GitHub

- [ ] Secret `AZURE_ARTIFACTS_TOKEN` ajouté
- [ ] Secret `AZUREAPPSERVICE_PUBLISHPROFILE_xxx` créé par Azure
- [ ] Workflow backend modifié avec Azure Artifacts
- [ ] Workflow frontend créé par Azure

### Code Backend

- [ ] Code backend modifié (host `0.0.0.0`)
- [ ] `startup.sh` créé et exécutable
- [ ] `packages/shared/package.json` configuré pour publication
- [ ] `.npmrc` projet créé et commité
- [ ] `.npmrc` user créé (pas commité)
- [ ] `.gitignore` mis à jour pour ignorer `.npmrc`
- [ ] Backend déployé via GitHub Actions
- [ ] API testée (`/health` et `/api/auth/login`)

### Code Frontend

- [ ] Code frontend modifié (`output: 'export'`)
- [ ] `.env.production` créé avec `NEXT_PUBLIC_API_URL`
- [ ] Static Web App créée
- [ ] Frontend déployé via GitHub Actions
- [ ] CORS configuré
- [ ] Login frontend → backend fonctionne
- [ ] Providers CRUD fonctionne
- [ ] Recherche fonctionne

---

## 🎯 Étape 8 : Custom Domain (optionnel)

### Pour le frontend

1. Aller sur ta Static Web App
2. Menu de gauche : **"Settings"** → **"Custom domains"**
3. Cliquer sur **"+ Add"**
4. **Domain type** : `Custom domain on other DNS`
5. **Domain name** : `www.testazure.com` (ton domaine)
6. Suivre les instructions pour configurer le DNS (CNAME)
7. Azure génère automatiquement un certificat SSL gratuit !

### Pour le backend

1. Aller sur ta Web App
2. Menu de gauche : **"Settings"** → **"Custom domains"**
3. Cliquer sur **"+ Add custom domain"**
4. **Domain** : `api.testazure.com`
5. Suivre les instructions DNS
6. Activer le SSL/TLS

---

## 📚 Développement local - Guide pour les nouveaux développeurs

### Pour toi (admin du projet)

**Tu as déjà configuré** :

- ✅ Azure Artifacts
- ✅ GitHub Actions
- ✅ `.npmrc` user avec ton token

**Pour travailler localement** :

```bash
git clone https://github.com/ton-compte/TestAzure.git
cd TestAzure
pnpm install  # Installe avec workspaces
pnpm dev      # Lance le dev
```

**Rien ne change pour toi** ✅

### Pour un nouveau développeur qui rejoint le projet

**Ce qu'il doit faire** :

1. **Cloner le repo** :

   ```bash
   git clone https://github.com/ton-compte/TestAzure.git
   cd TestAzure
   ```

2. **Installer les dépendances** :

   ```bash
   pnpm install
   ```

3. **C'est tout !** ✅

**Il N'A PAS besoin de** :

- ❌ Configurer Azure Artifacts
- ❌ Générer un PAT
- ❌ Créer un `~/.npmrc`

**Pourquoi ?**

- En local, le projet utilise `@repo/shared` via workspace pnpm
- Azure Artifacts est utilisé **uniquement pour le déploiement** (GitHub Actions)
- Les devs travaillent avec le code source directement

**Si un dev veut publier manuellement le package** (rare) :

1. Créer un Personal Access Token sur Azure DevOps
2. Encoder en Base64
3. Créer son `~/.npmrc` user (copier depuis `.npmrc.example`)
4. Publier :
   ```bash
   cd packages/shared
   pnpm build
   npm publish
   ```

---

## 🔄 Workflow de développement

### Modifier le code partagé (`packages/shared/`)

**1. Modifier le code** :

```bash
# packages/shared/src/schemas/auth.schema.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // Nouveau champ
  rememberMe: z.boolean().optional(),
});
```

**2. Tester en local** :

```bash
pnpm dev  # Le backend et frontend utilisent directement le workspace
```

**3. Commit et push** :

```bash
git add .
git commit -m "Add rememberMe to login schema"
git push origin main
```

**4. GitHub Actions automatiquement** :

- ✅ Incrémente la version (`1.0.5` → `1.0.6`)
- ✅ Publie `@mcigroupfrance/testazure-shared@1.0.6` sur Azure Artifacts
- ✅ Build le backend avec la nouvelle version
- ✅ Déploie sur Azure

**5. Vérifier le déploiement** :

- GitHub Actions → Onglet "Actions" → Voir le workflow ✅
- Azure → Ta Web App → Tester l'API

---

## 🎉 Félicitations !

Si tu as suivi toutes les étapes, ton application est maintenant **en production sur Azure** avec une architecture monorepo moderne !

**URLs importantes** :

- **Frontend** : `https://xxx.azurestaticapps.net`
- **Backend** : `https://api-testazure-prod.azurewebsites.net`
- **Portail Azure** : https://portal.azure.com
- **Azure DevOps** : https://dev.azure.com

**Prochaines étapes** :

- Ajouter un custom domain
- Configurer des alertes
- Optimiser les coûts
- Implémenter Azure AI Search (pour la recherche avancée)
- Ajouter des tests automatisés dans le workflow

---

## 📚 Ressources utiles

### Documentation officielle

- **Azure Portal** : https://portal.azure.com
- **Azure Documentation** : https://learn.microsoft.com/azure/
- **Azure DevOps Artifacts** : https://learn.microsoft.com/azure/devops/artifacts/
- **GitHub Actions** : https://docs.github.com/actions
- **Prisma** : https://www.prisma.io/docs
- **Fastify** : https://fastify.dev
- **Next.js** : https://nextjs.org/docs

### Support et communauté

- **Support Azure** : https://portal.azure.com → icône "?" en haut → "Help + support"
- **Forum Azure** : https://learn.microsoft.com/answers/
- **Calculateur de prix** : https://azure.microsoft.com/pricing/calculator/
- **Status Azure** : https://status.azure.com/

### Outils de développement

- **Azure CLI** : https://learn.microsoft.com/cli/azure/
- **Azure DevOps CLI** : https://learn.microsoft.com/azure/devops/cli/
- **Prisma Studio** : Inclus dans Prisma
- **Postman** : Pour tester les API

---

**Auteur** : Fab
**Date création** : 2025-11-07
**Dernière mise à jour** : 2025-11-17
**Version** : 2.0 (avec Azure Artifacts)
**Licence** : MIT

---

## 📝 Notes de version

### Version 2.0 (2025-11-17)

- ✅ Ajout d'Azure Artifacts pour gérer `@repo/shared`
- ✅ Workflow GitHub Actions complet avec publication automatique
- ✅ Résolution du problème des symlinks workspace
- ✅ Réduction de la taille de déploiement (900 MB → 20 MB)
- ✅ Documentation complète du workflow CI/CD
- ✅ Guide pour nouveaux développeurs

### Version 1.0 (2025-11-07)

- ✅ Guide initial de déploiement via portail
- ✅ PostgreSQL, Web App, Static Web App
- ✅ Configuration de base
