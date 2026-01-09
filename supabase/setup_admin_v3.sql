-- ========================================================
-- Script de Configuration et Diagnostic (v4.5)
-- ========================================================

-- 1. Réparation de la structure des tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'admin', 'super_admin')),
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    platform_name TEXT DEFAULT 'Enixis HR'
);

-- 2. Activation du Super Admin par Email
DO $$
DECLARE
    target_id UUID;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = 'contacteccorp@gmail.com' LIMIT 1;
    
    IF target_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, first_name, last_name, role, status)
        VALUES (target_id, 'Admin', 'Enixis', 'super_admin', 'active')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';
    END IF;
END $$;

-- 3. Initialisation Settings
INSERT INTO public.platform_settings (platform_name)
SELECT 'Enixis HR' WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- 4. VERIFICATION FINALE (Indispensable pour voir si ça a marché)
-- Le résultat s'affichera dans l'onglet "Results" (Tableau)
SELECT 
    'UTILISATEUR' as type,
    email, 
    id as uid,
    'Present dans Auth' as status
FROM auth.users 
WHERE email = 'contacteccorp@gmail.com'

UNION ALL

SELECT 
    'PROFIL' as type,
    '---' as email,
    id as uid,
    role || ' - ' || status as status
FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'contacteccorp@gmail.com');
