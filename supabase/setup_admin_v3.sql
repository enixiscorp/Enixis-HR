-- ========================================================
-- Script de Configuration Définitive - Enixis HR (v3)
-- ========================================================
-- Ce script assure que votre base de données est prête.
-- Il ne peut PAS créer le mot de passe (sécurité Supabase),
-- mais il prépare tout pour que la connexion fonctionne.
-- ========================================================

-- 1. Configuration de la table PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    address TEXT,
    role TEXT DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'admin', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activation du RLS sur PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Suppression des anciennes politiques pour repartir à neuf
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;

-- 4. Nouvelles politiques RLS simplifiées et robustes
CREATE POLICY "Profiles viewable by authenticated" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins full access" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- 5. Lier l'email contacteccorp@gmail.com au rôle SUPER_ADMIN
-- NOTE : Vous devez d'abord avoir créé cet utilisateur dans 'Authentication > Users'
-- Si l'utilisateur existe déjà, ce script mettra à jour son rôle.
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'contacteccorp@gmail.com';
    
    IF user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, first_name, last_name, role, status)
        VALUES (user_id, 'Admin', 'Enixis', 'super_admin', 'active')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';
        RAISE NOTICE 'Profil Super Admin configuré pour contacteccorp@gmail.com';
    ELSE
        RAISE NOTICE 'ATTENTION : L''utilisateur contacteccorp@gmail.com n''existe pas encore dans Authentication > Users';
    END IF;
END $$;


-- ========================================================
-- PROCÉDURE DE RÉSOLUTION (À FAIRE DANS LE DASHBOARD)
-- ========================================================
-- 1. Allez dans 'Authentication' > 'Users'.
-- 2. Si 'contacteccorp@gmail.com' n'existe pas :
--    - Cliquez sur 'Add User' > 'Create new user'.
--    - Entrez l'email et un mot de passe (ex: Enixis2026!).
--    - Décochez 'Auto-confirm user' si vous voulez tester l'email, 
--      MAIS il est recommandé de le COCHER pour un déploiement rapide.
-- 3. Si l'utilisateur existe déjà :
--    - Cliquez sur l'utilisateur.
--    - Cliquez sur 'Actions' > 'Reset Password'.
--    - Ou supprimez-le et recréez-le pour être sûr du mot de passe.
-- 4. REVENIR ICI et exécuter ce script SQL pour lier le profil.
-- ========================================================
