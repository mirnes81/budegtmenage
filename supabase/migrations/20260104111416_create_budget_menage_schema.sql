/*
  # Création du schéma complet Budget Ménage Suisse
  
  ## Description
  Ce schéma supporte une application de gestion de budget familial suisse avec:
  - Authentification locale simple (1 mot de passe)
  - Gestion multi-membres (5 membres + ménage)
  - Transactions détaillées avec catégorisation
  - Charges fixes/récurrentes avec génération automatique
  - Budgets par catégorie
  - Paramètres fiscaux pour estimation impôts

  ## Nouvelles Tables
  
  ### `app_users`
  - Table d'authentification locale (1 utilisateur unique)
  - `id` (uuid, primary key)
  - `password_hash` (text) - Hash bcrypt du mot de passe
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `members`
  - Membres du ménage (Mirnes, Madame, Enfants, Ménage)
  - `id` (uuid, primary key)
  - `name` (text) - Nom du membre
  - `type` (text) - Type: 'adult', 'child', 'household'
  - `is_active` (boolean) - Membre actif
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)
  
  ### `accounts`
  - Comptes bancaires/moyens de paiement (Banque, Carte, Cash, TWINT)
  - `id` (uuid, primary key)
  - `name` (text) - Nom du compte
  - `type` (text) - Type: 'bank', 'card', 'cash', 'digital'
  - `icon` (text) - Nom de l'icône lucide-react
  - `color` (text) - Couleur hexadécimale
  - `is_active` (boolean)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  
  ### `categories`
  - Catégories de dépenses/revenus
  - `id` (uuid, primary key)
  - `name` (text) - Nom de la catégorie
  - `type` (text) - 'expense' ou 'income'
  - `icon` (text) - Nom de l'icône
  - `color` (text) - Couleur
  - `parent_id` (uuid, nullable) - Pour sous-catégories
  - `is_active` (boolean)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  
  ### `transactions`
  - Transactions financières (dépenses et revenus)
  - `id` (uuid, primary key)
  - `date` (date) - Date de la transaction
  - `amount` (numeric(12,2)) - Montant en CHF (négatif pour dépenses)
  - `type` (text) - 'expense' ou 'income'
  - `category_id` (uuid, foreign key)
  - `account_id` (uuid, foreign key)
  - `member_id` (uuid, foreign key)
  - `description` (text)
  - `notes` (text, nullable)
  - `tags` (text[], nullable) - Tags pour recherche
  - `is_fixed` (boolean) - Est-ce une charge fixe générée
  - `recurring_expense_id` (uuid, nullable) - Lien vers charge fixe
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `recurring_expenses`
  - Charges fixes/récurrentes
  - `id` (uuid, primary key)
  - `name` (text) - Libellé
  - `amount` (numeric(12,2)) - Montant
  - `frequency` (text) - 'monthly', 'quarterly', 'semi-annual', 'annual'
  - `category_id` (uuid, foreign key)
  - `account_id` (uuid, foreign key)
  - `member_id` (uuid, foreign key)
  - `day_of_month` (integer) - Jour du mois (1-31)
  - `start_date` (date) - Date de début
  - `end_date` (date, nullable) - Date de fin optionnelle
  - `is_active` (boolean)
  - `notes` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `budgets`
  - Budgets par catégorie
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key)
  - `member_id` (uuid, foreign key, nullable) - Budget spécifique à un membre
  - `amount` (numeric(12,2)) - Montant budget mensuel
  - `period` (text) - 'monthly', 'annual'
  - `year` (integer)
  - `month` (integer, nullable) - Pour budgets mensuels
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `tax_settings`
  - Paramètres pour estimation impôts
  - `id` (uuid, primary key)
  - `postal_code` (text) - NPA
  - `municipality` (text) - Commune
  - `canton` (text) - Canton (CH code)
  - `marital_status` (text) - État civil
  - `num_children` (integer) - Nombre d'enfants
  - `church_tax` (boolean) - Impôt ecclésiastique
  - `annual_income` (numeric(12,2), nullable) - Revenu annuel manuel
  - `deductions` (numeric(12,2), nullable) - Déductions
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `generated_transactions`
  - Table de tracking pour éviter doublons de génération
  - `id` (uuid, primary key)
  - `recurring_expense_id` (uuid, foreign key)
  - `year` (integer)
  - `month` (integer)
  - `transaction_id` (uuid, foreign key)
  - `generated_at` (timestamptz)
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Accès public complet (application mono-utilisateur)
  - Protection au niveau de l'authentification de l'application
*/

-- Table app_users
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to app_users"
  ON app_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table members
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('adult', 'child', 'household')),
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to members"
  ON members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'card', 'cash', 'digital')),
  icon text DEFAULT 'wallet',
  color text DEFAULT '#3b82f6',
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to accounts"
  ON accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  icon text DEFAULT 'tag',
  color text DEFAULT '#6b7280',
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  description text NOT NULL,
  notes text,
  tags text[],
  is_fixed boolean DEFAULT false,
  recurring_expense_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Table recurring_expenses
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to recurring_expenses"
  ON recurring_expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ajouter la foreign key manquante pour transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_recurring_expense_id_fkey'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_recurring_expense_id_fkey 
    FOREIGN KEY (recurring_expense_id) 
    REFERENCES recurring_expenses(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Table budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  period text NOT NULL CHECK (period IN ('monthly', 'annual')),
  year integer NOT NULL,
  month integer CHECK (month >= 1 AND month <= 12),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to budgets"
  ON budgets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);

-- Table tax_settings
CREATE TABLE IF NOT EXISTS tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code text,
  municipality text,
  canton text,
  marital_status text DEFAULT 'married',
  num_children integer DEFAULT 3,
  church_tax boolean DEFAULT false,
  annual_income numeric(12,2),
  deductions numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to tax_settings"
  ON tax_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table generated_transactions
CREATE TABLE IF NOT EXISTS generated_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id uuid NOT NULL REFERENCES recurring_expenses(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(recurring_expense_id, year, month)
);

ALTER TABLE generated_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to generated_transactions"
  ON generated_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_generated_transactions_period ON generated_transactions(year, month);