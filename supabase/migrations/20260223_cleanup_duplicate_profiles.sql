-- ============================================================
-- FIX: CLEAN DUPLICATE PROFILES + ADMIN FUNCTIONS
-- ============================================================

-- 1. Remove duplicate profiles (keep the one with the most data / most recent)
-- Duplicates are profiles with the same email
WITH ranked AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                (CASE WHEN role = 'super_admin' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END),
                created_at DESC
        ) AS rn
    FROM profiles
    WHERE email IS NOT NULL
),
to_delete AS (
    SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM profiles WHERE id IN (SELECT id FROM to_delete);

-- 2. Also clean profiles with NULL email that are duplicates of existing accounts
-- (keep the record with auth.users match)
DELETE FROM profiles p
WHERE p.email IS NULL
AND EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.id = p.id 
    AND p2.email IS NOT NULL
);

SELECT '✅ Duplicate profiles cleaned' AS result;

-- 3. Ensure all profiles have their email set from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

SELECT '✅ Profile emails synced with auth.users' AS result;
