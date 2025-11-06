# 🚀 Projet Test Azure - Next.js + Fastify + Azure SQL

## 📋 Vue d'ensemble

Ce projet est une application de test pour valider le déploiement d'une stack moderne sur Azure avec un monorepo pnpm. L'objectif est de tester :
- Le déploiement frontend (Next.js) sur Azure Static Web Apps
- Le déploiement backend (Fastify) sur Azure Web App
- La gestion d'Azure SQL Database avec colonnes JSON
- La CI/CD via GitHub Actions
- La gestion de types dynamiques avec recherche dans le JSON

## 🎯 Cas d'usage

Application de gestion de **fournisseurs** pour événements (hôtels, prestataires audiovisuels, traiteurs, lieux).

**Particularité :** Chaque type de fournisseur a des **spécificités métier** différentes stockées dans une colonne JSON, avec des schémas définis dynamiquement via un back-office.

## 🏗️ Architecture

### Structure du monorepo (pnpm workspaces)

```
TestAzure/
├── apps/
│   ├── frontend/              # Next.js (Static Web App)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── provider-types/
│   │   │   │   └── providers/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── providers/
│   │   │   │   ├── provider-form.tsx
│   │   │   │   └── provider-table.tsx
│   │   │   └── provider-types/
│   │   │       └── type-form.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   └── backend/               # Fastify API (Web App)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.route.ts
│       │   │   ├── provider-types.route.ts
│       │   │   └── providers.route.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── provider-types.service.ts
│       │   │   └── providers.service.ts
│       │   ├── schemas/
│       │   │   ├── auth.schema.ts
│       │   │   ├── provider-types.schema.ts
│       │   │   └── providers.schema.ts
│       │   ├── plugins/
│       │   │   ├── jwt.plugin.ts
│       │   │   └── prisma.plugin.ts
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── package.json
│
├── packages/
│   └── shared/                # Types et schémas partagés
│       ├── src/
│       │   ├── types/
│       │   │   ├── auth.types.ts
│       │   │   ├── provider-types.types.ts
│       │   │   └── providers.types.ts
│       │   ├── schemas/
│       │   │   ├── auth.schema.ts
│       │   │   ├── provider-types.schema.ts
│       │   │   └── providers.schema.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD GitHub Actions
├── pnpm-workspace.yaml
├── package.json
└── PROJECT_PLAN.md
```

### Déploiement Azure

```
GitHub Repo (monorepo)
       ↓
   [Push sur main]
       ↓
GitHub Actions (1 workflow, 2 jobs parallèles)
       ↓                           ↓
   [Job Frontend]             [Job Backend]
       ↓                           ↓
Build Next.js              Build Fastify
(export statique)          (compile TypeScript)
       ↓                           ↓
Azure Static Web App        Azure Web App
(CDN global)               (Node.js 20.x runtime)
       ↓                           ↓
    [HTTP calls] ──────────────► API
                                   ↓
                          Azure SQL Database
```

**Ressources Azure nécessaires :**
1. **Azure Static Web App** (Frontend)
2. **Azure Web App** (Backend API - App Service)
3. **Azure SQL Database**
4. **Resource Group** (West Europe)

## 📊 Structure de la base de données

### Modèle Prisma

