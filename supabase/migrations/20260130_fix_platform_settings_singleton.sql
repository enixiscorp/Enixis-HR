-- Ensure platform_settings is a true singleton table

-- 0. Safety: Ensure 'id' column exists (it might be missing if table was created manually)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_settings' AND column_name = 'id'
    ) THEN
        ALTER TABLE platform_settings ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;
END $$;

-- 1. Remove duplicates if any (keep the oldest one)
DELETE FROM platform_settings 
WHERE id NOT IN (
    SELECT id FROM platform_settings 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 2. Add is_singleton column to enforce only one row
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS is_singleton BOOLEAN DEFAULT TRUE;

-- 3. Add constraint to ensure it's always true and unique
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_singleton_check') THEN
        ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_singleton_check CHECK (is_singleton IS TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_singleton_unique') THEN
        ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_singleton_unique UNIQUE (is_singleton);
    END IF;
END $$;

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
