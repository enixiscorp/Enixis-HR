-- Migration v5: Finalize RLS and Admin Access
-- This script ensures admins can view everything they need to manage the platform.

-- 1. Redefine create_user_admin (Just in case, with proper grants)
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

    INSERT INTO profiles (id, first_name, last_name, role, status)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active');

    RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_admin(TEXT, TEXT, TEXT, TEXT, user_role) TO authenticated;

-- 2. Ensure RLS Policies for Admins on all relevant tables
-- Use DO blocks to avoid "already exists" errors

-- Schedules
DO $$ BEGIN
    CREATE POLICY "Admins can view all schedules" ON schedules FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update all schedules" ON schedules FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert schedules" ON schedules FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payments
DO $$ BEGIN
    CREATE POLICY "Admins can view all payments" ON payments FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert payments" ON payments FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Revenues
DO $$ BEGIN
    CREATE POLICY "Admins can view all revenues" ON revenues FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert revenues" ON revenues FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Absence Requests (already in v4, but ensured here)
DO $$ BEGIN
    CREATE POLICY "Admins can view all absence_requests" ON absence_requests FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update absence_requests" ON absence_requests FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
