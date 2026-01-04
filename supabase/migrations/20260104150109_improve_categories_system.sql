/*
  # Amélioration du système de catégories

  ## Description
  Ajout de fonctionnalités pour un système de catégories type FocusDaily:
  - Champ `group_name` pour regrouper les catégories (Logement, Transports, etc.)
  - Champ `is_hidden` pour masquer sans supprimer
  - Amélioration de l'ordre pour les favoris

  ## Modifications
  
  ### Ajout de colonnes à `categories`
  - `group_name` (text, nullable) - Nom du groupe (Logement, Transports, etc.)
  - `is_hidden` (boolean, default false) - Masquer la catégorie sans la supprimer
  
  ## Notes
  - Les catégories existantes ne sont pas affectées
  - is_hidden permet de masquer sans casser les transactions existantes
  - group_name permet de regrouper visuellement dans le picker
*/

-- Ajouter le champ group_name pour regrouper les catégories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE categories ADD COLUMN group_name text;
  END IF;
END $$;

-- Ajouter le champ is_hidden pour masquer les catégories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_hidden boolean DEFAULT false;
  END IF;
END $$;

-- Créer un index pour les requêtes de catégories actives et non masquées
CREATE INDEX IF NOT EXISTS idx_categories_active_visible ON categories(is_active, is_hidden) WHERE is_active = true AND is_hidden = false;

-- Créer un index pour le groupement
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_name, type) WHERE group_name IS NOT NULL;
