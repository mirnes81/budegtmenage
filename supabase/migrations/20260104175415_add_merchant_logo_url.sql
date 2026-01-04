/*
  # Ajout du logo pour les fournisseurs
  
  1. Modifications
    - Ajout colonne `logo_url` à la table `merchant_rules`
    - Permet de stocker l'URL du logo du fournisseur
    - Si NULL, on utilise les initiales comme fallback
  
  2. Notes
    - Les logos seront ajoutés manuellement par l'utilisateur
    - Le système affichera les initiales par défaut
*/

-- Ajout de la colonne logo_url à merchant_rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchant_rules' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE merchant_rules ADD COLUMN logo_url text;
  END IF;
END $$;