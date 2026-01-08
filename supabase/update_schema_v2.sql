-- Add absence related fields to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS absence_reason TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS absence_status TEXT CHECK (absence_status IN ('pending', 'approved', 'rejected')) DEFAULT NULL;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default logo_url if not exists
INSERT INTO platform_settings (key, value)
VALUES ('logo_url', NULL)
ON CONFLICT (key) DO NOTHING;

-- RLS for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view platform settings" ON platform_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update platform settings" ON platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );
