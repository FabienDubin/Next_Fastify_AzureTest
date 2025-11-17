# Déployer un Monorepo Next.js/Fastify sur Azure (avec PNPM)

Déployer un monorepo contenant un frontend **Next.js** et un backend
**Fastify** sur Azure requiert deux pipelines distincts : un pour le
frontend sur **Azure Static Web Apps** (site statique) et un pour le
backend sur **Azure App Service** (Web App). La gestion de PNPM ajoute
de la complexité à cause des symlinks (liens symboliques) qu'il crée
dans `node_modules`. Voici comment procéder :

## 1. Structure du monorepo et stratégie de déploiement

Votre monorepo est structuré, par exemple, ainsi :

    /apps/mon-frontend   (application Next.js)
    /backend             (API Fastify Node.js)
    /packages/shared     (code commun, utilisé via PNPM workspaces)

L'idée est de **déployer séparément** le frontend et le backend : -
**Frontend (Next.js)** : sur **Azure Static Web Apps** (hébergement
d'app statique + éventuellement fonctions Azure). - **Backend
(Fastify)** : sur **Azure App Service** (une Web App Node.js).

Cela nécessitera **deux workflows GitHub Actions** distincts (dans
`.github/workflows`). Vous pouvez configurer chaque workflow pour
s'exécuter uniquement quand les fichiers relatifs à l'app concernée
changent (via des filtres de chemin).

## 2. Déploiement du Frontend Next.js sur Azure Static Web Apps

Azure Static Web Apps offre un workflow CI/CD prêt à l'emploi. Dans le
workflow YAML généré, vous devrez spécifier le chemin de l'application
frontend. Par exemple :

    - uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_<...> }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "apps/mon-frontend"       # chemin vers le code Next.js
        output_location: "apps/mon-frontend/out" # par ex. si vous faites un export statique
        api_location: ""  # (pas d'API Azure Functions intégrée dans ce cas)

**Important :** Si votre Next.js est rendu statiquement (par exemple via
`next export` ou static generation), vous pouvez définir
`output_location` vers le dossier de build (par exemple `out` ou
`.next/static`) contenant `index.html`. Pour un Next.js avec SSR, notez
qu'Azure Static Web Apps supporte désormais Next.js SSR (en préversion)
-- cela nécessiterait une configuration spécifique, mais dans la plupart
des cas on déploie une version statique du site.

### ⚠️ Support PNPM dans Azure Static Web Apps

