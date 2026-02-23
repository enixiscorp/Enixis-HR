-- FIX: create_user_admin - Handle email already exists
-- Provides a user-friendly error instead of a constraint violation

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
    existing_auth_user_id UUID;
    existing_profile_id UUID;
BEGIN
    -- ✅ 1. Check if caller is authorized (admin or super_admin)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) AND (SELECT count(*) FROM profiles) > 0 THEN
        RAISE EXCEPTION 'Non autorisé. Seuls les administrateurs peuvent créer des comptes.';
    END IF;

    -- ✅ 2. Check if email already exists in auth.users
    SELECT id INTO existing_auth_user_id 
    FROM auth.users 
    WHERE email = lower(trim(p_email)) 
    LIMIT 1;

    IF existing_auth_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un compte avec l''email "%" existe déjà. Veuillez utiliser un autre email.', p_email;
    END IF;

    -- ✅ 3. Check if email already exists in profiles (orphan record safety)
    SELECT id INTO existing_profile_id
    FROM profiles
    WHERE email = lower(trim(p_email))
    LIMIT 1;

    IF existing_profile_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un profil avec l''email "%" existe déjà dans la base de données.', p_email;
    END IF;

    -- ✅ 4. Create user in auth.users now that we know email is unique
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

    -- ✅ 5. Create profile linked to this new auth user
    INSERT INTO profiles (id, first_name, last_name, role, status, email, parent_id, visible_password)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active', lower(trim(p_email)), p_parent_id, p_password);

    RETURN new_user_id;
EXCEPTION
    -- Re-throw custom exceptions as-is 
    WHEN OTHERS THEN
        RAISE;
END;
$$;

SELECT '✅ create_user_admin: duplicate email check added' AS result;
