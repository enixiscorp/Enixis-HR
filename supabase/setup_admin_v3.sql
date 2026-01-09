-- ========================================================
-- Script de Diagnostic et Configuration (v4.4)
-- ========================================================

-- ÉTAPE A : DIAGNOSTIC (Regardez l'onglet 'Messages' après l'exécution)
DO $$
DECLARE
    user_count INTEGER;
    current_admin_exists BOOLEAN;
BEGIN
    SELECT count(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Nombre d''utilisateurs dans auth.users : %', user_count;
    
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'contacteccorp@gmail.com') INTO current_admin_exists;
    IF current_admin_exists THEN
        RAISE NOTICE 'SUCCÈS : L''utilisateur contacteccorp@gmail.com est présent dans ce projet.';
    ELSE
        RAISE NOTICE 'ÉCHEC : L''utilisateur contacteccorp@gmail.com n''EXISTE PAS dans ce projet Supabase.';
        RAISE NOTICE 'Vérifiez que vous n''êtes pas sur un autre projet ou une autre branche.';
    END IF;
END $$;

-- ÉTAPE B : RÉPARATION DE LA STRUCTURE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- On définit d'abord la PK
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'collaborator'
);

-- On s'assure que la clé étrangère est correcte
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ÉTAPE C : INSERTION SÉCURISÉE
DO $$
DECLARE
    target_id UUID;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = 'contacteccorp@gmail.com' LIMIT 1;
    
    IF target_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, first_name, last_name, role)
        VALUES (target_id, 'Admin', 'Enixis', 'super_admin')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
        RAISE NOTICE 'Profil mis à jour pour ID: %', target_id;
    END IF;
END $$;

-- ÉTAPE D : POLITIQUES RLS (Nécessaire pour le Dashboard)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users" ON public.profiles
    FOR SELECT USING (true); -- Tout le monde peut voir les profils (nécessaire pour CollaboratorSelect)

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ÉTAPE E : PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    platform_name TEXT DEFAULT 'Enixis HR'
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON platform_settings;
CREATE POLICY "Public read" ON platform_settings FOR SELECT USING (true);

INSERT INTO public.platform_settings (platform_name)
SELECT 'Enixis HR' WHERE NOT EXISTS (SELECT 1 FROM platform_settings);
