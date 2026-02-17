-- ==============================================================
-- FIX PLATFORM SETTINGS RLS & HELPERS
-- ==============================================================

BEGIN;

-- 1. S'assurer que les fonctions de sécurité existent
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Mettre à jour les politiques de platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;
CREATE POLICY "Enable read access for all users" ON public.platform_settings
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable full access for admins" ON public.platform_settings;
CREATE POLICY "Enable full access for admins" ON public.platform_settings
    FOR ALL
    TO authenticated
    USING (public.check_is_admin())
    WITH CHECK (public.check_is_admin());

COMMIT;

-- Résumé
SELECT '✅ Sécurité platform_settings mise à jour avec check_is_admin()' as action;
