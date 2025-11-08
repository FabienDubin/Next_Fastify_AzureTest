# 🚀 Guide de Déploiement Azure - Application TestAzure

## 📋 Vue d'ensemble

Ce guide détaille le déploiement complet de l'application TestAzure sur Microsoft Azure, incluant :
- **Frontend Next.js** → Azure Static Web Apps
- **Backend Fastify** → Azure Web App (App Service)
- **Base de données PostgreSQL** → Azure Database for PostgreSQL Flexible Server

---

## 🎯 Prérequis

### Outils nécessaires

1. **Azure CLI** (dernière version)
```bash
# Mac
brew install azure-cli

# Windows
# Télécharger : https://aka.ms/installazurecliwindows

# Vérifier l'installation
az --version
```

2. **Compte Azure**
- Créer un compte : https://azure.microsoft.com/free/
- Crédit gratuit de 200$ pour 30 jours
- Services gratuits pendant 12 mois

3. **GitHub**
- Repository du projet sur GitHub (pour CI/CD)

---

## 📦 Architecture de déploiement

```
┌─────────────────────────────────────────────────────┐
│                    AZURE CLOUD                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │   Azure Static Web App (Frontend)            │  │
│  │   • Next.js static export                     │  │
│  │   • CDN global                                │  │
│  │   • HTTPS automatique                         │  │
│  │   • Custom domain (optionnel)                 │  │
│  └──────────────────────────────────────────────┘  │
│                       ↓ API Calls                   │
│  ┌──────────────────────────────────────────────┐  │
│  │   Azure Web App (Backend)                     │  │
│  │   • Node.js 20.x                              │  │
│  │   • Fastify API                               │  │
│  │   • Variables d'environnement                 │  │
│  │   • Logs & monitoring                         │  │
│  └──────────────────────────────────────────────┘  │
│                       ↓ SQL Queries                 │
│  ┌──────────────────────────────────────────────┐  │
│  │   Azure PostgreSQL Flexible Server           │  │
│  │   • PostgreSQL 16                             │  │
│  │   • Colonnes JSONB                            │  │
│  │   • Firewall configuré                        │  │
│  │   • Backups automatiques                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
         ↑ GitHub Actions (CI/CD)
    ┌────┴────┐
    │ GitHub  │
    │  Repo   │
    └─────────┘
```

---

## 🗂️ Étape 0 : Préparation du projet

### 0.1 Connexion à Azure

```bash
# Se connecter à Azure
az login

# Vérifier la souscription active
az account show

# (Optionnel) Changer de souscription
az account list --output table
az account set --subscription "NOM_SOUSCRIPTION"
```

### 0.2 Créer un Resource Group

**Qu'est-ce qu'un Resource Group ?**
Un conteneur logique pour toutes les ressources Azure du projet.

```bash
# Créer le resource group
az group create \
  --name rg-testazure-prod \
  --location westeurope

# Vérifier
az group show --name rg-testazure-prod
```

**Convention de nommage recommandée :**
- `rg-` : Préfixe pour Resource Group
- `testazure` : Nom du projet
- `prod` : Environnement (prod, staging, dev)

---

## 🗄️ Étape 1 : Déployer PostgreSQL Database

### 1.1 Créer le serveur PostgreSQL

```bash
# Variables
RESOURCE_GROUP="rg-testazure-prod"
LOCATION="westeurope"
SERVER_NAME="psql-testazure-prod"  # Doit être unique globalement
ADMIN_USER="azureadmin"
ADMIN_PASSWORD="VotreMotDePasseComplexe123!"  # Changez-moi !

# Créer le serveur PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password $ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0 \
  --tags Environment=Production Project=TestAzure
```

**Tiers et coûts estimés** :
- `Burstable (B1ms)` : ~15-20€/mois (1 vCore, 2GB RAM)
- `General Purpose (D2s_v3)` : ~120€/mois (2 vCores, 8GB RAM)

**Note** : `--public-access 0.0.0.0` autorise temporairement toutes les IPs (à restreindre en production)

### 1.2 Créer la base de données

```bash
# Créer la database "testazure"
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME \
  --database-name testazure
```

### 1.3 Configurer le firewall

```bash
# Autoriser Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Autoriser votre IP locale (pour migrations)
MY_IP=$(curl -s ifconfig.me)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### 1.4 Récupérer la connection string

```bash
# Afficher les détails du serveur
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --query "{Name:name, FQDN:fullyQualifiedDomainName, State:state}" \
  --output table

# Connection string (pour Prisma)
echo "postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require"
```

### 1.5 Tester la connexion

```bash
# Installer psql si nécessaire
brew install postgresql

# Se connecter
psql "postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require"

