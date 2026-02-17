-- Add location fields to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Lomé',
ADD COLUMN IF NOT EXISTS company_address TEXT;

-- Update existing row
UPDATE public.platform_settings 
SET location = 'Lomé'
WHERE is_singleton = true;
