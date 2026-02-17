-- Script de Correction Définitive des Accès Super Admin
-- Exécutez ce script dans la console SQL Supabase

-- 1. Vérifier si l'utilisateur existe
DO $$
DECLARE
    user_email TEXT := 'contacteccorp@gmail.com';
    user_id UUID;
BEGIN
    -- Chercher l'utilisateur dans auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ UTILISATEUR NON TROUVÉ: %', user_email;
        RAISE NOTICE 'Vous devez créer le compte via l''interface d''inscription';
    ELSE
        RAISE NOTICE '✅ Utilisateur trouvé: % (ID: %)', user_email, user_id;
        
        -- Vérifier le profil
        IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
            RAISE NOTICE '✅ Profil existe';
            
            -- Mettre à jour le rôle en super_admin
            UPDATE profiles 
            SET role = 'super_admin'
            WHERE id = user_id;
            
            RAISE NOTICE '✅ Rôle mis à jour vers SUPER_ADMIN';
        ELSE
            RAISE NOTICE '❌ PROFIL MANQUANT - Création du profil...';
            
            -- Créer le profil
            INSERT INTO profiles (id, email, first_name, last_name, role)
            VALUES (
                user_id,
                user_email,
                'Admin',
                'Enixis',
                'super_admin'
            );
            
            RAISE NOTICE '✅ Profil créé avec rôle SUPER_ADMIN';
        END IF;
    END IF;
END $$;

-- 2. Afficher les informations de l'utilisateur
SELECT 
    u.id,
    u.email,
    u.created_at as "Compte créé le",
    p.first_name || ' ' || p.last_name as "Nom complet",
    p.role as "Rôle actuel"
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'contacteccorp@gmail.com';

-- 3. Vérifier les politiques RLS pour les super_admin
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (
    policyname ILIKE '%admin%' 
    OR policyname ILIKE '%super%'
)
ORDER BY tablename, policyname;

-- 4. Si besoin, créer les politiques manquantes pour super_admin
DO $$
BEGIN
    -- Policy pour profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Super admins can view all profiles'
    ) THEN
        CREATE POLICY "Super admins can view all profiles" ON profiles
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
        RAISE NOTICE '✅ Policy créée: Super admins can view all profiles';
    END IF;

    -- Policy pour schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedules' 
        AND policyname = 'Super admins can manage all schedules'
    ) THEN
        CREATE POLICY "Super admins can manage all schedules" ON schedules
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Super admins can manage all schedules';
    END IF;

    -- Policy pour payments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments' 
        AND policyname = 'Admins can view all payments'
    ) THEN
        CREATE POLICY "Admins can view all payments" ON payments
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Admins can view all payments';
    END IF;
END $$;

-- 5. Vérification finale
SELECT '✅ VERIFICATION COMPLETE' as status;
SELECT 
    'Email: ' || email as info,
    'Rôle: ' || COALESCE(role, 'PAS DE ROLE!') as role_status
FROM profiles
WHERE email = 'contacteccorp@gmail.com';
