-- FIX PLATFORM SETTINGS - MULTI-ADMIN SUPPORT
-- Each admin (and super admin) can have their own company settings.
-- RLS uses JWT email check to avoid recursion.

-- 1. ADD user_id COLUMN if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'platform_settings' AND COLUMN_NAME = 'user_id'
    ) THEN
        ALTER TABLE platform_settings ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Add unique constraint on user_id for upsert to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'platform_settings_user_id_key'
    ) THEN
        ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Set user_id for the existing row to the super admin (if it exists and has no user_id)
UPDATE platform_settings
SET user_id = (SELECT id FROM auth.users WHERE email = 'contacteccorp@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

-- 4. DROP all old platform_settings policies
DROP POLICY IF EXISTS "Enable read access for all users" ON platform_settings;
DROP POLICY IF EXISTS "Enable full access for admins" ON platform_settings;
DROP POLICY IF EXISTS "Settings-Global-View" ON platform_settings;
DROP POLICY IF EXISTS "Settings-Admin-Modify" ON platform_settings;

-- 5. CREATE NEW POLICIES (recursion-free)
-- Anyone authenticated can read settings (to display logos etc.)
CREATE POLICY "Settings-Read-All" ON platform_settings
    FOR SELECT TO authenticated USING (true);

-- Only the owner of the settings row can write/update (each admin owns their own row)
CREATE POLICY "Settings-Owner-Write" ON platform_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Super Admin bypass (JWT-based, no recursion)
CREATE POLICY "Settings-SuperAdmin-All" ON platform_settings
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'contacteccorp@gmail.com');

-- 6. ENABLE RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

SELECT '✅ platform_settings: multi-admin + RLS fixes applied' AS result;
