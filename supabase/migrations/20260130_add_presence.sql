-- Add last_seen_at to profiles for real-time presence tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Enable real-time for profiles if not already enabled
-- (This is usually done in the Supabase dashboard but good to have)
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
