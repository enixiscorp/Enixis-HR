-- ============================================================
-- SCRIPT DE CONFIGURATION COMPTE SUPER ADMIN
-- Email: contacteccorp@gmail.com
-- Mot de passe: @dminhreni26xis**
-- ============================================================
-- IMPORTANT: Exécutez ce script dans Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
    target_email TEXT := 'contacteccorp@gmail.com';
    target_password TEXT := '@dminhreni26xis**';
    user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'CONFIGURATION DU COMPTE SUPER ADMIN';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Email: %', target_email;
    RAISE NOTICE 'Configuration en cours...';
    RAISE NOTICE '';

    -- ÉTAPE 1: Vérifier si l'utilisateur existe dans auth.users
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = target_email;

    IF user_id IS NULL THEN
        -- L'utilisateur n'existe pas, on le crée
        RAISE NOTICE '📝 Création du compte utilisateur...';
        
        -- Insérer dans auth.users avec le mot de passe
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            target_email,
            crypt(target_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO user_id;
        
        RAISE NOTICE '✅ Compte créé avec succès';
        RAISE NOTICE '   ID: %', user_id;
    ELSE
        -- L'utilisateur existe, on met à jour son mot de passe
        RAISE NOTICE '✅ Utilisateur trouvé: %', user_id;
        RAISE NOTICE '🔐 Mise à jour du mot de passe...';
        
        UPDATE auth.users
        SET 
            encrypted_password = crypt(target_password, gen_salt('bf')),
            updated_at = NOW(),
            email_confirmed_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE '✅ Mot de passe mis à jour';
    END IF;

    RAISE NOTICE '';

    -- ÉTAPE 2: Créer ou mettre à jour le profil
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;

    IF NOT profile_exists THEN
        RAISE NOTICE '📝 Création du profil super_admin...';
        
        INSERT INTO profiles (
            id,
            first_name,
            last_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'Admin',
            'HERIX',
            'super_admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Profil créé';
    ELSE
        RAISE NOTICE '📝 Mise à jour du profil vers super_admin...';
        
        UPDATE profiles
        SET 
            role = 'super_admin',
            updated_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE '✅ Profil mis à jour';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ CONFIGURATION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Vos identifiants de connexion:';
    RAISE NOTICE '  📧 Email: %', target_email;
    RAISE NOTICE '  🔑 Mot de passe: %', target_password;
    RAISE NOTICE '  👑 Rôle: super_admin';
    RAISE NOTICE '';
    RAISE NOTICE '➡️  PROCHAINES ÉTAPES:';
    RAISE NOTICE '  1. Allez sur: http://localhost:5173/login';
    RAISE NOTICE '  2. Entrez vos identifiants';
    RAISE NOTICE '  3. Vous serez redirigé vers /dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Vous avez maintenant un accès complet à la plateforme !';
    RAISE NOTICE '';
END $$;

-- ÉTAPE 3: Vérifier les politiques RLS (pour être sûr)
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'VÉRIFICATION DES POLITIQUES RLS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';

    -- Enable RLS sur les tables (avec vérification d'existence)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') THEN
        ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'absences') THEN
        ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prestations') THEN
        ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Policy profiles: SELECT
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' 
        AND policyname = 'Users can view own profile and admins can view all'
    ) THEN
        CREATE POLICY "Users can view own profile and admins can view all" ON profiles
            FOR SELECT
            USING (
                id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Users can view own profile and admins can view all';
    END IF;

    -- Policy profiles: UPDATE
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' 
        AND policyname = 'Users can update own profile and admins can update all'
    ) THEN
        CREATE POLICY "Users can update own profile and admins can update all" ON profiles
            FOR UPDATE
            USING (
                id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Users can update own profile and admins can update all';
    END IF;

    -- Policy schedules
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'schedules' 
        AND policyname = 'Users can manage own schedules and admins can manage all'
    ) THEN
        CREATE POLICY "Users can manage own schedules and admins can manage all" ON schedules
            FOR ALL
            USING (
                user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Users can manage own schedules and admins can manage all';
    END IF;

    -- Policy payments
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'payments' 
        AND policyname = 'Users can view own payments and admins can view all'
    ) THEN
        CREATE POLICY "Users can view own payments and admins can view all" ON payments
            FOR SELECT
            USING (
                user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Users can view own payments and admins can view all';
    END IF;

    -- Policy absences
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'absences') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'absences' 
        AND policyname = 'Users can manage own absences and admins can manage all'
    ) THEN
        CREATE POLICY "Users can manage own absences and admins can manage all" ON absences
            FOR ALL
            USING (
                user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Users can manage own absences and admins can manage all';
    END IF;

    -- Policy prestations
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prestations') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'prestations' 
        AND policyname = 'Prestations viewable by all'
    ) THEN
        CREATE POLICY "Prestations viewable by all" ON prestations
            FOR SELECT
            USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Policy créée: Prestations viewable by all';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prestations') AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'prestations' 
        AND policyname = 'Prestations manageable by admins'
    ) THEN
        CREATE POLICY "Prestations manageable by admins" ON prestations
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
            );
        RAISE NOTICE '✅ Policy créée: Prestations manageable by admins';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Toutes les politiques RLS sont en place';
    RAISE NOTICE '';
END $$;

-- ÉTAPE 4: Afficher le résumé final
SELECT 
    '============================================================' as separator
UNION ALL
SELECT 'RÉSUMÉ FINAL - COMPTE CONFIGURÉ'
UNION ALL
SELECT '============================================================'
UNION ALL
SELECT ''
UNION ALL
SELECT '📧 Email: contacteccorp@gmail.com'
UNION ALL
SELECT '🔑 Mot de passe: @dminhreni26xis**'
UNION ALL
SELECT '👑 Rôle: super_admin'
UNION ALL
SELECT ''
UNION ALL
SELECT '✅ Vous pouvez maintenant vous connecter !'
UNION ALL
SELECT ''
UNION ALL
SELECT '🌐 URL: http://localhost:5173/login'
UNION ALL
SELECT '';

-- Afficher les détails du compte
SELECT 
    u.email as "📧 Email",
    p.first_name || ' ' || p.last_name as "👤 Nom",
    p.role as "👑 Rôle",
    CASE 
        WHEN u.encrypted_password IS NOT NULL THEN '✅ Configuré'
        ELSE '❌ Manquant'
    END as "🔑 Mot de passe",
    u.created_at::date as "📅 Créé le"
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'contacteccorp@gmail.com';