```prisma
model ProviderType {
  id          Int        @id @default(autoincrement())
  name        String     @unique // "hotel", "audiovisuel", "traiteur", "lieu"
  label       String     // "Hôtel", "Prestataire audiovisuel", "Traiteur", "Lieu"
  jsonSchema  Json       // Schéma des spécificités pour ce type
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  providers   Provider[]
}

model Provider {
  id              Int          @id @default(autoincrement())
  name            String
  email           String       @unique
  phone           String?
  address         String?
  providerTypeId  Int
  providerType    ProviderType @relation(fields: [providerTypeId], references: [id])
  specificities   Json         // Données spécifiques selon le type
  status          String       @default("active") // "active" | "inactive"
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([providerTypeId])
  @@index([status])
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Hash bcrypt
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Exemples de types prédéfinis (seed)

**1. Hôtel**
```json
{
  "name": "hotel",
  "label": "Hôtel",
  "jsonSchema": {
    "nombreEtoiles": { "type": "number", "min": 1, "max": 5, "required": true },
    "capacite": { "type": "number", "required": true },
    "services": { "type": "array", "items": "string" },
    "tarifsParNuit": { "type": "number", "required": true }
  }
}
```

**2. Prestataire audiovisuel**
```json
{
  "name": "audiovisuel",
  "label": "Prestataire audiovisuel",
  "jsonSchema": {
    "materiel": { "type": "array", "items": "string", "required": true },
    "services": { "type": "array", "items": "string" },
    "tarifJournalier": { "type": "number", "required": true },
    "nombreTechniciens": { "type": "number" }
  }
}
```

**3. Traiteur**
```json
{
  "name": "traiteur",
  "label": "Traiteur",
  "jsonSchema": {
    "typeCuisine": { "type": "array", "items": "string", "required": true },
    "capaciteMax": { "type": "number", "required": true },
    "prixParPersonne": { "type": "number", "required": true },
    "serviceInclus": { "type": "boolean" }
  }
}
```

**4. Lieu**
```json
{
  "name": "lieu",
  "label": "Lieu",
  "jsonSchema": {
    "typeLieu": { "type": "string", "required": true },
    "superficie": { "type": "number", "required": true },
    "capacitePersonnes": { "type": "number", "required": true },
    "equipements": { "type": "array", "items": "string" },
    "tarifJournalier": { "type": "number", "required": true }
  }
}
```

### Recherche dans le JSON (Azure SQL)

**Méthode : JSON_VALUE() pour l'indexation**

```sql
-- Exemple : Trouver tous les hôtels 4 étoiles
SELECT * FROM Provider
WHERE providerTypeId = 1
  AND JSON_VALUE(specificities, '$.nombreEtoiles') = 4;

-- Exemple : Trouver tous les traiteurs avec capacité > 100
SELECT * FROM Provider
WHERE providerTypeId = 3
  AND CAST(JSON_VALUE(specificities, '$.capaciteMax') AS INT) > 100;
```

**Pour améliorer les performances (optionnel) :**
```sql
-- Ajouter des colonnes calculées
ALTER TABLE Provider
ADD nombreEtoiles AS JSON_VALUE(specificities, '$.nombreEtoiles') PERSISTED;

-- Créer un index
CREATE INDEX idx_provider_nombreEtoiles ON Provider(nombreEtoiles);
```

## 🛠️ Stack technique

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** (Form, DataTable, Input, Select, Dialog, Button, Badge, Card, Tabs)
- **React Hook Form** + **Zod** (validation formulaires)
- **Axios** (requêtes API)

### Backend
- **Fastify 5**
- **TypeScript**
- **Prisma ORM** (gestion Azure SQL + colonnes JSON)
- **JWT** (authentification)
- **Zod** (validation des données)
- **bcrypt** (hash des mots de passe)

### Shared Package
- **Types TypeScript** (interfaces partagées)
- **Zod schemas** (validation partagée)
- **Types discriminés** (union types pour spécificités)

### Base de données
- **Azure SQL Database**
- **Colonnes JSON** pour les spécificités
- **Indexes JSON** pour la recherche

### DevOps
- **pnpm workspaces** (monorepo)
- **GitHub Actions** (CI/CD)
- **Azure CLI** (déploiement)

## 📱 Fonctionnalités

### 1. Authentification
- ✅ Login (email + password)
- ✅ JWT token
- ✅ Routes protégées
- ✅ Logout

### 2. Back-office : Types de fournisseurs
- ✅ Créer un type (nom, label, schéma JSON)
- ✅ Lister les types
- ✅ Modifier un type
- ✅ Supprimer un type (si aucun fournisseur associé)

### 3. Gestion des fournisseurs
- ✅ Créer un fournisseur (formulaire dynamique basé sur le type)
- ✅ Lister les fournisseurs (DataTable avec filtres)
- ✅ Afficher les détails d'un fournisseur
- ✅ Modifier un fournisseur
- ✅ Supprimer un fournisseur

### 4. Recherche et filtres
- ✅ Filtrer par type de fournisseur
- ✅ Filtrer par statut (actif/inactif)
- ✅ Recherche textuelle (nom, email)
- ✅ Recherche dans les spécificités JSON

## 🎨 Pages de l'application

```
/login                          # Connexion
/dashboard                      # Dashboard principal
/provider-types                 # Liste des types (back-office)
/provider-types/new             # Créer un type
/provider-types/[id]/edit       # Modifier un type
/providers                      # Liste des fournisseurs (DataTable)
/providers/new                  # Créer un fournisseur
/providers/[id]                 # Détails d'un fournisseur
/providers/[id]/edit            # Modifier un fournisseur
```

## 🔄 Workflow package shared

### En développement :
```bash
# Installation à la racine
pnpm install

