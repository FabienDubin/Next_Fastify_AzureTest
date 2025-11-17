# 🖱️ Guide de Déploiement Azure - Interface Portail Web

## 📋 Vue d'ensemble

Ce guide te montre comment déployer ton application **entièrement depuis le portail web Azure**, sans ligne de commande !

**URL du portail** : https://portal.azure.com

---

## 🎯 Prérequis

1. **Compte Azure**
   - Aller sur : https://azure.microsoft.com/free/
   - Créer un compte (gratuit)
   - 200€ de crédit pendant 30 jours
   - Carte bancaire nécessaire (mais pas de débit automatique)

2. **Repository GitHub**
   - Ton projet doit être sur GitHub (pour le déploiement automatique)
   - Repository public ou privé (les deux fonctionnent)

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

**Firewall rules** :
- Cocher ☑️ **"Allow public access from any Azure service within Azure to this server"**
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

## 🖥️ Étape 2 : Déployer le Backend (Fastify)

### 2.1 Créer l'App Service (Web App)

1. Dans la barre de recherche, taper **"App Services"**
2. Cliquer sur **"App Services"**
3. Cliquer sur **"+ Create"**
4. Sélectionner **"Web App"**

### 2.2 Configuration de la Web App

**Onglet "Basics"** :

**Project Details** :
- **Subscription** : Ta souscription
- **Resource Group** : `rg-testazure-prod`

**Instance Details** :
- **Name** : `api-testazure-prod` (doit être unique mondialement)
- **Publish** : `Code` (pas Docker pour le moment)
- **Runtime stack** : `Node 20 LTS`
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

### 2.3 Configurer les variables d'environnement

Une fois la Web App créée :

1. Cliquer sur **"Go to resource"**
2. Dans le menu de gauche, chercher **"Settings"** → **"Environment variables"**
3. Cliquer sur l'onglet **"App settings"**
4. Cliquer sur **"+ Add"** pour chaque variable

**Variables à ajouter** :

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://azureadmin:TestAzure2025!@psql-testazure-prod.postgres.database.azure.com:5432/testazure?sslmode=require` |
| `JWT_SECRET` | Générer un secret aléatoire (32 caractères) |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `WEBSITES_PORT` | `8080` |

**Générer un JWT_SECRET** :
- Aller sur : https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
- Copier la chaîne générée

5. Cliquer sur **"Apply"** en bas
6. Cliquer sur **"Confirm"** dans la popup

### 2.4 Créer le script de démarrage

⚠️ **IMPORTANT** : Azure exclut les dossiers cachés (comme `.prisma/`) lors du déploiement. Il faut régénérer le Prisma Client au démarrage.

**1. Créer `apps/backend/startup.sh`** :

```bash
#!/bin/sh
echo "=== Starting deployment script ==="
echo "Generating Prisma Client..."
node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

echo "Prisma Client generated successfully!"
echo "Starting Fastify server..."
node dist/server.js
```

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

### 2.5 Configurer le démarrage dans Azure

1. Dans le menu de gauche, aller dans **"Settings"** → **"Configuration"**
2. Onglet **"General settings"**
3. **Startup Command** : `bash startup.sh`
4. Cliquer sur **"Save"** en haut

### 2.6 Préparer le backend pour le déploiement

**IMPORTANT : Modifications à faire dans le code**

**1. Modifier `apps/backend/src/server.ts`** :

