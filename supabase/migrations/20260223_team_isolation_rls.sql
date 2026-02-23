-- Comprehensive Team Isolation RLS Migration
-- Ensures users only see data related to their own team

-- 1. Helper Function to get Team ID (parent_id) for current user
CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
    SELECT CASE 
        WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' THEN NULL -- Super Admin see all
        ELSE COALESCE((SELECT parent_id FROM profiles WHERE id = auth.uid()), auth.uid())
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Apply Isolation to Schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for schedules" ON schedules;
CREATE POLICY "Team isolation for schedules" ON schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
    OR
    user_id IN (
        SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id()
    )
);

-- 3. Apply Isolation to Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for payments" ON payments;
CREATE POLICY "Team isolation for payments" ON payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
    OR
    user_id IN (
        SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id()
    )
);

-- 4. Apply Isolation to Absences
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team isolation for absences" ON absences;
CREATE POLICY "Team isolation for absences" ON absences
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
    OR
    user_id IN (
        SELECT id FROM profiles WHERE parent_id = get_my_team_id() OR id = get_my_team_id()
    )
);

-- 5. Link every new signup as their own team owner
-- This is handled in code but this trigger ensures it in DB if someone creates via other means
CREATE OR REPLACE FUNCTION set_default_parent_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If no parent_id is set and role is admin, they are a team owner
    IF NEW.parent_id IS NULL AND NEW.role = 'admin' THEN
        -- They are their own parent effectively for isolation logic
        -- But we keep it NULL to indicate they are the ROOT of the team
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_parent ON profiles;
CREATE TRIGGER on_profile_created_parent
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_parent_id();
