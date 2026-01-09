-- ========================================================
-- Script de Configuration Définitive - Enixis HR (v4.8)
-- ========================================================
-- RÉSOLUTION DÉFINITIVE ET CORRECTION SYNTAXIQUE
-- ========================================================

-- 1. Nettoyage des anciennes politiques
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles_Read_All" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Update_Self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Super_Admin" ON public.profiles;

-- 2. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. NOUVELLES POLITIQUES ANTI-RECURSION
CREATE POLICY "Profiles_Read_All" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles_Update_Self" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Accès total pour contacteccorp@gmail.com (Via JWT pour éviter la récursion)
CREATE POLICY "Profiles_Super_Admin" ON public.profiles
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com'
    );

-- 4. RÉPARATION PLATFORM_SETTINGS
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings_Read" ON public.platform_settings;
DROP POLICY IF EXISTS "Settings_Admin" ON public.platform_settings;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings_Read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Settings_Admin" ON public.platform_settings FOR ALL USING (
    (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com'
);

-- 5. Activation Super Admin
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

-- 6. Initialisation Settings
INSERT INTO public.platform_settings (platform_name)
SELECT 'Enixis HR' WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- 7. VERIFICATION (Correction de l'ambiguité 'role')
SELECT 
    u.email, 
    p.role as profile_role, 
    p.id as profile_id 
FROM public.profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'contacteccorp@gmail.com';
