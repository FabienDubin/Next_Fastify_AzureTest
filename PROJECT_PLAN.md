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
- ✅ Recherche textuelle (nom, email, address, phone)
- ✅ Recherche dans les spécificités JSON (toutes les valeurs : strings, numbers, arrays, booleans)
- ✅ Interface de recherche avec debounce (500ms)
- ✅ Bouton de réinitialisation des filtres
- 🔮 Migration future vers Azure AI Search (voir section dédiée ci-dessous)

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

### Phase 1 : Setup monorepo ✅ TERMINÉ
1. ✅ Initialiser le projet (pnpm-workspace.yaml)
2. ✅ Créer la structure de dossiers
3. ✅ Configurer TypeScript pour tout le monorepo
4. ✅ Setup du package shared (types de base)

### Phase 2 : Backend Fastify ✅ TERMINÉ
1. ✅ Setup Fastify + plugins (CORS, JWT, Prisma)
2. ✅ Définir le schéma Prisma
3. ✅ Routes d'authentification (login)
4. ✅ Routes CRUD ProviderTypes
5. ✅ Routes CRUD Providers
6. ✅ Middleware de validation Zod
7. ✅ Seed de données de test
8. ✅ SQL Server en Docker fonctionnel
9. ✅ Migrations Prisma appliquées
10. ✅ Tous les endpoints testés et fonctionnels

**Backend démarré sur port 3001 :** `pnpm dev`

**Credentials de test :**
- Email: `admin@test.com`
- Password: `password123`

### Phase 3 : Frontend Next.js + Shadcn 🚧 EN COURS
1. ✅ Setup Next.js 15 + Tailwind
2. ✅ Installation Shadcn/ui (button, input, label, card, form, table, dialog, select, textarea)
3. ✅ Configuration variables d'environnement (.env.local)
4. ✅ Structure des dossiers (lib/api, contexts, hooks, components/ui)
5. ✅ Client API Axios avec intercepteurs
6. ✅ Services API (auth.api.ts, provider-types.api.ts, providers.api.ts)
7. ⏳ **PROCHAIN :** Context d'authentification (AuthContext.tsx)
8. ⏳ Page de login
9. ⏳ Layout dashboard avec sidebar
10. ⏳ Pages ProviderTypes (CRUD)
11. ⏳ Pages Providers (CRUD avec formulaire dynamique)
12. ⏳ Composant DataTable avec filtres
13. ⏳ Recherche dans les spécificités JSON

**Structure frontend actuelle :**
```
apps/frontend/
├── .env.local              ✅ NEXT_PUBLIC_API_URL configuré
├── lib/
│   └── api/
│       ├── client.ts       ✅ Axios avec intercepteurs JWT
│       ├── auth.api.ts     ✅ Login + me()
│       ├── provider-types.api.ts  ✅ CRUD ProviderTypes
│       ├── providers.api.ts       ✅ CRUD Providers avec filtres
│       └── index.ts
├── contexts/               ⏳ À créer : AuthContext
├── hooks/                  ⏳ À créer : hooks custom
└── components/
    └── ui/                 ✅ Shadcn components installés
```

**Convention de nommage adoptée :**
- Backend : `.service.ts` (logique métier)
- Frontend : `.api.ts` (appels HTTP uniquement)

### Phase 4 : Azure SQL Database ⏳ À FAIRE
1. ⏳ Créer la base de données Azure SQL
2. ⏳ Configurer le firewall
3. ⏳ Connecter Prisma à Azure SQL
4. ⏳ Exécuter les migrations
5. ⏳ Tester les requêtes JSON

**Note :** Actuellement en dev local avec SQL Server Docker

### Phase 5 : Déploiement Azure ⏳ À FAIRE
1. ⏳ Créer la Static Web App (frontend)
2. ⏳ Créer la Web App (backend)
3. ⏳ Configurer les variables d'environnement
4. ⏳ Déployer manuellement pour tester

### Phase 6 : CI/CD ⏳ À FAIRE
1. ⏳ Créer le workflow GitHub Actions
2. ⏳ Configurer les secrets GitHub
3. ⏳ Tester le déploiement automatique
4. ⏳ Vérifier que tout fonctionne end-to-end

---

## 📝 Notes de session - 2025-11-06

### ✅ Ce qui est fait aujourd'hui
- Backend Fastify 100% opérationnel avec tous les endpoints testés
- SQL Server en Docker avec migrations et seed
- Frontend Next.js 15 initialisé avec Shadcn/ui
- Services API frontend créés (auth, provider-types, providers)
- Client Axios configuré avec intercepteurs JWT
- Structure de dossiers frontend complète

### ⏳ Prochain pour demain
1. **Créer AuthContext.tsx** - Context React pour la gestion de l'authentification
2. **Créer la page de login** - Formulaire avec React Hook Form + Zod
3. **Créer le layout dashboard** - Sidebar avec navigation
4. **Commencer les pages ProviderTypes** - CRUD basique

### 🛠️ Commandes utiles

**Démarrer le backend :**
```bash
cd /Users/fabiendubin/Desktop/FabLab/TestAzure
pnpm dev  # Port 3001
```

**Démarrer le frontend (quand prêt) :**
```bash
cd apps/frontend
pnpm dev  # Port 3000
```

**Démarrer SQL Server Docker :**
```bash
docker start sqlserver
```

**Prisma Studio (visualiser la BDD) :**
```bash
cd apps/backend
pnpm prisma:studio
```

### 🔐 Infos importantes
- **Backend API:** http://localhost:3001
- **Database:** SQL Server Docker sur port 1433
- **Test user:** admin@test.com / password123
- **JWT Secret:** Configuré dans apps/backend/.env

