/*
  # Système de Déductions Fiscales (Canton de Vaud)

  1. Modifications Table Transactions (non-destructif)
    - `deduction_type` - Type de déduction fiscale
      - NONE (défaut)
      - HEALTH (Santé - LAMal franchise)
      - CHILDCARE (Garde d'enfants)
      - MORTGAGE_INTEREST (Intérêts hypothécaires)
      - PROPERTY_MAINTENANCE (Entretien propriété)
      - DONATION (Dons)
      - OTHER (Autre)
    - `deduction_status` - Statut de la déduction
      - NONE (défaut)
      - SUGGESTED (suggéré par le système)
      - CONFIRMED (confirmé par l'utilisateur)
      - REJECTED (rejeté par l'utilisateur)
    - `tax_year` - Année fiscale (int, default = année de la transaction)

  2. Nouvelle Table: deduction_rules
    - Règles de suggestion automatique par catégorie
    - `category_id` - Lien vers categories
    - `deduction_type` - Type de déduction suggéré
    - `confidence` - Niveau de confiance 0-100
    - `needs_user_split` - Si true, demander précision utilisateur
    - `note` - Note explicative pour l'utilisateur

  3. Sécurité
    - Enable RLS sur deduction_rules
    - Policies lecture pour authenticated users
*/

-- Add columns to transactions table (non-destructive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'deduction_type'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN deduction_type text DEFAULT 'NONE' NOT NULL 
    CHECK (deduction_type IN ('NONE', 'HEALTH', 'CHILDCARE', 'MORTGAGE_INTEREST', 'PROPERTY_MAINTENANCE', 'DONATION', 'OTHER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'deduction_status'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN deduction_status text DEFAULT 'NONE' NOT NULL 
    CHECK (deduction_status IN ('NONE', 'SUGGESTED', 'CONFIRMED', 'REJECTED'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'tax_year'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN tax_year integer;
  END IF;
END $$;

-- Create index on tax_year for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_tax_year ON transactions(tax_year);
CREATE INDEX IF NOT EXISTS idx_transactions_deduction_type ON transactions(deduction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_deduction_status ON transactions(deduction_status);

-- Update existing transactions with tax_year based on date
UPDATE transactions 
SET tax_year = EXTRACT(YEAR FROM date::date)::integer 
WHERE tax_year IS NULL;

-- Create deduction_rules table
CREATE TABLE IF NOT EXISTS deduction_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  deduction_type text NOT NULL CHECK (deduction_type IN ('HEALTH', 'CHILDCARE', 'MORTGAGE_INTEREST', 'PROPERTY_MAINTENANCE', 'DONATION', 'OTHER')),
  confidence integer DEFAULT 80 CHECK (confidence >= 0 AND confidence <= 100),
  needs_user_split boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on deduction_rules
ALTER TABLE deduction_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deduction_rules
CREATE POLICY "Users can read deduction rules"
  ON deduction_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create deduction rules"
  ON deduction_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update deduction rules"
  ON deduction_rules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete deduction rules"
  ON deduction_rules
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on category_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_deduction_rules_category_id ON deduction_rules(category_id);

-- Insert default deduction rules (will be populated by seed script)
-- This is just a placeholder comment - actual rules will be inserted via seed
