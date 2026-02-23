-- SUPER ADMIN RECOVERY SCRIPT V4 (RECURSION-SHIELD)
-- Solves "infinite recursion detected in policy for relation profiles"
-- Adds visible_password column for Super Admin.

-- 1. Helper function without ANY profiles table reference (to break recursion)
CREATE OR REPLACE FUNCTION is_master_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
    -- Only check the JWT email (secure and recursion-free)
    RETURN (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. DISABLE RLS TEMPORARILY
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests DISABLE ROW LEVEL SECURITY;

-- 3. SCHEMA UPDATES (Password Visibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'visible_password') THEN
        ALTER TABLE profiles ADD COLUMN visible_password TEXT;
    END IF;
END $$;

-- 4. RESTORE MASTER PROFILE
UPDATE profiles 
SET 
    first_name = 'Edem Cyrille',
    last_name = 'SOSSOUVI',
    role = 'super_admin',
    is_approved = true,
    status = 'active',
    plan = 'professional',
    subscription_start = COALESCE(subscription_start, now()),
    subscription_end = now() + interval '100 years'
WHERE email = 'contacteccorp@gmail.com';

-- 5. CLEAN ALL POLICIES
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 6. RE-IMPLEMENT RECURSION-FREE POLICIES
-- PROFILES
CREATE POLICY "God-Mode" ON profiles FOR ALL USING (is_master_admin_jwt());
CREATE POLICY "Owner-Access" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Team-View" ON profiles FOR SELECT USING (
    parent_id = (SELECT p.parent_id FROM profiles p WHERE p.id = auth.uid() LIMIT 1)
);

-- PAYMENTS
CREATE POLICY "Admin-Payments" ON payments FOR ALL USING (is_master_admin_jwt());
CREATE POLICY "Standard-Payments" ON payments FOR ALL USING (
    user_id = auth.uid() 
    OR 
    user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- SCHEDULES
CREATE POLICY "Admin-Schedules" ON schedules FOR ALL USING (is_master_admin_jwt());
CREATE POLICY "Standard-Schedules" ON schedules FOR ALL USING (
    user_id = auth.uid() 
    OR 
    user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- ABSENCES
CREATE POLICY "Admin-Absences" ON absence_requests FOR ALL USING (is_master_admin_jwt());
CREATE POLICY "Standard-Absences" ON absence_requests FOR ALL USING (
    user_id = auth.uid() 
    OR 
    user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- PLATFORM SETTINGS
CREATE POLICY "Settings-Global-View" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Settings-Admin-Modify" ON platform_settings FOR ALL USING (is_master_admin_jwt());

-- 7. RE-ENABLE SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
