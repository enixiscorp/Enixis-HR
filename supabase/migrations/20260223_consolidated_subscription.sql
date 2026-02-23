-- Consolidated Subscription & Branding Migration
-- Run this in the Supabase SQL Editor

-- 1. Ensure Profiles table has all necessary columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text;

-- 2. Add startup_name to platform_settings
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS startup_name text;

-- 3. Initial RLS for Profiles (Team Isolation)
-- Drop existing broad policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON profiles;

-- New Policies
-- Everyone can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Team members can see each other
CREATE POLICY "Team members can view peers" ON profiles
FOR SELECT USING (
    parent_id = (SELECT parent_id FROM profiles WHERE id = auth.uid())
    OR 
    id = (SELECT parent_id FROM profiles WHERE id = auth.uid()) -- Can see their manager
);

-- Admins can manage their team
CREATE POLICY "Managers can view their team" ON profiles
FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Managers can update their team" ON profiles
FOR UPDATE USING (parent_id = auth.uid());

-- Super Admin can do everything
CREATE POLICY "Super Admins see all" ON profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR email = 'contacteccorp@gmail.com')
    )
);

-- 4. Sync existing admins to be approved
UPDATE profiles 
SET is_approved = true, 
    subscription_start = now(), 
    subscription_end = now() + interval '10 years'
WHERE role = 'super_admin' OR email = 'contacteccorp@gmail.com';

-- Force schema cache refresh (Supabase Dashboard usually does this, but this helps)
NOTIFY pgrst, 'reload schema';
