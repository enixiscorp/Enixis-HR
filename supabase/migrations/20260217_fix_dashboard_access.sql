-- ==============================================================
-- SCRIPT DE CORRECTION DÉFINITIVE DES ACCÈS DASHBOARD
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- ==============================================================

-- ÉTAPE 1: Vérifier si l'utilisateur existe
DO $$
DECLARE
    target_email TEXT := 'contacteccorp@gmail.com';
    found_user_id UUID;
    found_profile RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC ACCÈS DASHBOARD';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Chercher dans auth.users
    SELECT id INTO found_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF found_user_id IS NULL THEN
        RAISE NOTICE '❌ PROBLÈME: Utilisateur "%" NON TROUVÉ dans auth.users', target_email;
        RAISE NOTICE '';
        RAISE NOTICE '➡️  SOLUTION: Vous devez créer un compte via /signup';
        RAISE NOTICE '   1. Allez sur http://localhost:5173/signup';
        RAISE NOTICE '   2. Créez votre compte avec l''email: %', target_email;
        RAISE NOTICE '   3. Revenez exécuter ce script après création';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '✅ Utilisateur trouvé: %', target_email;
        RAISE NOTICE '   ID: %', found_user_id;
        RAISE NOTICE '';
        
        -- Vérifier le profil
        SELECT * INTO found_profile 
        FROM profiles 
        WHERE id = found_user_id;
        
        IF NOT FOUND THEN
            RAISE NOTICE '❌ PROBLÈME: Profil MANQUANT pour cet utilisateur';
            RAISE NOTICE '';
            RAISE NOTICE '➡️  CRÉATION DU PROFIL...';
            
            -- Créer le profil avec rôle super_admin
            INSERT INTO profiles (
                id, 
                email, 
                first_name, 
                last_name, 
                role,
                created_at,
                updated_at
            ) VALUES (
                found_user_id,
                target_email,
                'Admin',
                'HERIX',
                'super_admin',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '✅ Profil créé avec succès';
            RAISE NOTICE '   Rôle: super_admin';
            RAISE NOTICE '';
        ELSE
            RAISE NOTICE '✅ Profil existe';
            RAISE NOTICE '   Nom: % %', found_profile.first_name, found_profile.last_name;
            RAISE NOTICE '   Rôle actuel: %', found_profile.role;
            RAISE NOTICE '';
            
            -- Mettre à jour le rôle si pas super_admin
            IF found_profile.role != 'super_admin' THEN
                RAISE NOTICE '⚠️  Rôle incorrect détecté: %', found_profile.role;
                RAISE NOTICE '➡️  MISE À JOUR vers super_admin...';
                
                UPDATE profiles 
                SET role = 'super_admin',
                    updated_at = NOW()
                WHERE id = found_user_id;
                
                RAISE NOTICE '✅ Rôle mis à jour vers: super_admin';
                RAISE NOTICE '';
            END IF;
        END IF;
        
        -- Vérifier le mot de passe
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = found_user_id AND encrypted_password IS NULL) THEN
            RAISE NOTICE '❌ PROBLÈME: Mot de passe MANQUANT';
            RAISE NOTICE '➡️  Réinitialisez votre mot de passe via /signup ou contactez l''admin';
        ELSE
            RAISE NOTICE '✅ Mot de passe configuré';
        END IF;
        RAISE NOTICE '';
    END IF;
END $$;