# Dans psql
\l  # Lister les databases
\q  # Quitter
```

### 1.6 Exécuter les migrations Prisma

```bash
# Dans apps/backend/

# 1. Mettre à jour le .env.production
cat > .env.production << EOF
DATABASE_URL="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require"
JWT_SECRET="votre-secret-jwt-de-production"
PORT=8080
NODE_ENV=production
EOF

# 2. Exécuter les migrations
DATABASE_URL="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require" \
pnpm prisma migrate deploy

# 3. Seed les données (optionnel)
DATABASE_URL="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require" \
pnpm prisma:seed
```

**✅ Checkpoint** : PostgreSQL est prêt et contient les tables !

---

## 🖥️ Étape 2 : Déployer le Backend (Fastify)

### 2.1 Créer l'App Service Plan

```bash
# Variables
APP_SERVICE_PLAN="asp-testazure-prod"
WEBAPP_NAME="api-testazure-prod"  # Doit être unique globalement

# Créer le plan (Linux, Node.js)
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_PLAN \
  --location $LOCATION \
  --is-linux \
  --sku B1 \
  --tags Environment=Production Project=TestAzure
```

**Tiers et coûts** :
- `B1` (Basic) : ~13€/mois (1 vCore, 1.75GB RAM)
- `S1` (Standard) : ~75€/mois (1 vCore, 1.75GB RAM, staging slots)
- `P1v2` (Premium) : ~100€/mois (1 vCore, 3.5GB RAM, autoscale)

### 2.2 Créer la Web App

```bash
# Créer la Web App avec Node.js 20
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEBAPP_NAME \
  --runtime "NODE:20-lts" \
  --tags Environment=Production Project=TestAzure

# Activer les logs
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --application-logging filesystem \
  --level information
```

### 2.3 Configurer les variables d'environnement

```bash
# Connection string PostgreSQL
DATABASE_URL="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/testazure?sslmode=require"

# Générer un JWT secret (32 bytes en hex)
JWT_SECRET=$(openssl rand -hex 32)

# Configurer les app settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV="production" \
    PORT="8080" \
    WEBSITES_PORT="8080"

# Vérifier
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --output table
```

### 2.4 Configurer le build et startup

```bash
# Configurer le script de démarrage
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --startup-file "node dist/server.js"
```

### 2.5 Préparer le backend pour le déploiement

**Modifier `apps/backend/package.json`** :

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "postinstall": "prisma generate"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Modifier `apps/backend/src/server.ts`** :

```typescript
// S'assurer que Fastify écoute sur 0.0.0.0 (pas localhost)
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
```

### 2.6 Déployer avec Azure CLI

**Option A : Déploiement ZIP (manuel)** :

```bash
# 1. Build le backend
cd apps/backend
pnpm install
pnpm build

# 2. Créer un zip avec tout ce qui est nécessaire
zip -r backend.zip \
  dist/ \
  node_modules/ \
  prisma/ \
  package.json \
  pnpm-lock.yaml

# 3. Déployer
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --src backend.zip

# 4. Voir les logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME
```

**Option B : Déploiement depuis Git (recommandé)** :

```bash
# Activer le déploiement local Git
az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME

# Récupérer l'URL Git
GIT_URL=$(az webapp deployment source show \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --query repositoryUrl \
  --output tsv)

echo "Git URL: $GIT_URL"

# Ajouter comme remote et push
cd apps/backend
git remote add azure $GIT_URL
git push azure main
```

### 2.7 Tester l'API

```bash
# Récupérer l'URL de l'app
BACKEND_URL=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --query defaultHostName \
  --output tsv)

echo "Backend URL: https://${BACKEND_URL}"

# Tester le healthcheck
curl https://${BACKEND_URL}/health

# Tester le login
curl -X POST https://${BACKEND_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

**✅ Checkpoint** : Le backend API est en ligne !

---

## 🌐 Étape 3 : Déployer le Frontend (Next.js)

### 3.1 Préparer Next.js pour Static Export

**Modifier `apps/frontend/next.config.mjs`** :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← Important pour Static Web Apps
  images: {
    unoptimized: true,  // Static export ne supporte pas l'optimisation d'images
  },
  trailingSlash: true,
};

