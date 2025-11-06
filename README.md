# 🚀 TestAzure - Monorepo Next.js + Fastify + Azure SQL

Projet de test pour déployer une application complète sur Azure avec :
- Frontend Next.js (Static Web App)
- Backend Fastify (Web App)
- Base de données Azure SQL
- CI/CD GitHub Actions

## 📦 Structure du projet

```
TestAzure/
├── apps/
│   ├── frontend/          # Next.js 15 + Shadcn/ui (à venir)
│   └── backend/           # Fastify + Prisma + TypeScript
├── packages/
│   └── shared/            # Types TypeScript + Zod schemas partagés
└── PROJECT_PLAN.md        # Documentation complète du projet
```

## 🛠️ Stack Technique

### Backend
- **Fastify 5** - Framework web ultra-rapide
- **Prisma** - ORM pour Azure SQL
- **TypeScript** - Typage statique
- **JWT** - Authentification
- **Zod** - Validation des données

### Frontend (à venir)
- **Next.js 15** - Framework React avec App Router
- **Shadcn/ui** - Composants UI
- **Tailwind CSS** - Styling
- **React Hook Form** - Gestion des formulaires

### Database
- **Azure SQL Database** (ou SQL Server local en Docker)
- **Colonnes JSON** pour données dynamiques

### DevOps
- **pnpm workspaces** - Gestion du monorepo
- **GitHub Actions** - CI/CD (à venir)

## 🚀 Installation

### Prérequis
- Node.js 20+
- pnpm 10+
- Docker (pour SQL Server local)

### Installation des dépendances

```bash
pnpm install
```

### Configuration de la base de données

#### Option 1 : SQL Server local avec Docker (recommandé pour dev)

```bash
# Lancer SQL Server
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sqlserver --hostname sqlserver -d \
  mcr.microsoft.com/mssql/server:2022-latest
```

#### Option 2 : Azure SQL Database
Créer une base Azure SQL et récupérer la connection string.

### Configuration de l'environnement

Créer `apps/backend/.env` :

```env
DATABASE_URL="sqlserver://localhost:1433;database=testazure;user=sa;password=YourPassword123!;encrypt=true;trustServerCertificate=true"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
```

### Migrations et seed de la base

```bash
# Générer le client Prisma
cd apps/backend
npx prisma generate

# Créer la base et appliquer les migrations
npx prisma migrate dev --name init

# Peupler avec des données de test
pnpm prisma:seed
```

## 🎯 Démarrage

### Backend

```bash
# Depuis la racine du projet
pnpm dev
```

Le serveur démarre sur **http://localhost:3001**

### Endpoints disponibles

- `GET /health` - Health check
- `POST /api/auth/login` - Authentification
- `GET /api/auth/me` - Infos utilisateur (protégé)
- `GET /api/provider-types` - Liste des types de fournisseurs (protégé)
- `POST /api/provider-types` - Créer un type (protégé)
- `GET /api/providers` - Liste des fournisseurs avec filtres (protégé)
- `POST /api/providers` - Créer un fournisseur (protégé)

### Test rapide

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Récupérer un token et l'utiliser
TOKEN="votre_token_ici"
curl -X GET http://localhost:3001/api/provider-types \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Données de test

Le seed crée :
- **1 utilisateur** : `admin@test.com` / `password123`
- **4 types de fournisseurs** : hotel, audiovisuel, traiteur, lieu
- **5 fournisseurs exemples** avec données JSON dynamiques

## 🔍 Fonctionnalités principales

### Types de fournisseurs dynamiques
Chaque type de fournisseur définit un **JSON Schema** pour ses spécificités :

Exemple pour "Hôtel" :
```json
{
  "nombreEtoiles": { "type": "number", "min": 1, "max": 5, "required": true },
  "capacite": { "type": "number", "required": true },
  "services": { "type": "array", "items": "string" },
  "tarifsParNuit": { "type": "number", "required": true }
}
```

### Recherche dans les colonnes JSON
L'API supporte la recherche dans les spécificités JSON :

```bash
# Tous les hôtels 4 étoiles
GET /api/providers?providerTypeId=1&specificities[nombreEtoiles]=4
```

## 📝 Commandes utiles

```bash
# Installer les dépendances
pnpm install

# Lancer le backend en dev
pnpm dev

# Compiler le backend
pnpm --filter backend build

# Compiler le package shared
pnpm --filter @repo/shared build

# Prisma Studio (interface graphique BDD)
pnpm --filter backend prisma:studio

# Voir les logs Docker SQL Server
docker logs sqlserver

# Arrêter/démarrer SQL Server
docker stop sqlserver
docker start sqlserver
```

## 🎨 Frontend (à venir)

Le frontend sera développé avec :
- Pages d'authentification
- Dashboard avec sidebar
- CRUD des types de fournisseurs (back-office)
- CRUD des fournisseurs avec formulaires dynamiques
- Recherche avancée dans les spécificités

## 🚢 Déploiement Azure (à venir)

- Frontend → Azure Static Web Apps
- Backend → Azure Web App (Node.js)
- Database → Azure SQL Database
- CI/CD → GitHub Actions

## 📚 Documentation complète

Voir [PROJECT_PLAN.md](./PROJECT_PLAN.md) pour l'architecture détaillée et le plan complet.

## 👤 Auteur

Fab - Test d'architecture Azure

## 📄 License

Projet de test - Usage personnel
