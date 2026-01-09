-- Migration to support breaks and admin user creation

-- 1. Add breaks column to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS breaks JSONB DEFAULT '[]'::jsonb;

-- 2. Create function to create auth user and profile from admin interface
CREATE OR REPLACE FUNCTION create_user_admin(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role user_role DEFAULT 'collaborator'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if the caller is an admin or super_admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) AND (SELECT count(*) FROM profiles) > 0 THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create users.';
    END IF;

    -- Create user in auth.users
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
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        format('{"first_name":"%s","last_name":"%s"}', p_first_name, p_last_name)::jsonb,
        false,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;

    -- Create profile
    INSERT INTO profiles (id, first_name, last_name, role, status)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active');

    RETURN new_user_id;
END;
$$;