-- ÉTAPE 2: Vérifier et créer les politiques RLS essentielles
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION DES POLITIQUES RLS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Policy profiles: SELECT pour super_admin
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'profiles' 
        AND policyname = 'Super admins can view all profiles'
    ) THEN
        CREATE POLICY "Super admins can view all profiles" ON profiles
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
                OR id = auth.uid()
            );
        RAISE NOTICE '✅ Policy créée: Super admins can view all profiles';
    ELSE
        RAISE NOTICE '✅ Policy existe: Super admins can view all profiles';
    END IF;

    -- Policy profiles: UPDATE pour super_admin
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'profiles' 
        AND policyname = 'Super admins can update all profiles'
    ) THEN
        CREATE POLICY "Super admins can update all profiles" ON profiles
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
                OR id = auth.uid()
            );
        RAISE NOTICE '✅ Policy créée: Super admins can update all profiles';
    ELSE
        RAISE NOTICE '✅ Policy existe: Super admins can update all profiles';
    END IF;

    -- Policy schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'schedules' 
        AND policyname = 'Admins can manage all schedules'
    ) THEN
        CREATE POLICY "Admins can manage all schedules" ON schedules
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
                OR user_id = auth.uid()
            );
        RAISE NOTICE '✅ Policy créée: Admins can manage all schedules';
    ELSE
        RAISE NOTICE '✅ Policy existe: Admins can manage all schedules';
    END IF;

    -- Policy payments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'payments' 
        AND policyname = 'Admins can view all payments'
    ) THEN
        CREATE POLICY "Admins can view all payments" ON payments
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
                )
                OR user_id = auth.uid()
            );
        RAISE NOTICE '✅ Policy créée: Admins can view all payments';
    ELSE
        RAISE NOTICE '✅ Policy existe: Admins can view all payments';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ÉTAPE 3: Afficher le résumé final
DO $$
DECLARE
    final_check RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    SELECT 
        u.email,
        u.id as user_id,
        p.first_name,
        p.last_name,
        p.role,
        CASE 
            WHEN u.encrypted_password IS NOT NULL THEN '✅ Configuré'
            ELSE '❌ Manquant'
        END as password_status,
        u.created_at::date as compte_cree_le
    INTO final_check
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.email = 'contacteccorp@gmail.com';
    
    IF FOUND THEN
        RAISE NOTICE 'Email         : %', final_check.email;
        RAISE NOTICE 'User ID       : %', final_check.user_id;
        RAISE NOTICE 'Nom           : % %', final_check.first_name, final_check.last_name;
        RAISE NOTICE 'Rôle          : %', COALESCE(final_check.role, '❌ PAS DE PROFIL');
        RAISE NOTICE 'Mot de passe  : %', final_check.password_status;
        RAISE NOTICE 'Créé le       : %', final_check.compte_cree_le;
        RAISE NOTICE '';
        
        IF final_check.role = 'super_admin' AND final_check.password_status LIKE '✅%' THEN
            RAISE NOTICE '🎉 TOUT EST BON ! Vous pouvez vous connecter maintenant.';
            RAISE NOTICE '';
            RAISE NOTICE '➡️  PROCHAINES ÉTAPES:';
            RAISE NOTICE '   1. Allez sur http://localhost:5173/login';
            RAISE NOTICE '   2. Email: %', final_check.email;
            RAISE NOTICE '   3. Entrez votre mot de passe';
            RAISE NOTICE '   4. Vous serez redirigé vers /dashboard';
        ELSE
            RAISE NOTICE '⚠️  PROBLÈMES DÉTECTÉS:';
            IF final_check.role IS NULL THEN
                RAISE NOTICE '   - Profil manquant';
            ELSIF final_check.role != 'super_admin' THEN
                RAISE NOTICE '   - Rôle incorrect: %', final_check.role;
            END IF;
            IF final_check.password_status LIKE '❌%' THEN
                RAISE NOTICE '   - Mot de passe manquant';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE '❌ UTILISATEUR NON TROUVÉ: contacteccorp@gmail.com';
        RAISE NOTICE '';
        RAISE NOTICE '➡️  ACTION REQUISE:';
        RAISE NOTICE '   Créez votre compte via http://localhost:5173/signup';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ÉTAPE 4: Lister tous les utilisateurs (pour debug)
SELECT 
    '🔍 LISTE DE TOUS LES UTILISATEURS' as info;

SELECT 
    u.email,
    COALESCE(p.role, 'PAS DE PROFIL') as role,
    u.created_at::date as cree_le
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
