-- Add last_logout_at column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;

-- Update comment for clarity
COMMENT ON COLUMN public.profiles.last_logout_at IS 'Timestamp of the user last manual sign out';
