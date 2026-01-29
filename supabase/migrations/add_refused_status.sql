-- Migration: Add 'refused' status to payment_status enum
-- Date: 2026-01-29
-- Description: Adds the 'refused' payment status for better payment management

-- Check if the value already exists to make this migration idempotent
DO $$
BEGIN
    -- Try to add the new enum value
    -- This will fail silently if it already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'refused'
        AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'payment_status'
        )
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'refused';
        RAISE NOTICE 'Added "refused" status to payment_status enum';
    ELSE
        RAISE NOTICE '"refused" status already exists in payment_status enum';
    END IF;
END $$;
