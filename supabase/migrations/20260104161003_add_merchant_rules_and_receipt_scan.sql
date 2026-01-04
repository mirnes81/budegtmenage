/*
  # Système de scan de tickets avec apprentissage fournisseur

  1. Nouvelle table `merchant_rules`
    - Règles d'apprentissage par fournisseur
    - Mémorise catégorie/compte/membre par défaut
    - Compteur d'utilisation pour statistiques
    - merchantKey unique par utilisateur (normalisé)
    
  2. Modifications table `transactions`
    - Ajout colonnes pour traçabilité scan
    - merchantRaw: nom fournisseur brut extrait
    - merchantKey: version normalisée
    - rawTextSnippet: extrait texte OCR (max 1000 chars)
    - scannedAt: timestamp du scan
    
  3. Sécurité
    - RLS activé sur merchant_rules
    - Policies restrictives par utilisateur
    - Pas de stockage d'images
*/

-- Table merchant_rules pour apprentissage fournisseur
CREATE TABLE IF NOT EXISTS merchant_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_key text NOT NULL,
  merchant_display text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  default_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  default_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  deduction_type text,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, merchant_key)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_key ON merchant_rules(user_id, merchant_key);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_use_count ON merchant_rules(user_id, use_count DESC);

-- RLS sur merchant_rules
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merchant rules"
  ON merchant_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merchant rules"
  ON merchant_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own merchant rules"
  ON merchant_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own merchant rules"
  ON merchant_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ajout colonnes scan à transactions (si non existantes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'merchant_raw'
  ) THEN
    ALTER TABLE transactions ADD COLUMN merchant_raw text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'merchant_key'
  ) THEN
    ALTER TABLE transactions ADD COLUMN merchant_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'raw_text_snippet'
  ) THEN
    ALTER TABLE transactions ADD COLUMN raw_text_snippet text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'scanned_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN scanned_at timestamptz;
  END IF;
END $$;

-- Index pour recherche transactions scannées
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_key ON transactions(merchant_key) WHERE merchant_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_scanned ON transactions(scanned_at) WHERE scanned_at IS NOT NULL;
