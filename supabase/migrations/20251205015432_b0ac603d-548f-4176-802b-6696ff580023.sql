-- Ajouter les colonnes manquantes à employee_objectives pour supporter les objectifs par nombre et par type

-- Ajouter colonne description si elle n'existe pas
ALTER TABLE employee_objectives ADD COLUMN IF NOT EXISTS description TEXT;

-- Ajouter colonne pour l'objectif en nombre total de ventes
ALTER TABLE employee_objectives ADD COLUMN IF NOT EXISTS target_sales_count INTEGER DEFAULT 0;

-- Ajouter colonne pour les objectifs par type d'assurance (JSONB)
-- Format: {"insurance_type_id": target_count, ...}
ALTER TABLE employee_objectives ADD COLUMN IF NOT EXISTS target_by_insurance_type JSONB DEFAULT '{}';

-- Ajouter colonne pour indiquer le mode d'objectif
-- 'amount' = montant en euros, 'count' = nombre de ventes, 'by_type' = par type d'assurance
ALTER TABLE employee_objectives ADD COLUMN IF NOT EXISTS objective_mode TEXT DEFAULT 'amount' CHECK (objective_mode IN ('amount', 'count', 'by_type', 'mixed'));

-- Ajouter is_active si manquant
ALTER TABLE employee_objectives ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;