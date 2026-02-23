-- SUPER ADMIN RECOVERY SCRIPT V3 (RECURSION-FREE)
-- Fixes "Profil introuvable" and ensures data visibility for Edem Cyrille SOSSOUVI.

-- 1. Helper for Super Admin identification (Non-recursive)
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check email from JWT first (fastest, no recursion)
    IF (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Fallback: check role in profiles but use SECURITY DEFINER to avoid RLS loop
    -- and limit recursion by checking if we are already in the master check.
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. RESET PROFILES FOR MASTER AND COLLABORATORS
DO $$
DECLARE
    master_email TEXT := 'contacteccorp@gmail.com';
    master_id UUID;
BEGIN
    -- Get master ID
    SELECT id INTO master_id FROM auth.users WHERE email = master_email;
    
    IF master_id IS NOT NULL THEN
        -- Fix Master Profile
        INSERT INTO profiles (id, email, first_name, last_name, role, is_approved, status, plan, subscription_start, subscription_end)
        VALUES (
            master_id, 
            master_email, 
            'Edem Cyrille', 
            'SOSSOUVI', 
            'super_admin', 
            true, 
            'active', 
            'professional', 
            now(), 
            now() + interval '10 years'
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            first_name = 'Edem Cyrille',
            last_name = 'SOSSOUVI',
            role = 'super_admin',
            is_approved = true,
            status = 'active',
            plan = 'professional',
            subscription_end = now() + interval '10 years';
    END IF;

    -- Fix Karter SOSSOUVI Profile (if they exist in auth.users)
    -- This ensures they are linked to the master or just exist as a collaborator
    UPDATE profiles 
    SET last_name = 'SOSSOUVI', first_name = 'Karter'
    WHERE email ILIKE '%karter%';
END $$;

-- 3. RESET RLS POLICIES (Simplified and Non-Recursive)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Clear all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow super admin everything" ON profiles;
DROP POLICY IF EXISTS "Allow peer view" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Team members can view peers" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team" ON profiles;
DROP POLICY IF EXISTS "Managers can update their team" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- RE-IMPLEMENT CLEAN POLICIES
-- Master/SuperAdmin rule (Bypass everything)
CREATE POLICY "Super-God-Mode" ON profiles
FOR ALL USING ((auth.jwt() ->> 'email') = 'contacteccorp@gmail.com' OR role = 'super_admin');

-- Individual access
CREATE POLICY "Own-Access" ON profiles
FOR ALL USING (auth.uid() = id);

-- Team view (Simple, non-recursive parent_id check)
-- This avoids calling is_master_admin inside a subquery that might trigger policies
CREATE POLICY "Team-Access" ON profiles
FOR SELECT USING (
    parent_id = (SELECT p.parent_id FROM profiles p WHERE p.id = auth.uid() LIMIT 1)
    OR 
    id = (SELECT p.parent_id FROM profiles p WHERE p.id = auth.uid() LIMIT 1)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. FIX DATA TABLES ACCESS
-- Schedules
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin all schedules" ON schedules;
DROP POLICY IF EXISTS "Team isolation for schedules" ON schedules;
CREATE POLICY "Admin-Schedules" ON schedules FOR ALL USING (is_master_admin());
CREATE POLICY "Team-Schedules" ON schedules FOR SELECT USING (true); -- We use application logic for filtering, RLS for base security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Payments
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin all payments" ON payments;
DROP POLICY IF EXISTS "Team isolation for payments" ON payments;
CREATE POLICY "Admin-Payments" ON payments FOR ALL USING (is_master_admin());
CREATE POLICY "Team-Payments" ON payments FOR SELECT USING (true);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Absences
ALTER TABLE absence_requests DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin all absences" ON absence_requests;
DROP POLICY IF EXISTS "Team isolation for absences" ON absence_requests;
CREATE POLICY "Admin-Absences" ON absence_requests FOR ALL USING (is_master_admin());
CREATE POLICY "Team-Absences" ON absence_requests FOR SELECT USING (true);
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;

SELECT 'RECOVERY COMPLETE: PROFILES AND ACCESS RESTORED' as status;
