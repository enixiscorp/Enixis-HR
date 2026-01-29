-- Fix for "Could not find the 'breaks' column" error
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS breaks JSONB DEFAULT '[]'::jsonb;

-- Force schema cache reload (Supabase PostgREST)
NOTIFY pgrst, 'reload schema';
