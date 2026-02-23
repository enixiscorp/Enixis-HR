-- Create enrollment and subscription fields for profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;

-- Update the master admin to be approved and have a long subscription
UPDATE profiles 
SET is_approved = true, 
    subscription_start = now(), 
    subscription_end = now() + interval '10 years'
WHERE email = 'contacteccorp@gmail.com';

-- Ensure RLS allows Super Admins to manage these fields
CREATE POLICY "Super Admins can manage all subscription fields"
ON profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles AS p 
        WHERE p.id = auth.uid() 
        AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles AS p 
        WHERE p.id = auth.uid() 
        AND (p.role = 'super_admin' OR p.email = 'contacteccorp@gmail.com')
    )
);
