/*
  # Fix UBS CSV Preset Mapping

  1. Updates
    - Update UBS preset to match real UBS CSV headers
    - Add support for Description1, Description2, Description3 columns
    - Update match_headers to detect UBS files correctly

  Real UBS CSV headers are:
    - Date de transaction
    - Description1, Description2, Description3
    - Débit, Crédit
    - Date de comptabilisation
    - Date de valeur
    - Monnaie
    - Solde
    - No de transaction

  The mapping system will concatenate Description1+2+3 into a single description field.
*/

-- Update UBS preset with correct headers and mapping
UPDATE bank_csv_presets
SET 
  match_headers = '["Date de transaction", "Description1", "Débit", "Crédit", "Date de comptabilisation"]'::jsonb,
  mapping = '{
    "date": ["Date de comptabilisation", "Date de transaction", "Booking date", "Date"],
    "description": ["Description1", "Description2", "Description3", "Text", "Description", "Texte"],
    "debit": ["Débit", "Debit", "Belastung"],
    "credit": ["Crédit", "Credit", "Gutschrift"],
    "amount": ["Amount", "Montant", "Betrag"],
    "currency": ["Monnaie", "Currency", "Devise", "Währung"],
    "balance": ["Solde", "Balance", "Saldo"],
    "valueDate": ["Date de valeur", "Value date", "Date valeur", "Valutadatum"],
    "reference": ["No de transaction", "Reference", "Référence", "Referenz"]
  }'::jsonb,
  delimiter_hint = ';',
  date_format_hint = 'dd.MM.yyyy',
  decimal_separator_hint = '.'
WHERE name = 'UBS';
