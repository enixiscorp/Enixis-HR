-- RECLAIM SUPER ADMIN ACCESS
-- Run this in the Supabase SQL Editor

-- 1. Ensure the profile has the correct role and is approved
UPDATE profiles 
SET 
    role = 'super_admin',
    is_approved = true,
    status = 'active',
    subscription_start = COALESCE(subscription_start, now()),
    subscription_end = now() + interval '10 years',
    plan = 'professional'
WHERE email = 'contacteccorp@gmail.com';

-- 2. If the profile doesn't exist yet but the user is in auth.users, 
-- this will create the profile (fallback)
INSERT INTO profiles (id, email, first_name, last_name, role, is_approved, status, subscription_start, subscription_end, plan)
SELECT 
    id, 
    email, 
    'Super', 
    'Admin', 
    'super_admin', 
    true, 
    'active', 
    now(), 
    now() + interval '10 years',
    'professional'
FROM auth.users 
WHERE email = 'contacteccorp@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
    role = 'super_admin',
    is_approved = true,
    subscription_start = COALESCE(profiles.subscription_start, now()),
    subscription_end = now() + interval '10 years';

-- 3. Refresh schema cache
NOTIFY pgrst, 'reload schema';
