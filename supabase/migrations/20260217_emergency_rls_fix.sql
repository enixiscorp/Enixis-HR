-- ==============================================================
-- SCRIPT D'URGENCE : CORRECTION RÉCURSION RLS & RESET ACCÈS
-- Date: 2026-02-17
-- VERSION FINALE ET ROBUSTE - NE PAS MODIFIER LES BLOCS 'DO'
-- ==============================================================

BEGIN;

-- 1. Fonctions de vérification de rôle (Security Definer)
-- Ces fonctions permettent de lire les rôles sans déclencher de récursion RLS.
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- 3. Nouvelles politiques de sécurité SANS récursion
CREATE POLICY "Profiles access policy" ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid() 
        OR public.check_is_super_admin()
        OR public.check_is_admin()
    );

CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE
    USING (
        id = auth.uid() 
        OR public.check_is_super_admin()
    );

-- 4. RÉPARATION ET RÉINITIALISATION DES COMPTES
-- Ce bloc DO est CRITIQUE. Il gère l'absence de la colonne 'email'.
DO $$
DECLARE
    u_emails TEXT[] := ARRAY['edemcyrille@gmail.com', 'vickyaveko@gmail.com'];
BEGIN
    -- Étape A : Créer la colonne email si elle manque pour éviter l'erreur 42703
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Colonne email ajoutée à la table public.profiles.';
    END IF;

    -- Étape B : Supprimer les profils correspondants via l'ID auth
    -- On cherche l'ID dans auth.users et on supprime dans public.profiles
    DELETE FROM public.profiles 
    WHERE id IN (
        SELECT id FROM auth.users 
        WHERE email = ANY(u_emails)
    );

    -- Étape C : Supprimer les comptes dans auth.users
    DELETE FROM auth.users 
    WHERE email = ANY(u_emails);
    
    RAISE NOTICE 'Comptes réinitialisés avec succès.';
END $$;

-- 5. Nettoyage et sécurisation des services (prestations)
-- Nettoyer les données corrompues (nom vide)
DELETE FROM public.prestations WHERE name IS NULL OR name = '';

-- Supprimer les doublons de noms (garde le plus récent)
DELETE FROM public.prestations
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as row_num
        FROM public.prestations
    ) t
    WHERE row_num > 1
);

-- Ajouter une contrainte d'unicité pour empêcher les doublons futurs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prestations_name_key'
    ) THEN
        ALTER TABLE public.prestations ADD CONSTRAINT prestations_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Remarque : La contrainte d''unicité n''a pas pu être ajoutée (déjà présente ou données incompatibles)';
END $$;

-- Réinitialiser les politiques pour les services
DROP POLICY IF EXISTS "Prestations viewable by all" ON public.prestations;
DROP POLICY IF EXISTS "Prestations manageable by admins" ON public.prestations;

CREATE POLICY "Prestations viewable by all" ON public.prestations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Prestations manageable by admins" ON public.prestations
    FOR ALL USING (public.check_is_admin());

COMMIT;

-- Résumé final
SELECT '✅ Politiques RLS corrigées (Plus d''erreur de récursion)' as action
UNION ALL
SELECT '✅ Structure table profiles mise à jour (Colonne email existante)'
UNION ALL
SELECT '✅ Comptes supprimés : edemcyrille@gmail.com, vickyaveko@gmail.com'
UNION ALL
SELECT '✅ Services (prestations) nettoyés et dédoublonnés';
