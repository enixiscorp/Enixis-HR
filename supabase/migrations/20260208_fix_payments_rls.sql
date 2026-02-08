-- Fix RLS Policies for Payments Table
-- The payments table had RLS enabled but was missing policies for collaborators to view their own payments

-- First, enable RLS if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Policy: Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can view their own payments
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Admins can insert payments
CREATE POLICY "Admins can insert payments" ON payments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Admins can update all payments
CREATE POLICY "Admins can update all payments" ON payments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Admins can delete payments
CREATE POLICY "Admins can delete payments" ON payments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );
