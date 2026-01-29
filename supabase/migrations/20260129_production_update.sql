-- Production Migration: Payment Status & Prestations
-- Date: 2026-01-29

BEGIN;

-- 1. Add 'refused' to payment_status enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'refused'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status')
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'refused';
        RAISE NOTICE 'Added "refused" status to payment_status enum';
    END IF;
END $$;

-- 2. Create Prestations Table if not exists
CREATE TABLE IF NOT EXISTS prestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

-- 4. Safely create policies
DO $$
BEGIN
    -- Drop existing policies to ensure clean state or update
    DROP POLICY IF EXISTS "Prestations viewable by all" ON prestations;
    DROP POLICY IF EXISTS "Prestations manageable by admins" ON prestations;
    
    -- Re-create policies
    CREATE POLICY "Prestations viewable by all" ON prestations
        FOR SELECT USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Prestations manageable by admins" ON prestations
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        );
END $$;

-- 5. Seed Data (Upsert based on name to avoid duplicates if re-run)
-- Note: We add a temporary unique index to enable ON CONFLICT, then drop it if needed, 
-- or we just check existence. Let's use simple existence checks for seed data.

INSERT INTO prestations (name, price, is_active)
SELECT '🛠 Optimisation de Procédures Support Client', 100000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🛠 Optimisation de Procédures Support Client');

INSERT INTO prestations (name, price, is_active)
SELECT '🔍 Optimisation de Procédures Projets', 150000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🔍 Optimisation de Procédures Projets');

INSERT INTO prestations (name, price, is_active)
SELECT '✍️ Création de CV sur mesure + Lettre', 7000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '✍️ Création de CV sur mesure + Lettre');

INSERT INTO prestations (name, price, is_active)
SELECT '✍️ Optimisation de CV sur mesure', 3500, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '✍️ Optimisation de CV sur mesure');

INSERT INTO prestations (name, price, is_active)
SELECT '🤝 Rédaction Demandes Partenariat/Sponsoring', 10000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🤝 Rédaction Demandes Partenariat/Sponsoring');

INSERT INTO prestations (name, price, is_active)
SELECT '🧑‍💼 Personal Branding & LinkedIn', 15000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🧑‍💼 Personal Branding & LinkedIn');

INSERT INTO prestations (name, price, is_active)
SELECT '🎓 Formation Coaching Emploi', 15000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🎓 Formation Coaching Emploi');

INSERT INTO prestations (name, price, is_active)
SELECT '🚀 Formation Booster la productivité', 10000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🚀 Formation Booster la productivité');

INSERT INTO prestations (name, price, is_active)
SELECT '📊 Formation Analyse de données via Excel', 25000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '📊 Formation Analyse de données via Excel');

INSERT INTO prestations (name, price, is_active)
SELECT '🤖 Formation IA', 5000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🤖 Formation IA');

INSERT INTO prestations (name, price, is_active)
SELECT '💼 Formation Optimisée Suite Office', 30000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '💼 Formation Optimisée Suite Office');

INSERT INTO prestations (name, price, is_active)
SELECT '📈 Optimisation de Procédures Marketing & Stratégie', 50000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '📈 Optimisation de Procédures Marketing & Stratégie');

INSERT INTO prestations (name, price, is_active)
SELECT '📄 Système Excel ou Google Sheets simple', 30000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '📄 Système Excel ou Google Sheets simple');

INSERT INTO prestations (name, price, is_active)
SELECT '📊 Système Fichier automatisé avec tableaux de bord', 5000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '📊 Système Fichier automatisé avec tableaux de bord');

INSERT INTO prestations (name, price, is_active)
SELECT '🔗 Intégration et Automatisations ERP/IA', 350000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🔗 Intégration et Automatisations ERP/IA');

INSERT INTO prestations (name, price, is_active)
SELECT '📱 Système d''Application personnalisée (Web/App)', 250000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '📱 Système d''Application personnalisée (Web/App)');

INSERT INTO prestations (name, price, is_active)
SELECT '🌐 Création de Site Web', 100000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '🌐 Création de Site Web');

INSERT INTO prestations (name, price, is_active)
SELECT '💻 Système semi-professionnel (Web/PC)', 100000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM prestations WHERE name = '💻 Système semi-professionnel (Web/PC)');


-- 4. Ensure 'breaks' column exists in schedules (Fix for schedule error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schedules'
        AND column_name = 'breaks'
    ) THEN
        ALTER TABLE schedules ADD COLUMN breaks JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added "breaks" column to schedules table';
    END IF;
END $$;

COMMIT;
