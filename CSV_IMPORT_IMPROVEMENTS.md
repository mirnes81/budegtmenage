# Améliorations Import CSV – Catégorisation & Affichage

## Objectif
Avoir une liste de transactions **PROPRE, LOGIQUE, UTILE POUR LE BUDGET** après import CSV.

## Problèmes Corrigés

### 1. ✅ Dépenses Classées en Revenus
**Problème**: Des transactions négatives étaient incorrectement catégorisées comme "Revenus"

**Solution**:
- Ajout d'une vérification stricte: `if (amount < 0 && categoryId === revenusCategoryId) → fallback to "Divers"`
- Les dépenses (amount < 0) ne peuvent JAMAIS être classées en "Revenus"
- Seules les transactions avec amount > 0 ou des mots-clés explicites (salaire, crédit) sont des revenus

**Code**: `src/components/CsvImport.tsx:379-381`

### 2. ✅ Catégorisation Hiérarchique Améliorée

**Hiérarchie appliquée (dans cet ordre)**:
1. **MerchantRule** (règle mémorisée utilisateur) → priorité absolue
2. **KeywordRule prioritaire** (priority 1-2) → merchants spécifiques
3. **KeywordRule secondaire** (priority 3-10) → patterns généraux
4. **Fallback** → "Divers"

**Nouvelles règles (62 patterns)**:
- **Courses**: aldi, migros, coop, lidl, denner, spar, volg, landi
- **Essence**: eni, esso, shell, bp, avanti, tamoil, station
- **Restaurants**: restaurant, pizzeria, cafe, mcdonalds, burger king
- **Pharmacie**: pharmacie, amavita, benu, sunstore
- **Transports**: sbb, cff, tl, tpg
- **Travaux**: laticrete, hornbach, jumbo, bricolage, construction
- **Auto**: bmw, garage, pneu
- **Assurances**: baloise, axa, zurich, vaudoise
- **Frais bancaires**: frais, coûts, e-banking
- **Loyer**: loyer, miete, hypothèque
- **Impôts**: impôt, canton, commune
- **Télécom**: swisscom, sunrise, salt
- **Abonnements**: netflix, spotify, disney

### 3. ✅ Nettoyage Description Amélioré

**Nouveaux patterns supprimés**:
- IBAN: `CH\d{2}\s*\d{4}...`
- Dates: `01.12.2024`, `2024-12-01`
- Références: `Reference: XXX-YYY-ZZZ`
- Numéros transaction: `No de transaction: XXX`
- QRR codes
- Téléphones: `Tel. 0123456789`
- URLs: `www.example.com`, `http://...`

**Limite stricte**: 80 caractères max (tronqué avec `...` si dépassé)

**Code**: `src/lib/bankDescriptionCleaner.ts:17-63`

### 4. ✅ Merchant Unique & Normalisé

**Normalisation appliquée**:
- Majuscules
- Suppression chiffres
- Suppression codes postaux (4 chiffres)
- Suppression pays (CH, IT, FR, DE)
- Limite à 2 mots significatifs

**Résultat**: Un merchant = une ligne, pas de duplication visuelle

**Code**: `src/lib/bankDescriptionCleaner.ts:65-76`

### 5. ✅ Post-Import Catégorisation Rapide

**Fonctionnalité**:
- Après import, écran automatique si transactions "Divers"
- Groupement par merchant normalisé
- Interface simple: sélectionner catégorie → appliquer à toutes
- Mémorisation automatique dans `merchant_rules`

**Avantages**:
- L'utilisateur catégorise une seule fois
- Prochains imports: auto-catégorisés
- Gains de temps considérable

**Code**: `src/components/QuickCategorization.tsx`

### 6. ✅ Amélioration Anti-Duplicates

**Changement**:
- Création du `import_file` AVANT insertion transactions
- Toutes les transactions liées via `import_file_id`
- Tracking précis même en cas d'erreur partielle
- Mise à jour finale avec compteurs exacts

**Code**: `src/components/CsvImport.tsx:248-270`

## Tests

### Tests Unitaires (146 tests)
- ✅ `bankDescriptionCleaner.test.ts` (34 tests)
- ✅ `csvParser.test.ts` (24 tests)
- ✅ `bankPresets.test.ts` (17 tests)
- ✅ Autres tests existants

### Tests Intégration (6 nouveaux tests)
- ✅ Parsing UBS CSV correct
- ✅ Extraction merchants propres
- ✅ Normalisation unique
- ✅ Distinction dépenses/revenus
- ✅ Descriptions < 80 caractères
- ✅ Au moins 4 catégories différentes

**Fichier**: `src/lib/csvImport.integration.test.ts`

## Validation QA

```bash
npm run qa
```

**Résultat**:
- ✅ 0 erreurs ESLint (17 warnings mineurs)
- ✅ 146 tests passent
- ✅ Build réussi

## Exemple Import UBS

**Avant**:
```
Description: "ALDI SUISSE SA No de transaction: TRX-001 IBAN: CH12..."
Catégorie: Revenus ❌
Longueur: 120 caractères
```

**Après**:
```
Description: "ALDI SUISSE SA"
Catégorie: Courses ✅
Longueur: 15 caractères
```

## Garanties

1. ✅ **Aucune dépense classée en Revenus**
2. ✅ **Descriptions lisibles < 80 caractères**
3. ✅ **Au moins 4 catégories utilisées automatiquement**
4. ✅ **Pas de doublons visuels**
5. ✅ **Catégorisation intelligente via 62 patterns**
6. ✅ **Post-import: catégorisation rapide des inconnus**

## Migration Keyword Rules

Les anciennes keyword rules (82) ont été remplacées par 62 règles optimisées.

**Commande SQL**: Déjà appliquée via `mcp__supabase__execute_sql`

## Prochaines Étapes Optionnelles

1. Ajouter plus de patterns Swiss-specific
2. Support multi-banques (BCV, PostFinance, etc.)
3. Détection automatique de la banque via headers
4. Export des merchant rules pour partage
