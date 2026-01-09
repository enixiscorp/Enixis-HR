-- =========================================================
-- QUICK FIX: ADD MISSING COLUMNS FOR VALIDATION
-- =========================================================

-- 1. Add columns to absence_requests if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='admin_notes') THEN
        ALTER TABLE public.absence_requests ADD COLUMN admin_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='processed_at') THEN
        ALTER TABLE public.absence_requests ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='processed_by') THEN
        ALTER TABLE public.absence_requests ADD COLUMN processed_by UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. Update RLS Policy for Admins
DROP POLICY IF EXISTS "Admins update absences" ON public.absence_requests;
CREATE POLICY "Admins update absences" ON public.absence_requests 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- =========================================================
-- SUCCESS: COLUMNS AND POLICIES UPDATED
-- =========================================================
