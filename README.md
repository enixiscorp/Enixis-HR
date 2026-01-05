# Enixis HR

Plateforme ERP Ressources Humaines pour la gestion des collaborateurs freelance et partenaires.

## 🚀 Technologies

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Routing**: React Router

## 📋 Prérequis

- Node.js (LTS version recommandée)
- Un projet Supabase configuré

## 🛠️ Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**
   
   Créez un fichier `.env` à la racine du projet :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-anon
   ```

3. **Configurer la base de données**
   
   Exécutez le script SQL dans `supabase/schema.sql` dans votre Supabase SQL Editor pour créer les tables et les politiques RLS.

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

## 📁 Structure du projet

```
Enixis-HR/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── ui/          # Composants shadcn/ui
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # Contextes React
│   │   └── AuthContext.tsx
│   ├── lib/             # Utilitaires
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/           # Pages de l'application
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── types/           # Types TypeScript
│   │   └── database.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── schema.sql       # Schéma de base de données
└── package.json
```

## 🔐 Authentification

L'application utilise Supabase Auth avec :
- Connexion par email/mot de passe
- Support 2FA (à implémenter)
- Gestion des sessions
- Protection des routes basée sur les rôles

## 👥 Rôles utilisateurs

- **Collaborateur** : Accès à son profil, revenus et planning
- **Admin** : Gestion des collaborateurs, horaires et paiements
- **Super Admin** : Accès complet au système

## 📝 License

© 2026 Enixis Corp. Tous droits réservés.
