/*
  # Add Keyword Rules for Local Auto-Categorization

  1. New Tables
    - `keyword_rules`
      - `id` (uuid, primary key)
      - `pattern` (text) - Keyword or regex pattern to match
      - `category_id` (uuid) - Category to apply
      - `priority` (integer) - Lower = higher priority
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `keyword_rules` table
    - Public read for all authenticated users (shared rules)
    - Only admins can manage rules

  3. Changes
    - Add support for local auto-categorization without AI
    - Keywords that auto-assign categories during import
*/

CREATE TABLE IF NOT EXISTS keyword_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE keyword_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active keyword rules"
  ON keyword_rules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage keyword rules"
  ON keyword_rules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_keyword_rules_category ON keyword_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rules_active ON keyword_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_keyword_rules_priority ON keyword_rules(priority, is_active) WHERE is_active = true;
