# Guide de déploiement sur Render

## Étapes pour déployer l'application

### 1. Connecter le projet à GitHub

1. Dans Lovable, cliquez sur le bouton **GitHub** en haut à droite
2. Cliquez sur **Connect to GitHub**
3. Autorisez l'application Lovable sur GitHub
4. Sélectionnez votre compte GitHub
5. Cliquez sur **Create Repository** pour créer un nouveau dépôt avec le code du projet

### 2. Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Créez un compte gratuit (vous pouvez vous connecter avec GitHub)

### 3. Déployer sur Render

1. Sur Render, cliquez sur **New +** puis **Web Service**
2. Connectez votre compte GitHub si ce n'est pas déjà fait
3. Sélectionnez le dépôt GitHub de votre projet Aloe Location
4. Configurez le service :
   - **Name**: `aloelocation-sales` (ou le nom de votre choix)
   - **Region**: `Frankfurt` (ou la région la plus proche)
   - **Branch**: `main` (ou votre branche par défaut)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Plan**: `Free`

### 4. Configurer les variables d'environnement

Dans la section **Environment** de Render, ajoutez les variables suivantes :

```
VITE_SUPABASE_PROJECT_ID=jwvkvyhwhpbyruattzbx
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dmt2eWh3aHBieXJ1YXR0emJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTg1MDIsImV4cCI6MjA3Mjc3NDUwMn0.zmkDfwu1JalKorw5sl3VBaj28C6qaifrRPU-aGT6Et8
VITE_SUPABASE_URL=https://jwvkvyhwhpbyruattzbx.supabase.co
```

### 5. Déployer

1. Cliquez sur **Create Web Service**
2. Render va automatiquement déployer votre application
3. Le premier déploiement peut prendre 5-10 minutes
4. Une fois terminé, vous recevrez une URL publique (ex: `https://aloelocation-sales.onrender.com`)

## Déploiements automatiques

- Chaque fois que vous modifiez le code dans Lovable, les changements sont automatiquement synchronisés avec GitHub
- Render détecte automatiquement les changements sur GitHub et redéploie l'application
- Vous pouvez suivre les déploiements dans le Dashboard Render

## Notes importantes

- Le plan gratuit de Render met les services en veille après 15 minutes d'inactivité
- Le premier chargement après inactivité peut prendre 30-60 secondes
- Pour éviter cela, vous pouvez passer au plan payant ($7/mois)

## Alternative : Déploiement via render.yaml

Si vous préférez utiliser le fichier `render.yaml` :

1. Sur Render, cliquez sur **New +** puis **Blueprint**
2. Connectez votre dépôt GitHub
3. Render détectera automatiquement le fichier `render.yaml` et créera le service
4. Ajoutez manuellement les variables d'environnement dans les paramètres du service

## Support

En cas de problème :
- Consultez les logs dans le Dashboard Render
- Vérifiez que toutes les variables d'environnement sont correctement configurées
- Assurez-vous que le build s'est terminé sans erreur