export default nextConfig;
```

**Modifier `apps/frontend/.env.production`** :

```bash
NEXT_PUBLIC_API_URL=https://api-testazure-prod.azurewebsites.net
```

### 3.2 Créer la Static Web App via le portail Azure

**Méthode recommandée : GitHub Actions (automatique)**

1. **Aller sur le portail Azure** : https://portal.azure.com
2. **Créer une ressource** → Rechercher "Static Web Apps"
3. **Cliquer sur "Create"**

**Configuration** :
- **Resource Group** : `rg-testazure-prod`
- **Name** : `swa-testazure-prod`
- **Plan type** : Free (gratuit)
- **Region** : West Europe
- **Source** : GitHub
- **Organization** : Votre compte GitHub
- **Repository** : Sélectionner votre repo `TestAzure`
- **Branch** : `main`
- **Build Presets** : Next.js
- **App location** : `/apps/frontend`
- **Api location** : (laisser vide)
- **Output location** : `out`

4. **Cliquer sur "Review + Create"** puis **"Create"**

**Ce qui se passe** :
- Azure crée automatiquement un workflow GitHub Actions dans `.github/workflows/`
- À chaque push sur `main`, le frontend est automatiquement déployé
- Azure gère le build, l'hébergement et le CDN

### 3.3 Workflow GitHub Actions créé automatiquement

Azure génère automatiquement un fichier similaire à :

```yaml
# .github/workflows/azure-static-web-apps-xxx.yml

name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/apps/frontend"
          output_location: "out"
```

### 3.4 Configuration manuelle (si besoin)

**Si vous voulez créer via Azure CLI** :

```bash
# Créer la Static Web App (nécessite un repo GitHub)
az staticwebapp create \
  --name swa-testazure-prod \
  --resource-group $RESOURCE_GROUP \
  --location westeurope \
  --source https://github.com/VOTRE_USERNAME/TestAzure \
  --branch main \
  --app-location "/apps/frontend" \
  --output-location "out" \
  --login-with-github
```

### 3.5 Tester le frontend

```bash
# Récupérer l'URL
FRONTEND_URL=$(az staticwebapp show \
  --name swa-testazure-prod \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname \
  --output tsv)

echo "Frontend URL: https://${FRONTEND_URL}"

# Ouvrir dans le navigateur
open "https://${FRONTEND_URL}"
```

**✅ Checkpoint** : Le frontend est en ligne et communique avec l'API !

---

## 🔄 Étape 4 : CI/CD avec GitHub Actions

### 4.1 Workflow complet pour le monorepo

Créer `.github/workflows/azure-deploy.yml` :

```yaml
name: Deploy to Azure

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'

jobs:
  # Job 1 : Build et déploiement du frontend
  deploy-frontend:
    runs-on: ubuntu-latest
    name: Deploy Frontend
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build Frontend
        run: |
          cd apps/frontend
          pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.AZURE_API_URL }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/apps/frontend'
          output_location: 'out'
          skip_app_build: true

  # Job 2 : Build et déploiement du backend
  deploy-backend:
    runs-on: ubuntu-latest
    name: Deploy Backend
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build Backend
        run: |
          cd apps/backend
          pnpm build

      - name: Create deployment package
        run: |
          cd apps/backend
          zip -r ../backend-deploy.zip \
            dist/ \
            node_modules/ \
            prisma/ \
            package.json \
            pnpm-lock.yaml

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'api-testazure-prod'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend-deploy.zip
```

### 4.2 Configurer les secrets GitHub

1. **Aller sur GitHub** → Votre repo → Settings → Secrets and variables → Actions

2. **Ajouter les secrets suivants** :

**`AZURE_STATIC_WEB_APPS_API_TOKEN`** :
```bash
# Récupérer le token
az staticwebapp secrets list \
  --name swa-testazure-prod \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey \
  --output tsv
```

**`AZURE_WEBAPP_PUBLISH_PROFILE`** :
```bash
# Télécharger le profil de publication
az webapp deployment list-publishing-profiles \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --xml
```
Copier tout le XML retourné dans le secret.

**`AZURE_API_URL`** :
```
https://api-testazure-prod.azurewebsites.net
```

### 4.3 Tester le workflow

```bash
# Faire un commit et push
git add .
git commit -m "Setup Azure deployment"
git push origin main

# Le workflow démarre automatiquement
# Voir les logs sur : https://github.com/VOTRE_USERNAME/TestAzure/actions
```

**✅ Checkpoint** : CI/CD automatique fonctionnel !

---

## 🔒 Étape 5 : Sécurité et Configuration

### 5.1 Configurer CORS sur le backend

Le backend doit autoriser les requêtes depuis le frontend.

**Dans `apps/backend/src/server.ts`** :

```typescript
import cors from '@fastify/cors';

// Enregistrer CORS
await server.register(cors, {
  origin: [
    'http://localhost:3000',  // Dev
    'https://swa-testazure-prod.azurewebsites.net',  // Production
  ],
  credentials: true,
});
```

### 5.2 Restreindre l'accès PostgreSQL

```bash
# Supprimer la règle "AllowAll"
az postgres flexible-server firewall-rule delete \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowAll \
  --yes

# Autoriser uniquement Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 5.3 Configurer un custom domain (optionnel)

**Pour le frontend** :

