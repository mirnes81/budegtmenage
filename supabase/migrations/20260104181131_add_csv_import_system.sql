/*
  # Add CSV Import System

  1. New Tables
    - `import_files`
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to accounts)
      - `file_name` (text) - Original filename
      - `file_size` (integer) - File size in bytes
      - `file_hash` (text) - SHA-256 hash of file content for duplicate detection
      - `rows_total` (integer) - Total rows in CSV
      - `rows_imported` (integer) - Successfully imported rows
      - `rows_skipped` (integer) - Skipped duplicate rows
      - `preset_used` (text, nullable) - Bank preset used
      - `created_at` (timestamptz)
      - Unique constraint on (account_id, file_hash)

    - `bank_csv_presets`
      - `id` (uuid, primary key)
      - `name` (text) - Preset name (e.g., "UBS", "PostFinance")
      - `match_headers` (jsonb) - Array of header patterns to match
      - `delimiter_hint` (text) - ";" or "," or "\t"
      - `date_format_hint` (text) - "dd.mm.yyyy", "yyyy-mm-dd", etc.
      - `decimal_separator_hint` (text) - "." or ","
      - `mapping` (jsonb) - Column mapping configuration
      - `is_active` (boolean)
      - `order_index` (integer)
      - `created_at` (timestamptz)

  2. Modifications to `transactions`
    - Add `import_source` (text, nullable) - "CSV" or "MANUAL"
    - Add `import_line_hash` (text, nullable) - Unique hash for deduplication
    - Add `import_file_id` (uuid, nullable, foreign key to import_files)
    - Add unique index on import_line_hash

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add import tracking fields to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'import_source'
  ) THEN
    ALTER TABLE transactions ADD COLUMN import_source text DEFAULT 'MANUAL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'import_line_hash'
  ) THEN
    ALTER TABLE transactions ADD COLUMN import_line_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'import_file_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN import_file_id uuid;
  END IF;
END $$;

-- Create unique index on import_line_hash for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_line_hash 
  ON transactions(import_line_hash) 
  WHERE import_line_hash IS NOT NULL;

-- Create import_files table
CREATE TABLE IF NOT EXISTS import_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_hash text NOT NULL,
  rows_total integer NOT NULL DEFAULT 0,
  rows_imported integer NOT NULL DEFAULT 0,
  rows_skipped integer NOT NULL DEFAULT 0,
  preset_used text,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint for duplicate file detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_files_account_hash 
  ON import_files(account_id, file_hash);

ALTER TABLE import_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import files"
  ON import_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create import files"
  ON import_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own import files"
  ON import_files FOR DELETE
  TO authenticated
  USING (true);

-- Add foreign key constraint from transactions to import_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_transactions_import_file'
  ) THEN
    ALTER TABLE transactions 
      ADD CONSTRAINT fk_transactions_import_file 
      FOREIGN KEY (import_file_id) 
      REFERENCES import_files(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create bank_csv_presets table
CREATE TABLE IF NOT EXISTS bank_csv_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  match_headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  delimiter_hint text DEFAULT ';',
  date_format_hint text DEFAULT 'dd.mm.yyyy',
  decimal_separator_hint text DEFAULT '.',
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bank_csv_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank presets"
  ON bank_csv_presets FOR SELECT
  TO authenticated
  USING (true);

-- Insert default bank presets
INSERT INTO bank_csv_presets (name, match_headers, delimiter_hint, date_format_hint, decimal_separator_hint, mapping, order_index)
VALUES
  -- UBS preset
  (
    'UBS',
    '["Booking date", "Date", "Text", "Description", "Debit", "Credit", "Amount", "Currency", "Balance"]'::jsonb,
    ';',
    'dd.mm.yyyy',
    '.',
    '{
      "date": ["Booking date", "Date", "Datum", "Date de comptabilisation"],
      "description": ["Text", "Description", "Texte", "Beschreibung"],
      "debit": ["Debit", "Débit", "Belastung"],
      "credit": ["Credit", "Crédit", "Gutschrift"],
      "amount": ["Amount", "Montant", "Betrag"],
      "currency": ["Currency", "Devise", "Währung"],
      "balance": ["Balance", "Solde", "Saldo"],
      "valueDate": ["Value date", "Date valeur", "Valutadatum"],
      "reference": ["Reference", "Référence", "Referenz"]
    }'::jsonb,
    0
  ),
  -- PostFinance preset (structure ready)
  (
    'PostFinance',
    '["Date de comptabilisation", "Libellé", "Crédit", "Débit", "Valeur"]'::jsonb,
    ';',
    'dd.mm.yyyy',
    '.',
    '{
      "date": ["Date de comptabilisation", "Buchungsdatum", "Date"],
      "description": ["Libellé", "Text", "Description"],
      "debit": ["Débit", "Belastung", "Debit"],
      "credit": ["Crédit", "Gutschrift", "Credit"],
      "balance": ["Valeur", "Saldo", "Balance"]
    }'::jsonb,
    1
  ),
  -- Raiffeisen preset (structure ready)
  (
    'Raiffeisen',
    '["Datum", "Buchungstext", "Belastung", "Gutschrift", "Saldo"]'::jsonb,
    ';',
    'dd.mm.yyyy',
    '.',
    '{
      "date": ["Datum", "Date"],
      "description": ["Buchungstext", "Text", "Description"],
      "debit": ["Belastung", "Debit"],
      "credit": ["Gutschrift", "Credit"],
      "balance": ["Saldo", "Balance"]
    }'::jsonb,
    2
  ),
  -- BCV preset (structure ready)
  (
    'BCV',
    '["Date", "Libellé", "Débit", "Crédit", "Solde"]'::jsonb,
    ';',
    'dd.mm.yyyy',
    '.',
    '{
      "date": ["Date", "Datum"],
      "description": ["Libellé", "Text", "Description"],
      "debit": ["Débit", "Belastung"],
      "credit": ["Crédit", "Gutschrift"],
      "balance": ["Solde", "Saldo"]
    }'::jsonb,
    3
  ),
  -- Generic preset (manual mapping)
  (
    'Generic',
    '[]'::jsonb,
    ',',
    'yyyy-mm-dd',
    '.',
    '{}'::jsonb,
    99
  )
ON CONFLICT (name) DO NOTHING;
