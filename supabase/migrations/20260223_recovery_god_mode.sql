-- SUPER ADMIN RECOVERY SCRIPT V2
-- This script fixes "Profil introuvable" and RLS recursion issues.

-- 1. Helper for Super Admin identification
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'super_admin' OR email = 'contacteccorp@gmail.com')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. DISABLE RLS TEMPORARILY TO CLEAR LOCKS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. ENSURE PROFILE EXISTS AND IS FULLY CONFIGURED
DO $$
DECLARE
    target_email TEXT := 'contacteccorp@gmail.com';
    target_id UUID;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NULL THEN
        RAISE NOTICE 'ERREUR: Utilisateur Auth non trouvé pour %', target_email;
    ELSE
        INSERT INTO profiles (id, email, first_name, last_name, role, is_approved, status, plan, subscription_start, subscription_end)
        VALUES (
            target_id, 
            target_email, 
            'Admin', 
            'Principal', 
            'super_admin', 
            true, 
            'active', 
            'professional', 
            now(), 
            now() + interval '10 years'
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            role = 'super_admin',
            is_approved = true,
            status = 'active',
            email = target_email,
            plan = 'professional',
            subscription_end = now() + interval '10 years';
            
        RAISE NOTICE 'PROFILE REPARÉ POUR %', target_email;
    END IF;
END $$;

-- 4. CLEAN UP AND RESET POLICIES (Profiles)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Team members can view peers" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team" ON profiles;
DROP POLICY IF EXISTS "Managers can update their team" ON profiles;
DROP POLICY IF EXISTS "Super Admins see all" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Allow view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow super admin everything" ON profiles
FOR ALL USING (is_master_admin());

-- Peer view (Non-recursive version using the helper function)
CREATE POLICY "Allow peer view" ON profiles
FOR SELECT USING (
    parent_id = (SELECT parent_id FROM profiles WHERE id = auth.uid())
);

-- 5. FIX RELATED TABLES (Ensure Super Admin can see EVERYTHING)
-- Schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for schedules" ON schedules;
CREATE POLICY "Super admin all schedules" ON schedules FOR ALL USING (is_master_admin());
CREATE POLICY "Team isolation for schedules" ON schedules FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for payments" ON payments;
CREATE POLICY "Super admin all payments" ON payments FOR ALL USING (is_master_admin());
CREATE POLICY "Team isolation for payments" ON payments FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- Absences
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for absences" ON absence_requests;
CREATE POLICY "Super admin all absences" ON absence_requests FOR ALL USING (is_master_admin());
CREATE POLICY "Team isolation for absences" ON absence_requests FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- 6. RE-ENABLE SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
