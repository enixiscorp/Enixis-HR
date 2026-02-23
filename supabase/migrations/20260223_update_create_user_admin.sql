-- Update create_user_admin to include parent_id for team linkage
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
BEGIN
    -- Check if caller is admin or if it's the first user
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) AND (SELECT count(*) FROM profiles) > 0 THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create users.';
    END IF;

    -- Create user in auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        is_super_admin, created_at, updated_at, confirmation_token, email_change, 
        email_change_token_new, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 
        'authenticated', p_email, crypt(p_password, gen_salt('bf')), now(), now(), 
        now(), '{"provider":"email","providers":["email"]}', 
        format('{"first_name":"%s","last_name":"%s"}', p_first_name, p_last_name)::jsonb, 
        false, now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_user_id;

    -- Create profile with email and parent_id
    INSERT INTO profiles (id, first_name, last_name, role, status, email, parent_id)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active', p_email, p_parent_id);

    RETURN new_user_id;
END;
$$;
