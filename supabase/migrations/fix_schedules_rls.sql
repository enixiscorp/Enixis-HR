-- Enable RLS on schedules table
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and Super Admins have full control (CRUD)
-- Uses a subquery to check the user's role in the profiles table
DROP POLICY IF EXISTS "Admins have full control on schedules" ON schedules;
CREATE POLICY "Admins have full control on schedules" ON schedules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can view their own schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
CREATE POLICY "Users can view own schedules" ON schedules
    FOR SELECT
    TO authenticated
    USING ( user_id = auth.uid() );

-- Force schema reload to apply changes immediately
NOTIFY pgrst, 'reload schema';
