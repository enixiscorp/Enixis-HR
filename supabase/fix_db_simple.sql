-- =========================================================
-- ENIXIS HR - RÉPARATION FINALE DE LA BASE DE DONNÉES
-- =========================================================

-- STEP 1 : EXTENSIONS ET SCHÉMAS
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- STEP 2 : TYPES ET TABLES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('collaborator', 'admin', 'super_admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'absence_type') THEN
        CREATE TYPE absence_type AS ENUM ('repos', 'sick_leave', 'on_leave');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'collaborator',
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.absence_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    type absence_type NOT NULL,
    status request_status DEFAULT 'pending',
    reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- STEP 3 : FONCTIONS DE SÉCURITÉ (INDISPENSABLE)
-- Cette fonction permet de vérifier le rôle sans créer d'erreurs de cache ou de récursion
CREATE OR REPLACE FUNCTION public.check_user_role(target_role user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(target_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4 : CRÉATION DE COMPTE (create_user_admin)
CREATE OR REPLACE FUNCTION public.create_user_admin(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_password TEXT,
    p_role user_role DEFAULT 'collaborator'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $func$
DECLARE
    new_user_id UUID;
BEGIN
    -- Utilisation de la fonction de sécurité
    IF NOT public.check_user_role(ARRAY['admin', 'super_admin']::user_role[]) 
       AND (SELECT count(*) FROM public.profiles) > 0 THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create users.';
    END IF;

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        is_super_admin, created_at, updated_at, confirmation_token, email_change, 
        email_change_token_new, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 
        'authenticated', p_email, crypt(p_password, gen_salt('bf')), now(), now(), 
        now(), '{"provider":"email","providers":["email"]}', 
        format('{"first_name":"%s","last_name":"%s"}', p_first_name, p_last_name)::jsonb, 
        false, now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_user_id;

    INSERT INTO public.profiles (id, first_name, last_name, role, status)
    VALUES (new_user_id, p_first_name, p_last_name, p_role, 'active');

    RETURN new_user_id;
END;
$func$;

-- STEP 5 : PERMISSIONS ET POLITIQUES RLS
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.absence_requests TO authenticated;
GRANT ALL ON TABLE public.absence_requests TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_admin(TEXT, TEXT, TEXT, TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_admin(TEXT, TEXT, TEXT, TEXT, user_role) TO service_role;

-- Politiques pour Absence Requests
DROP POLICY IF EXISTS "Users view own absences" ON public.absence_requests;
CREATE POLICY "Users view own absences" ON public.absence_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own absences" ON public.absence_requests;
CREATE POLICY "Users create own absences" ON public.absence_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all absences" ON public.absence_requests;
CREATE POLICY "Admins view all absences" ON public.absence_requests FOR SELECT USING (public.check_user_role(ARRAY['admin', 'super_admin']::user_role[]));

DROP POLICY IF EXISTS "Admins update absences" ON public.absence_requests;
CREATE POLICY "Admins update absences" ON public.absence_requests FOR UPDATE USING (public.check_user_role(ARRAY['admin', 'super_admin']::user_role[]));

-- Correction des politiques pour les autres tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Admins and Super Admins can view all profiles" ON public.profiles;
        CREATE POLICY "Admins and Super Admins can view all profiles" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.check_user_role(ARRAY['admin', 'super_admin']::user_role[]));
    END IF;
END $$;
