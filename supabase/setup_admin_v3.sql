-- ========================================================
-- Script de Configuration "Option Nucléaire" (v4.9)
-- ========================================================
-- CE SCRIPT PURGE TOUT POUR ARRÊTER L'ERREUR 500
-- ========================================================

-- 1. Désactivation temporaire de la sécurité pour nettoyer
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- 2. Nettoyage de TOUTES les politiques existantes (même celles que je n'ai pas nommées)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'platform_settings' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_settings', pol.policyname);
    END LOOP;
END $$;

-- 3. Réactivation avec des règles ultra-simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Règle de lecture : Tout le monde voit tout (Essentiel pour débloquer)
CREATE POLICY "lecture_totale" ON public.profiles FOR SELECT USING (true);

-- Règle Admin : Accès total pour contacteccorp@gmail.com
CREATE POLICY "admin_acces_total" ON public.profiles FOR ALL USING (
    (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com'
);

-- Pareil pour Platform Settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_lecture" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL USING (
    (auth.jwt() ->> 'email') = 'contacteccorp@gmail.com'
);

-- 4. Re-synchronisation des données (votre ID: 0bce2ddc-484e-4620-ab99-607bcf9fad24)
INSERT INTO public.profiles (id, first_name, last_name, role, status)
VALUES ('0bce2ddc-484e-4620-ab99-607bcf9fad24', 'Admin', 'Enixis', 'super_admin', 'active')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';

-- 5. Initialisation Platform Settings
INSERT INTO public.platform_settings (platform_name)
SELECT 'Enixis HR' WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- 6. VERIFICATION FINALE
SELECT 'OK' as Statut, role, id FROM public.profiles WHERE id = '0bce2ddc-484e-4620-ab99-607bcf9fad24';
