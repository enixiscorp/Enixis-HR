# Enixis HR - Déploiement Vercel

## Variables d'environnement à configurer sur Vercel

Allez dans votre projet Vercel → Settings → Environment Variables et ajoutez :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

## Configuration du build

Le fichier `vercel.json` a été créé avec la configuration appropriée.

## Commandes de build

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Redéploiement

Une fois les variables d'environnement configurées, redéployez depuis le dashboard Vercel ou poussez un nouveau commit.