```typescript
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    // ⚠️ IMPORTANT : host doit être '0.0.0.0' pour Azure
    await server.listen({ port, host: '0.0.0.0' });
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
    "build": "tsc",
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

### 2.7 Workflow GitHub Actions créé automatiquement

Azure a créé un fichier `.github/workflows/` qui se déclenche automatiquement à chaque push !

**Voir le déploiement en cours** :
1. Aller sur GitHub → Ton repo → Onglet **"Actions"**
2. Tu verras le workflow en cours d'exécution
3. Attendre qu'il soit ✅ vert

### 2.8 Tester l'API

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

## 🌐 Étape 3 : Déployer le Frontend (Next.js)

### 3.1 Préparer Next.js pour le déploiement

**Modifications à faire dans le code**

**1. Modifier `apps/frontend/next.config.mjs`** :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ⚠️ IMPORTANT pour Static Web Apps
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

**2. Créer `apps/frontend/.env.production`** :

```bash
NEXT_PUBLIC_API_URL=https://api-testazure-prod.azurewebsites.net
```

**3. Commit et push** :

```bash
git add .
git commit -m "Configure frontend for Azure Static Web Apps"
git push origin main
```

### 3.2 Créer la Static Web App

1. Dans la barre de recherche du portail Azure, taper **"Static Web Apps"**
2. Cliquer sur **"Static Web Apps"**
3. Cliquer sur **"+ Create"**

### 3.3 Configuration de la Static Web App

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

### 3.4 Déploiement automatique

**Ce qui se passe** :

1. Azure crée automatiquement un fichier `.github/workflows/azure-static-web-apps-xxx.yml`
2. Ce workflow se déclenche à chaque push sur `main`
3. Le frontend est automatiquement buildé et déployé

**Voir le déploiement** :
1. Aller sur GitHub → Ton repo → Onglet **"Actions"**
2. Tu verras un nouveau workflow (Static Web Apps)
3. Attendre qu'il soit ✅ vert (~5 minutes)

### 3.5 Tester le frontend

1. Retourner sur le portail Azure → Ta Static Web App
2. Dans l'aperçu, tu verras l'**URL** : `https://xxx.azurestaticapps.net`
3. Cliquer dessus pour ouvrir l'application

✅ **Résultat** : Ton frontend est en ligne !

**Tester le login** :
- Email : `admin@test.com`
- Password : `password123`

---

## 🔒 Étape 4 : Sécurité et CORS

### 4.1 Configurer CORS sur le backend

**Problème** : Le frontend ne peut pas appeler l'API (erreur CORS)

**Solution** :

**1. Modifier `apps/backend/src/server.ts`** :

```typescript
import cors from '@fastify/cors';

// Enregistrer CORS avec l'URL du frontend
await server.register(cors, {
  origin: [
    'http://localhost:3000',  // Dev local
    'https://xxx.azurestaticapps.net',  // ⚠️ Remplacer par ton URL !
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

### 4.2 Vérifier que tout fonctionne

1. Ouvrir le frontend : `https://xxx.azurestaticapps.net`
2. Tester le login
3. Créer un provider
4. Tester la recherche

✅ **Si tout fonctionne** : Félicitations, ton app est déployée ! 🎉

---

## 📊 Étape 5 : Monitoring (optionnel mais recommandé)

### 5.1 Voir les logs du backend

1. Aller sur Azure Portal → Ta Web App (`api-testazure-prod`)
2. Dans le menu de gauche : **"Monitoring"** → **"Log stream"**
3. Tu verras les logs en temps réel

### 5.2 Voir les métriques

1. Toujours dans ta Web App
2. Menu de gauche : **"Monitoring"** → **"Metrics"**
3. Tu peux voir : CPU, Memory, Requests, Response time, etc.

### 5.3 Application Insights (monitoring avancé)

1. Menu de gauche : **"Monitoring"** → **"Application Insights"**
2. Cliquer sur ton Application Insights (`appi-testazure-prod`)
3. Tu auras accès à :
   - **Live Metrics** : métriques en temps réel
   - **Failures** : erreurs et exceptions
   - **Performance** : temps de réponse des API
   - **Users** : nombre d'utilisateurs connectés

---

## 💰 Coûts estimés mensuels

| Service | Configuration | Coût |
|---------|--------------|------|
| **Static Web Apps** | Free tier | 0€ |
| **Web App (Backend)** | Basic B1 | ~13€ |
| **PostgreSQL** | Burstable B1ms | ~20€ |
| **Application Insights** | Basic (1GB/mois gratuit) | 0-5€ |
| **Bandwidth** | 5GB gratuits | 0-2€ |
| **TOTAL** | | **~35-40€/mois** |