### 📦 Dépendances installées
**Frontend :**
- @repo/shared (workspace)
- axios ^1.7.9
- react-hook-form ^7.66.0
- @hookform/resolvers ^3.10.0
- zod ^3.25.76
- Shadcn components: button, input, label, card, form, table, dialog, select, textarea

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

## 🔍 Recherche avancée : Implémentation actuelle vs. Azure AI Search

### 📊 Implémentation actuelle (Phase 1)

**Architecture :**
```
Frontend → API Backend → SQL Server → Filtrage en mémoire (JSON)
```

**Capacités :**
- ✅ Recherche textuelle dans : `name`, `email`, `address`, `phone`
- ✅ Recherche dans toutes les valeurs du JSON `specificities` :
  - Strings (case insensitive)
  - Numbers (conversion en string)
  - Arrays (recherche dans chaque élément)
  - Booleans
- ✅ Filtre par type de fournisseur
- ✅ Filtre par statut
- ✅ Debounce 500ms pour éviter trop de requêtes
- ✅ Pagination après filtrage

**Limites :**
- ❌ Performance dégradée si > 1000 fournisseurs (filtrage en mémoire)
- ❌ Pas de recherche fuzzy (typos)
- ❌ Pas de suggestions/autocomplete
- ❌ Pas de recherche sémantique
- ❌ Pas de facettes dynamiques

**Quand utiliser :** Développement local, POC, petits volumes (<1000 fournisseurs)

---

### 🚀 Migration future : Azure AI Search (Phase 2)

**Architecture :**
```
Frontend → API Backend → Azure AI Search
                       ↓
                  Azure SQL (source de vérité)
```

**Capacités avancées :**
- ✅ **Recherche sémantique** : comprend l'intention ("hôtel pas cher près de Paris")
- ✅ **Fuzzy matching** : tolère les fautes de frappe ("hotl" → "hôtel")
- ✅ **Suggestions** : autocomplete intelligent
- ✅ **Facettes dynamiques** : filtres générés automatiquement depuis le JSON
- ✅ **Scoring personnalisé** : pondération des résultats
- ✅ **Intégration Azure OpenAI** : recherche en langage naturel
- ✅ **Performances excellentes** : même avec millions de documents

**Exemple de requête en langage naturel :**
```
"Trouve-moi un traiteur bio avec service inclus pour 150 personnes à Paris"
→ Recherche sémantique qui comprend :
  - typeCuisine contient "bio"
  - serviceInclus = true
  - capaciteMax >= 150
  - address contient "Paris"
```

**Architecture technique :**
1. **Indexeur automatique** : Sync Azure SQL → Azure AI Search toutes les 5 minutes
2. **Index de recherche** :
   ```json
   {
     "name": "providers-index",
     "fields": [
       { "name": "id", "type": "Edm.String", "key": true },
       { "name": "name", "type": "Edm.String", "searchable": true },
       { "name": "email", "type": "Edm.String", "filterable": true },
       { "name": "address", "type": "Edm.String", "searchable": true },
       { "name": "phone", "type": "Edm.String", "searchable": true },
       { "name": "providerType", "type": "Edm.String", "facetable": true },
       { "name": "specificities", "type": "Edm.ComplexType", "fields": [
         { "name": "nombreEtoiles", "type": "Edm.Int32", "filterable": true },
         { "name": "capacite", "type": "Edm.Int32", "filterable": true },
         { "name": "services", "type": "Collection(Edm.String)", "searchable": true }
       ]}
     ]
   }
   ```
3. **API de recherche** :
   ```typescript
   // Backend : Nouveau endpoint
   GET /api/providers/search?q=traiteur+bio&facets=providerType,capaciteMax

   // Appel à Azure AI Search
   const results = await searchClient.search(query, {
     searchMode: 'all',
     queryType: 'semantic',
     semanticConfiguration: 'providers-semantic-config',
     facets: ['providerType', 'capaciteMax'],
     top: 50
   });
   ```

**Coût estimé :**
- **Basic tier** : ~75€/mois (50GB, 3 réplicas)
- **Standard S1** : ~230€/mois (25GB/partition, HA)
- **Recommandation** : Basic tier largement suffisant pour ce projet

**Migration prévue :**
1. ✅ Phase 1 actuelle : Recherche simple (en production maintenant)
2. 🔮 Phase 2 (post-déploiement Azure) :
   - Créer la ressource Azure AI Search
   - Configurer l'indexeur SQL → Search
   - Créer l'index avec les champs JSON
   - Mettre à jour l'API backend pour utiliser Azure Search
   - Garder le code actuel en fallback
3. 🔮 Phase 3 (optionnel) :
   - Intégration Azure OpenAI pour recherche en langage naturel
   - Suggestions personnalisées basées sur l'historique

**Pourquoi attendre le déploiement Azure ?**
- Azure AI Search nécessite une ressource Azure (pas de version locale)
- Permet de tester l'architecture complète d'abord
- Évite les coûts pendant le développement
- La recherche actuelle suffit pour le POC

---

## 📚 Ressources

- [Fastify Docs](https://fastify.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure App Service](https://learn.microsoft.com/azure/app-service/)
- [Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/)
- [JSON in SQL Server](https://learn.microsoft.com/sql/relational-databases/json/)
- [Azure AI Search](https://learn.microsoft.com/azure/search/)
- [Azure AI Search - JSON indexing](https://learn.microsoft.com/azure/search/search-howto-index-json-blobs)

---

**Auteur :** Fab
**Date :** 2025-11-06 (Mise à jour recherche : 2025-11-07)
**Objectif :** Tester l'architecture complète avant le projet principal
