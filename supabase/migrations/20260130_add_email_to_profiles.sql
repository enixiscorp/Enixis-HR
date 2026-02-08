-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync existing emails from auth.users to profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update create_user_admin function to include email in profiles
CREATE OR REPLACE FUNCTION create_user_admin(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_password TEXT,
    p_role user_role DEFAULT 'collaborator'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    new_user_id UUID;
BEGIN
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

    -- Create profile with email
    INSERT INTO profiles (id, first_name, last_name, role, status, email)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active', p_email);

    RETURN new_user_id;
END;
$$;

-- Create trigger to keep profiles.email in sync with auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();
