-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logo_url TEXT,
    platform_name TEXT DEFAULT 'Enixis HR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row exists (Singleton pattern)
-- We insert a row if none exists
INSERT INTO platform_settings (platform_name)
SELECT 'Enixis HR'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can View settings (to see logo)
DROP POLICY IF EXISTS "Enable read access for all users" ON platform_settings;
CREATE POLICY "Enable read access for all users" ON platform_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only Admins/Super Admins can Update/Insert
DROP POLICY IF EXISTS "Enable full access for admins" ON platform_settings;
CREATE POLICY "Enable full access for admins" ON platform_settings
    FOR ALL
    TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
         EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Reload schema
NOTIFY pgrst, 'reload schema';