# Le frontend importe
import { Provider, ProviderType } from '@repo/shared'

# Le backend importe
import { Provider, ProviderType } from '@repo/shared'

# Les changements dans shared sont disponibles instantanément (symlinks)
```

### Au build (CI/CD) :
```yaml
# Frontend
- pnpm install                    # Installe tout
- pnpm --filter frontend build    # Build uniquement frontend
  # → Le package 'shared' est BUNDLÉ dans le build

# Backend
- pnpm install                    # Installe tout
- pnpm --filter backend build     # Build uniquement backend
  # → Le package 'shared' est COMPILÉ avec le backend
```

**Important :** Le package `shared` n'est JAMAIS déployé seul. Il est toujours bundlé/compilé dans les apps qui l'utilisent.

## 🚀 CI/CD GitHub Actions

```yaml
name: Deploy Monorepo

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter frontend build
      - uses: Azure/static-web-apps-deploy@v1
        with:
          app_location: "apps/frontend"
          output_location: "out"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter backend build
      - run: pnpm --filter backend prisma:generate
      - uses: azure/webapps-deploy@v2
        with:
          app-name: 'backend-app-name'
          package: './apps/backend'
```

## 📝 Variables d'environnement

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
# En prod: https://backend-app-name.azurewebsites.net
```

### Backend (.env)
```bash
DATABASE_URL="sqlserver://localhost:1433;database=testazure;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
NODE_ENV=development
```

## 🎯 Plan d'exécution

### Phase 1 : Setup monorepo
1. Initialiser le projet (pnpm-workspace.yaml)
2. Créer la structure de dossiers
3. Configurer TypeScript pour tout le monorepo
4. Setup du package shared (types de base)

### Phase 2 : Backend Fastify
1. Setup Fastify + plugins (CORS, JWT, Prisma)
2. Définir le schéma Prisma
3. Routes d'authentification (login)
4. Routes CRUD ProviderTypes
5. Routes CRUD Providers
6. Middleware de validation Zod
7. Seed de données de test

### Phase 3 : Frontend Next.js + Shadcn
1. Setup Next.js 15 + Tailwind
2. Installation Shadcn/ui
3. Page de login
4. Layout dashboard avec sidebar
5. Pages ProviderTypes (CRUD)
6. Pages Providers (CRUD avec formulaire dynamique)
7. Composant DataTable avec filtres
8. Recherche dans les spécificités JSON

### Phase 4 : Azure SQL Database
1. Créer la base de données Azure SQL
2. Configurer le firewall
3. Connecter Prisma à Azure SQL
4. Exécuter les migrations
5. Tester les requêtes JSON

### Phase 5 : Déploiement Azure
1. Créer la Static Web App (frontend)
2. Créer la Web App (backend)
3. Configurer les variables d'environnement
4. Déployer manuellement pour tester

### Phase 6 : CI/CD
1. Créer le workflow GitHub Actions
2. Configurer les secrets GitHub
3. Tester le déploiement automatique
4. Vérifier que tout fonctionne end-to-end

## 🧪 Tests à effectuer

### Tests fonctionnels
- [ ] Créer un type de fournisseur via le back-office
- [ ] Créer un fournisseur avec ce nouveau type
- [ ] Rechercher un fournisseur par une valeur dans ses spécificités JSON
- [ ] Modifier les spécificités d'un fournisseur
- [ ] Filtrer les fournisseurs par type
- [ ] Authentification (login/logout)

### Tests Azure
- [ ] Frontend accessible via Static Web App URL
- [ ] Backend accessible via Web App URL
- [ ] Frontend peut appeler le backend
- [ ] Azure SQL répond correctement
- [ ] Recherche JSON performante
- [ ] CI/CD se déclenche sur push main
- [ ] Déploiement automatique fonctionne

## 📚 Ressources

- [Fastify Docs](https://fastify.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure App Service](https://learn.microsoft.com/azure/app-service/)
- [Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/)
- [JSON in SQL Server](https://learn.microsoft.com/sql/relational-databases/json/)

---

**Auteur :** Fab
**Date :** 2025-11-06
**Objectif :** Tester l'architecture complète avant le projet principal
