-- FINAL COMPREHENSIVE MIGRATION: Subscription V2 & Team Isolation
-- This script adds all missing columns AND applies RLS policies in the correct order.

-- 1. SCHEMA UPDATES (Profiles & Platform Settings)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text;

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS startup_name text;

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
    SELECT CASE 
        WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' THEN NULL 
        ELSE COALESCE((SELECT parent_id FROM profiles WHERE id = auth.uid()), auth.uid())
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. RLS POLICIES FOR PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Team members can view peers" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team" ON profiles;
DROP POLICY IF EXISTS "Managers can update their team" ON profiles;
DROP POLICY IF EXISTS "Super Admins see all" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Use subqueries carefully to avoid recursion or missing columns during creation
CREATE POLICY "Team members can view peers" ON profiles
FOR SELECT USING (
    parent_id = (SELECT p.parent_id FROM profiles p WHERE p.id = auth.uid())
    OR 
    id = (SELECT p.parent_id FROM profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Managers can view their team" ON profiles
FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Managers can update their team" ON profiles
FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY "Super Admins see all" ON profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
);

-- 4. RLS POLICIES FOR OTHER TABLES
-- Schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for schedules" ON schedules;
CREATE POLICY "Team isolation for schedules" ON schedules
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com'))
    OR
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for payments" ON payments;
CREATE POLICY "Team isolation for payments" ON payments
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com'))
    OR
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- Absence Requests
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for absences" ON absence_requests;
CREATE POLICY "Team isolation for absences" ON absence_requests
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com'))
    OR
    user_id IN (SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id())
);

-- 5. ADMIN BOOTSTRAP
UPDATE profiles 
SET is_approved = true, 
    subscription_start = now(), 
    subscription_end = now() + interval '10 years'
WHERE role = 'super_admin' OR email = 'contacteccorp@gmail.com';

NOTIFY pgrst, 'reload schema';
