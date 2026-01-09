# 🪜 Pas à pas : Configurer Supabase sur Vercel

Si Vercel vous dit que la variable est "sécurisée", c'est tout à fait normal ! Cela signifie simplement qu'une fois enregistrée, la valeur sera masquée pour des raisons de sécurité.

Voici comment procéder exactement :

### Étape 1 : Récupérer les clés sur Supabase
1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com/).
2. Sélectionnez votre projet **Enixis HR**.
3. Dans le menu de gauche, cliquez sur la roue dentée **Project Settings** (en bas).
4. Cliquez sur l'onglet **API**.
5. Vous y trouverez deux valeurs :
    - **Project URL** (ex: `https://xyz.supabase.co`)
    - **anon (public) key** (la longue chaîne de caractères)

### Étape 2 : Ajouter les variables sur Vercel
1. Sur votre [Dashboard Vercel](https://vercel.com/dashboard), ouvrez votre projet.
2. Cliquez sur l'onglet **Settings** en haut.
3. Dans le menu de gauche, cliquez sur **Environment Variables**.
4. Remplissez le formulaire "Add New" deux fois :

**Pour l'URL :**
- **Key** : `VITE_SUPABASE_URL`
- **Value** : (Copiez le "Project URL" de Supabase)
- Cliquez sur **Add**.

**Pour la Clé :**
- **Key** : `VITE_SUPABASE_ANON_KEY`
- **Value** : (Copiez la "anon public key" de Supabase)
- Cliquez sur **Add**.

> [!NOTE]
> C'est à ce moment que Vercel peut afficher un badge "Secret" ou "Encrypted". C'est normal, ignorez l'avertissement et cliquez sur **Add**.

### Étape 3 : Déclencher un nouveau déploiement
Comme ces variables sont utilisées lors de la compilation (build), Vercel doit "reconstruire" l'application pour les prendre en compte.

1. Allez dans l'onglet **Deployments** sur Vercel.
2. Cliquez sur les trois points `...` à droite du dernier déploiement.
3. Choisissez **Redeploy**.
4. Cliquez sur le bouton **Redeploy** dans la fenêtre qui s'ouvre.

Une fois terminé, votre Dashboard Enixis HR devrait s'afficher correctement !