1. Aller sur Azure Portal → Static Web App → Custom domains
2. Ajouter votre domaine (ex: `www.testazure.com`)
3. Configurer les DNS (CNAME)
4. Azure génère automatiquement un certificat SSL

**Pour le backend** :

```bash
# Ajouter un custom domain
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $WEBAPP_NAME \
  --hostname api.testazure.com

# Bind un certificat SSL (managed certificate)
az webapp config ssl create \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --hostname api.testazure.com
```

---

## 📊 Étape 6 : Monitoring et Logs

### 6.1 Activer Application Insights

```bash
# Créer une ressource Application Insights
az monitor app-insights component create \
  --resource-group $RESOURCE_GROUP \
  --app appi-testazure-prod \
  --location $LOCATION \
  --application-type web

# Récupérer l'instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --resource-group $RESOURCE_GROUP \
  --app appi-testazure-prod \
  --query instrumentationKey \
  --output tsv)

# Configurer le backend pour utiliser App Insights
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

### 6.2 Voir les logs en temps réel

**Backend logs** :
```bash
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME
```

**PostgreSQL logs** :
```bash
# Activer les logs serveur
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME \
  --name log_min_duration_statement \
  --value 1000  # Log les requêtes > 1s

# Voir les logs
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --resource-type Microsoft.DBforPostgreSQL/flexibleServers
```

### 6.3 Créer des alertes

```bash
# Alerte si CPU > 80%
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "Backend CPU High" \
  --scopes "/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Web/sites/${WEBAPP_NAME}" \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m
```

---

## 💰 Estimation des coûts mensuels

| Service | Tier | Coût estimé |
|---------|------|-------------|
| **Azure Static Web Apps** | Free | 0€ |
| **Azure Web App (Backend)** | B1 Basic | ~13€ |
| **Azure PostgreSQL** | B1ms Burstable | ~20€ |
| **Application Insights** | Basic (1GB gratuit) | 0-5€ |
| **Bandwidth** | 5GB gratuits/mois | 0-2€ |
| **TOTAL** | | **~35-40€/mois** |

**Notes** :
- Premier mois peut être gratuit avec les 200$ de crédit Azure
- Coûts peuvent augmenter avec le trafic et les données
- Services gratuits limités aux 12 premiers mois

---

## 🛠️ Commandes utiles

### Voir l'état de toutes les ressources

```bash
az resource list \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### Redémarrer les services

```bash
# Redémarrer le backend
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME

# Redémarrer PostgreSQL (maintenance)
az postgres flexible-server restart \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME
```

### Supprimer tout (nettoyage)

```bash
# ATTENTION : Supprime TOUTES les ressources du groupe
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

---

## 🐛 Troubleshooting

### Le backend ne démarre pas

**Vérifier les logs** :
```bash
az webapp log tail --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME
```

**Erreurs communes** :
- **Port binding** : Vérifier que `host: '0.0.0.0'` dans `server.listen()`
- **DATABASE_URL manquante** : Vérifier les app settings
- **Prisma Client** : Vérifier que `prisma generate` est dans `postinstall`

### Le frontend ne charge pas l'API

**Vérifier CORS** :
```bash
curl -H "Origin: https://swa-testazure-prod.azurewebsites.net" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api-testazure-prod.azurewebsites.net/api/providers
```

**Vérifier la variable d'environnement** :
- `NEXT_PUBLIC_API_URL` doit être définie dans `.env.production`
- Rebuild le frontend après modification

### PostgreSQL connection timeout

**Vérifier le firewall** :
```bash
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --output table
```

**Tester la connexion** :
```bash
psql "postgresql://azureadmin:PASSWORD@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require"
```

---

## 📚 Ressources et documentation

- [Azure Static Web Apps - Next.js](https://learn.microsoft.com/azure/static-web-apps/deploy-nextjs-static-export)
- [Azure Web Apps - Node.js](https://learn.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/azure/postgresql/flexible-server/)
- [Prisma with Azure PostgreSQL](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-azure)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

---

## ✅ Checklist de déploiement

- [ ] Compte Azure créé et CLI installé
- [ ] Resource Group créé
- [ ] PostgreSQL déployé et migrations exécutées
- [ ] Backend déployé et fonctionnel
- [ ] Frontend déployé et accessible
- [ ] CI/CD GitHub Actions configuré
- [ ] Variables d'environnement configurées
- [ ] CORS configuré correctement
- [ ] Firewall PostgreSQL restreint
- [ ] Custom domains configurés (optionnel)
- [ ] Application Insights activé
- [ ] Alertes configurées
- [ ] Tests end-to-end réussis

---

**Auteur** : Fab
**Date** : 2025-11-07
**Version** : 1.0
