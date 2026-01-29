-- Add breaks column to schedules table
-- Description: Stores break times and durations (JSON array)

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schedules'
        AND column_name = 'breaks'
    ) THEN
        ALTER TABLE schedules ADD COLUMN breaks JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added "breaks" column to schedules table';
    ELSE
        RAISE NOTICE 'Column "breaks" already exists in schedules table';
    END IF;
END $$;

COMMIT;
