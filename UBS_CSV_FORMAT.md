# UBS CSV Format Documentation

## Format Overview

UBS CSV files have a specific structure that differs from standard CSV files:

- **Encoding**: UTF-8 with BOM
- **Delimiter**: Semicolon (;)
- **Date Format**: dd.MM.yyyy
- **Decimal Separator**: . (period)
- **Multiple metadata lines** before the actual header row

## File Structure

```
[Metadata Line 1]
[Metadata Line 2]
[...more metadata lines...]
Date de transaction;Description1;Description2;Description3;Débit;Crédit;Date de comptabilisation;Date de valeur;Monnaie;Solde;No de transaction
[Data rows...]
```

## Column Details

| Column Name               | Required | Description                              |
|--------------------------|----------|------------------------------------------|
| Date de transaction      | Yes      | Transaction date                         |
| Description1             | Yes      | Primary description                      |
| Description2             | No       | Secondary description (concatenated)     |
| Description3             | No       | Tertiary description (concatenated)      |
| Débit                    | No       | Debit amount (negative transactions)     |
| Crédit                   | No       | Credit amount (positive transactions)    |
| Date de comptabilisation | Yes      | Booking date (preferred for import)      |
| Date de valeur           | No       | Value date                               |
| Monnaie                  | No       | Currency (e.g., CHF, EUR)               |
| Solde                    | No       | Account balance after transaction        |
| No de transaction        | No       | Transaction reference number             |

## Important Notes

1. **Header Detection**: The system automatically finds the header row by looking for the signature "Date de transaction" at the start of a line.

2. **Metadata Skipping**: All lines before the header are automatically ignored.

3. **Description Concatenation**: Description1, Description2, and Description3 are automatically concatenated with spaces into a single description field.

4. **Amount Calculation**:
   - If **Crédit** has a value: amount = +Crédit (positive)
   - If **Débit** has a value: amount = -Débit (negative)
   - Empty rows (no debit or credit) are skipped

5. **Character Encoding**: Special characters (é, è, à, ô, etc.) are properly handled with UTF-8 encoding.

## Example UBS CSV

```
Compte: 12345678
Période: 01.01.2024 - 31.01.2024
Date de transaction;Description1;Description2;Description3;Débit;Crédit;Date de comptabilisation;Date de valeur;Monnaie;Solde;No de transaction
15.01.2024;Paiement carte;Restaurant;Café du Centre;;45.50;15.01.2024;15.01.2024;CHF;1234.50;TXN001
20.01.2024;Virement;Salaire;;;5000.00;20.01.2024;20.01.2024;CHF;6234.50;TXN002
25.01.2024;Prélèvement;Loyer;;1200.00;;25.01.2024;25.01.2024;CHF;5034.50;TXN003
```

## Automatic Mapping

When a UBS CSV file is detected, the system automatically maps:

- **Date**: Date de comptabilisation (primary) or Date de transaction (fallback)
- **Description**: Description1 + Description2 + Description3 (concatenated)
- **Amount**: Calculated from Débit/Crédit columns
- **Currency**: Monnaie
- **Balance**: Solde
- **Value Date**: Date de valeur
- **Reference**: No de transaction

## Import Workflow

1. **Upload**: Select the UBS CSV file
2. **Detect**: System automatically:
   - Skips metadata lines
   - Finds the header row
   - Detects UBS format
   - Applies character encoding fixes
3. **Mapping**: All fields are pre-filled automatically
4. **Import**: Transactions are imported with proper:
   - Description concatenation
   - Amount calculation (Débit/Crédit → Amount)
   - Duplicate detection
   - Character encoding

## Supported Banks

This system also supports similar formats from:
- PostFinance
- Raiffeisen
- BCV (Banque Cantonale Vaudoise)
- Other Swiss banks with similar CSV structures
