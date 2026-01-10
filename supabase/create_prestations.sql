-- Create Prestations Table
CREATE TABLE IF NOT EXISTS prestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prestations viewable by all" ON prestations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Prestations manageable by admins" ON prestations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Seed Data
INSERT INTO prestations (name, price, is_active) VALUES
('🛠 Optimisation de Procédures Support Client', 100000, FALSE),
('🔍 Optimisation de Procédures Projets', 150000, FALSE),
('✍️ Création de CV sur mesure + Lettre', 7000, TRUE),
('✍️ Optimisation de CV sur mesure', 3500, TRUE),
('🤝 Rédaction Demandes Partenariat/Sponsoring', 10000, TRUE),
('🧑‍💼 Personal Branding & LinkedIn', 15000, TRUE),
('🎓 Formation Coaching Emploi', 15000, TRUE),
('🚀 Formation Booster la productivité', 10000, TRUE),
('📊 Formation Analyse de données via Excel', 25000, TRUE),
('🤖 Formation IA', 5000, TRUE),
('💼 Formation Optimisée Suite Office', 30000, TRUE),
('📈 Optimisation de Procédures Marketing & Stratégie', 50000, FALSE),
('📄 Système Excel ou Google Sheets simple', 30000, TRUE),
('📊 Système Fichier automatisé avec tableaux de bord', 5000, TRUE),
('🔗 Intégration et Automatisations ERP/IA', 350000, FALSE),
('📱 Système d''Application personnalisée (Web/App)', 250000, FALSE),
('🌐 Création de Site Web', 100000, TRUE),
('💻 Système semi-professionnel (Web/PC)', 100000, FALSE);