**Notes** :
- Premier mois gratuit avec les 200€ de crédit
- Tu peux arrêter les ressources pour ne pas payer
- Les services Free tier sont vraiment gratuits

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

### Supprimer définitivement (⚠️ perte de données)

1. Aller sur **"Resource groups"**
2. Sélectionner `rg-testazure-prod`
3. Cliquer sur **"Delete resource group"**
4. Taper le nom pour confirmer
5. Cliquer sur **"Delete"**

⚠️ **Attention** : Toutes les ressources et données seront supprimées !

---

## 🎯 Étape 6 : Custom Domain (optionnel)

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

## 🐛 Problèmes fréquents et solutions

### "Cannot find module '.prisma/client/default'"

**Cause** : Azure exclut les dossiers cachés (commençant par `.`) lors de la compression tar.gz des `node_modules`. Le dossier `.prisma/` n'est donc pas déployé.

**Solution** : Utiliser le startup script (voir section 2.4) qui régénère Prisma Client au démarrage de l'app.

### "Application Error" sur le backend

**Causes possibles** :
1. **Port binding incorrect** → Vérifier que `host: '0.0.0.0'` dans le code
2. **DATABASE_URL manquante** → Vérifier dans Environment variables
3. **Build failed** → Voir les logs dans GitHub Actions

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

**Solution** :
1. Vérifier que le serveur PostgreSQL est **démarré** (pas "Stopped")
2. Vérifier les **firewall rules** :
   - Menu gauche → **"Networking"** → **"Firewall rules"**
   - S'assurer que "Allow Azure services" est coché
3. Vérifier la **DATABASE_URL** dans les environment variables du backend

### Le build frontend échoue dans GitHub Actions

**Solution** :
1. Vérifier que `output: 'export'` est dans `next.config.mjs`
2. Vérifier que `NEXT_PUBLIC_API_URL` est bien défini
3. Voir les logs détaillés dans GitHub Actions

---

## ✅ Checklist de déploiement

- [ ] Compte Azure créé
- [ ] Resource Group créé (`rg-testazure-prod`)
- [ ] PostgreSQL déployé et database créée
- [ ] Migrations Prisma exécutées
- [ ] Backend Web App créé
- [ ] Variables d'environnement backend configurées
- [ ] Code backend modifié (host `0.0.0.0`)
- [ ] Backend déployé via GitHub Actions
- [ ] API testée (`/health` et `/api/auth/login`)
- [ ] Code frontend modifié (`output: 'export'`)
- [ ] Static Web App créée
- [ ] Frontend déployé via GitHub Actions
- [ ] CORS configuré
- [ ] Login frontend → backend fonctionne
- [ ] Providers CRUD fonctionne
- [ ] Recherche fonctionne

---

## 🎉 Félicitations !

Si tu as suivi toutes les étapes, ton application est maintenant **en production sur Azure** !

**URLs importantes** :
- **Frontend** : `https://xxx.azurestaticapps.net`
- **Backend** : `https://api-testazure-prod.azurewebsites.net`
- **Portail Azure** : https://portal.azure.com

**Prochaines étapes** :
- Ajouter un custom domain
- Configurer des alertes
- Optimiser les coûts
- Implémenter Azure AI Search (pour la recherche avancée)

---

## 📚 Ressources utiles

- **Documentation Azure** : https://learn.microsoft.com/azure/
- **Support Azure** : https://portal.azure.com → icône "?" en haut → "Help + support"
- **Forum Azure** : https://learn.microsoft.com/answers/
- **Calculateur de prix** : https://azure.microsoft.com/pricing/calculator/

---

**Auteur** : Fab
**Date** : 2025-11-07
**Version** : 1.0 (Interface Portail)