Le processus de build d'Azure Static Web Apps (Oryx) **ne prend pas en
charge PNPM nativement en
2025**[\[1\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=PNPM%20support).
Si vous laissez Azure effectuer la build, il tentera par défaut
`npm install`/`npm run build`, ce qui pose problème avec PNPM. Deux
approches possibles :

- **Approche A: Build _manuelle_ avec PNPM + skip build** -- Vous
  pouvez **construire le frontend vous-même** dans GitHub Actions puis
  demander à Azure Static Web Apps de simplement charger le résultat.
  Pour cela:

- Ajoutez des étapes dans le workflow avant
  `Azure/static-web-apps-deploy` pour installer PNPM et exécuter
  `pnpm install && pnpm build` dans le répertoire du frontend.

- Configurez le déploiement statique avec `skip_app_build: true` et
  pointez `app_location` vers le _dossier de sortie_ déjà construit
  (par ex `.next/` ou `apps/mon-frontend/out` contenant le contenu
  static)[\[2\]](https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app#:~:text=action%3A%20,output_location%3A)[\[3\]](https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app#:~:text=The%20,where%20your%20default%20file%20resides).
  Ainsi, le workflow d'Azure n'essaiera pas de reconstruire.

- **Approche B: Utiliser un build custom via Oryx** -- Azure Static
  Web Apps permet de définir une commande de build personnalisée. On
  peut tirer parti de **Corepack** pour activer PNPM durant la build
  Oryx. Par exemple, définir la variable d'environnement
  `CUSTOM_BUILD_COMMAND` dans le workflow Azure Static Web Apps :

```{=html}
<!-- -->
```

    env:
      CUSTOM_BUILD_COMMAND: 'corepack enable && pnpm install && pnpm run build'

Cette astuce, recommandée par un développeur, force Oryx à utiliser PNPM
via
Corepack[\[4\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=I%20had%20to%20dig%20into,environment%20variables%20to%20configure%20Oryx)[\[5\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=env%3A%20CUSTOM_BUILD_COMMAND%3A%20%27corepack%20enable%20%26%26,install%20%26%26%20pnpm%20run%20build).
Assurez-vous également que `pnpm-lock.yaml` est présent dans le repo.
_Note:_ Cette méthode a parfois des subtilités, et il faut surveiller
les logs de build.

Si vous rencontrez des erreurs de build ou de démarrage sur Azure Static
Web Apps avec PNPM, la cause est souvent le manque de support PNPM. Dans
ce cas, l'Approche A (build manuelle + skip) est souvent la plus fiable
pour un monorepo.

## 3. Déploiement du Backend Fastify sur Azure App Service (Web App)

Pour le backend Fastify, utilisez un workflow GitHub Action avec
l'action **Azure Web Apps Deploy**. Par exemple :

    - uses: azure/webapps-deploy@v3
      with:
        app-name: "NomDeVotreAppService"
        slot-name: "Production"
        package: "./path/to/packaged/backend.zip"

### Build et packaging du backend avec PNPM

Dans le job avant le déploiement, vous ferez typiquement :

1.  **Installation PNPM** : `pnpm/action-setup@v4` puis
    `actions/setup-node@v3` (Node 18+ ou 20+ selon votre runtime).
2.  **Installation des dépendances** : `pnpm install`.
3.  **Build** : exécutez votre build si nécessaire (ex: compilation
    TypeScript ou autre).
4.  **Packaging** : créez une archive ZIP de l'application backend prête
    à déployer.

**Problème des symlinks PNPM :** PNPM n'installe pas les modules comme
npm/yarn. Il crée un store de modules avec des liens symboliques
(`node_modules/.pnpm` contenant les dépendances partagées). Si on zipe
naïvement le dossier, on risque de **perdre des fichiers** ou d\'avoir
des chemins brisés une fois déployé sur Azure. Azure Kudu (le système de
déploiement) peut ignorer les symlinks ou ne pas les recréer
correctement, causant des erreurs \"Cannot find module \...\" au
démarrage.

- **Solution 1 -- Zipper en préservant les symlinks :** Utilisez les
  options adéquates de la commande `zip`. Par exemple, dans votre
  workflow:

```{=html}
<!-- -->
```

    zip -r -y my-backend.zip . --symlinks

L'option `-y` avec `--symlinks` inclut les liens symboliques dans
l'archive **sans résoudre** les
cibles[\[6\]](https://www.reddit.com/r/nextjs/comments/1k33l27/azure_we_app_deploment/#:~:text=Update%3A%20I%20finally%20figured%20out,Here%20the%20relevant%20configs).
Ainsi, la structure PNPM est conservée. Veillez à exécuter la commande
au bon endroit (par ex, dans le dossier contenant `package.json` du
backend, après le build).

> _Astuce:_ Pensez à inclure **les dossiers cachés** comme `.pnpm` dans
> l'archive. Un expert Microsoft note que le problème de modules
> manquants vient du fait que l'archive zip excluait le dossier `.pnpm`
> (car caché), ce qui cassait les dépendances de Next/SWC par
> exemple[\[7\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=The%20error%20,This%20occurs%20because).
> La commande ci-dessus avec `-r` sur `.` n'exclut rien (sauf `.git`).
> Vous pouvez explicitement exclure `.git*` mais **pas** `.pnpm`.
> Exemple: `zip -r backend.zip . -x '.git*'`.

- **Solution 2 -- Flatten des modules (node-linker=hoisted) :**
  Alternativement, vous pouvez configurer PNPM pour ne pas utiliser de
  symlinks. Ajoutez un fichier **.npmrc** à la racine du repo ou du
  dossier backend avec :

```{=html}
<!-- -->
```

- node-linker=hoisted
  shared-workspace-lockfile=false

  Cela force PNPM à installer les modules de façon plus classique
  (hoisting) similaire à
  npm[\[8\]](https://github.com/Azure/static-web-apps/issues/1594#:~:text=Describe%20alternatives%20you%27ve%20considered).
  Le déploiement aura alors un `node_modules` sans symlinks.
  **Attention**: cette configuration peut augmenter la taille du
  `node_modules` et doit être testée (elle était recommandée comme
  workaround par l'équipe Azure Static Web Apps pour PNPM).

```{=html}
<!-- -->
```

- **Solution 3 -- Copier les modules en dur :** Une autre technique
  consiste à _résoudre_ les liens symboliques avant de zipper. Par
  exemple, un utilisateur a utilisé
  `cp -LR node_modules temp_node_modules && mv temp_node_modules node_modules`
  pour convertir les symlinks en dossiers
  réels[\[9\]](https://stackoverflow.com/questions/74944668/how-to-deploy-azure-function-with-pnpm-and-rush#:~:text=You%20can%20use%20%60cp%20,to%20resolve%20the%20symlinks).
  Ceci peut fonctionner, mais avec PNPM cela revient presque à
  dupliquer toutes les dépendances -- à utiliser si les autres
  méthodes posent problème.

En pratique, la **Solution 1 (zip avec symlinks)** est simple et
efficace. Un développeur Next.js a rapporté qu'ajouter `-y --symlinks`
lors du zip a résolu son problème de modules manquants au démarrage sur
Azure[\[6\]](https://www.reddit.com/r/nextjs/comments/1k33l27/azure_we_app_deploment/#:~:text=Update%3A%20I%20finally%20figured%20out,Here%20the%20relevant%20configs).
Azure a confirmé que l'extraction ZIP standard ne préserve pas la
structure PNPM, d'où l'importance d'inclure tous les fichiers y compris
`.pnpm`[\[7\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=The%20error%20,This%20occurs%20because).

Après le déploiement, assurez-vous dans Azure que l'App Service utilise
la bonne version de Node. Vous pouvez définir l'option **Application
Settings** de votre Web App, par ex `WEBSITE_NODE_DEFAULT_VERSION = ~18`
(ou \~20/22 selon votre version Node). Si votre application côté serveur
a besoin de PNPM pour s'exécuter (normalement pas, puisqu'on déploie les
modules), vous pourriez ajouter `PNPM_VERSION = 7` (ou 8/10) en config,
mais en général ce n'est pas nécessaire une fois les modules
correctement
packagés[\[10\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=Verify%20Azure%20Configuration).

Enfin, un dernier point : dans l'exemple Next.js + Fastify, le frontend
appellera probablement l'API du backend. Assurez-vous de configurer le
CORS sur le serveur Fastify pour autoriser le domaine du front (le
domaine Azure Static Web App). Aussi, dans le code Next, utilisez l'URL
publique de l'API (par exemple une variable d'env pour l'URL
`https://<monbackend>.azurewebsites.net`) plutôt qu'un appel local.

## 4. Références utiles

- **Documentation Azure Static Web Apps -- Monorepo:** Configuration
  du workflow
  _multi-apps_[\[11\]](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration#:~:text=Property%20Description%20Required%20,No)
  et utilisation de
  `skip_app_build`[\[11\]](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration#:~:text=Property%20Description%20Required%20,No)[\[2\]](https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app#:~:text=action%3A%20,output_location%3A).
- **Article développeur (2025) -- PNPM sur Azure Static Web Apps:**
  Explique le manque de support PNPM et le contournement via
  `CUSTOM_BUILD_COMMAND`[\[1\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=PNPM%20support)[\[5\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=env%3A%20CUSTOM_BUILD_COMMAND%3A%20%27corepack%20enable%20%26%26,install%20%26%26%20pnpm%20run%20build).
- **Thread Reddit -- Déployer Next.js 15 avec PNPM sur Azure App
  Service:** Solution pour zip avec
  symlinks[\[6\]](https://www.reddit.com/r/nextjs/comments/1k33l27/azure_we_app_deploment/#:~:text=Update%3A%20I%20finally%20figured%20out,Here%20the%20relevant%20configs).
- **Microsoft Q&A -- Erreurs de modules manquants avec PNPM:**
  Conseils pour inclure `.pnpm` dans l'archive et corriger le workflow
  de
  build[\[7\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=The%20error%20,This%20occurs%20because)[\[12\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=Include%20ALL%20files%20%28including%20).

En suivant ces conseils, vous devriez pouvoir déployer votre monorepo
sur Azure sans encombre malgré PNPM. Bonne chance avec votre déploiement
!

[\[1\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=PNPM%20support)
[\[4\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=I%20had%20to%20dig%20into,environment%20variables%20to%20configure%20Oryx)
[\[5\]](https://dt.in.th/AzureStaticWebAppsSPA#:~:text=env%3A%20CUSTOM_BUILD_COMMAND%3A%20%27corepack%20enable%20%26%26,install%20%26%26%20pnpm%20run%20build)
Deploying modern Single Page Applications to Azure Static Web Apps \|
dt.in.th

<https://dt.in.th/AzureStaticWebAppsSPA>

[\[2\]](https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app#:~:text=action%3A%20,output_location%3A)
[\[3\]](https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app#:~:text=The%20,where%20your%20default%20file%20resides)
Deploying a Turborepo Next.js App to Azure Static Web App - Stack
Overflow

<https://stackoverflow.com/questions/76890164/deploying-a-turborepo-next-js-app-to-azure-static-web-app>

[\[6\]](https://www.reddit.com/r/nextjs/comments/1k33l27/azure_we_app_deploment/#:~:text=Update%3A%20I%20finally%20figured%20out,Here%20the%20relevant%20configs)
Azure We App Deploment : r/nextjs

<https://www.reddit.com/r/nextjs/comments/1k33l27/azure_we_app_deploment/>

[\[7\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=The%20error%20,This%20occurs%20because)
[\[10\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=Verify%20Azure%20Configuration)
[\[12\]](https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t#:~:text=Include%20ALL%20files%20%28including%20)
IS IT POSSIBLE TO DEPLOY A PNPM BASED NEXTJS APP TO THE WEB APP
SERVICE? - Microsoft Q&A

<https://learn.microsoft.com/en-us/answers/questions/2259526/is-it-possible-to-deploy-a-pnpm-based-nextjs-app-t>

[\[8\]](https://github.com/Azure/static-web-apps/issues/1594#:~:text=Describe%20alternatives%20you%27ve%20considered)
Be able use pnpm with static Web Apps CI/CD Actions -
https://github.com/Azure/static-web-apps-deploy · Issue #1594 ·
Azure/static-web-apps · GitHub

<https://github.com/Azure/static-web-apps/issues/1594>

[\[9\]](https://stackoverflow.com/questions/74944668/how-to-deploy-azure-function-with-pnpm-and-rush#:~:text=You%20can%20use%20%60cp%20,to%20resolve%20the%20symlinks)
node.js - How to deploy Azure function with pnpm and rush? - Stack
Overflow

<https://stackoverflow.com/questions/74944668/how-to-deploy-azure-function-with-pnpm-and-rush>

[\[11\]](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration#:~:text=Property%20Description%20Required%20,No)
Build configuration for Azure Static Web Apps \| Microsoft Learn

<https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration>
