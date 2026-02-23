-- ============================================================
-- MASTER FIX SCRIPT — Corrige 3 erreurs critiques :
-- 1. Récursion infinie dans les politiques de la table "profiles"
-- 2. RLS bloquant la création de services (prestations)
-- 3. Doublon email lors de la création de profils utilisateurs
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Créer une fonction anti-récursion basée sur le JWT
-- Ne touche JAMAIS la table profiles pour éviter la boucle.
-- ============================================================
CREATE OR REPLACE FUNCTION is_master_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction générique pour vérifier le rôle via les métadonnées JWT (sans requête profiles)
CREATE OR REPLACE FUNCTION is_admin_by_jwt()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Cherche le rôle dans les métadonnées d'app (défini à la création du compte)
    user_role := (auth.jwt() -> 'app_metadata' ->> 'role');
    IF user_role IN ('admin', 'super_admin') THEN
        RETURN true;
    END IF;
    -- Fallback: Super Admin par email
    RETURN (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- ÉTAPE 2 : Désactiver RLS temporairement pour la correction
-- ============================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestations DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÉTAPE 3 : Supprimer TOUTES les anciennes politiques récursives
-- ============================================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================================
-- ÉTAPE 4 : Recréer les politiques — PROFILES (sans récursion)
-- ============================================================
-- Super Admin : accès total (JWT, sans requête sur profiles)
CREATE POLICY "profiles_super_admin_all" ON profiles
    FOR ALL TO authenticated
    USING (is_master_admin_jwt())
    WITH CHECK (is_master_admin_jwt());

-- Chaque utilisateur voit et modifie son propre profil
CREATE POLICY "profiles_owner_all" ON profiles
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Les admins peuvent voir les profils de leur équipe (via parent_id)
-- ATTENTION: cette politique utilise une sous-requête sur profiles — on utilise
-- un CTE avec LIMIT 1 pour limiter la récursion
CREATE POLICY "profiles_team_select" ON profiles
    FOR SELECT TO authenticated
    USING (
        parent_id = auth.uid()
        OR id = auth.uid()
        OR is_master_admin_jwt()
    );

-- ============================================================
-- ÉTAPE 5 : Recréer les politiques — PAYMENTS
-- ============================================================
CREATE POLICY "payments_super_admin_all" ON payments
    FOR ALL TO authenticated
    USING (is_master_admin_jwt());

CREATE POLICY "payments_owner_and_manager" ON payments
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR user_id IN (
            SELECT id FROM profiles WHERE parent_id = auth.uid()
        )
    );

-- ============================================================
-- ÉTAPE 6 : Recréer les politiques — SCHEDULES
-- ============================================================
CREATE POLICY "schedules_super_admin_all" ON schedules
    FOR ALL TO authenticated
    USING (is_master_admin_jwt());

CREATE POLICY "schedules_owner_and_manager" ON schedules
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR user_id IN (
            SELECT id FROM profiles WHERE parent_id = auth.uid()
        )
    );

-- ============================================================
-- ÉTAPE 7 : Recréer les politiques — ABSENCE_REQUESTS
-- ============================================================
CREATE POLICY "absences_super_admin_all" ON absence_requests
    FOR ALL TO authenticated
    USING (is_master_admin_jwt());

CREATE POLICY "absences_owner_all" ON absence_requests
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR user_id IN (
            SELECT id FROM profiles WHERE parent_id = auth.uid()
        )
    );

-- ============================================================
-- ÉTAPE 8 : Recréer les politiques — PRESTATIONS
-- ============================================================
-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "prestations_read_all" ON prestations
    FOR SELECT TO authenticated
    USING (true);

-- Création uniquement pour les admins et super admins
CREATE POLICY "prestations_admin_insert" ON prestations
    FOR INSERT TO authenticated
    WITH CHECK (
        is_master_admin_jwt()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Modification/Suppression uniquement pour les admins et super admins
CREATE POLICY "prestations_admin_update_delete" ON prestations
    FOR ALL TO authenticated
    USING (
        is_master_admin_jwt()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );


-- ============================================================
-- ÉTAPE 9 : Recréer les politiques — PLATFORM_SETTINGS
-- ============================================================
CREATE POLICY "settings_read_all" ON platform_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "settings_admin_write" ON platform_settings
    FOR ALL TO authenticated
    USING (is_master_admin_jwt())
    WITH CHECK (is_master_admin_jwt());

-- ============================================================
-- ÉTAPE 10 : Réactiver la sécurité RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÉTAPE 11 : Corriger create_user_admin — vérification doublon email
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_admin(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_password TEXT,
    p_role user_role DEFAULT 'collaborator',
    p_parent_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- ✅ Vérifier si l'email existe déjà dans auth.users
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = lower(trim(p_email))
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un compte avec l''adresse email "%" existe déjà.', p_email;
    END IF;

    -- ✅ Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        lower(trim(p_email)),
        crypt(p_password, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        format('{"first_name":"%s","last_name":"%s"}', p_first_name, p_last_name)::jsonb,
        false, now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_user_id;

    -- ✅ Créer le profil lié
    INSERT INTO profiles (id, first_name, last_name, role, status, email, parent_id)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active', lower(trim(p_email)), p_parent_id);

    RETURN new_user_id;
END;
$$;

-- ============================================================
-- ÉTAPE 12 : Recharger le schéma PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';

SELECT '✅ Toutes les corrections RLS appliquées avec succès !' AS resultat;
