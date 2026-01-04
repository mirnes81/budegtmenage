# Scan de Tickets - Documentation

## Vue d'ensemble

Fonctionnalité de scan de tickets avec reconnaissance automatique du fournisseur et apprentissage intelligent. Les images ne sont jamais sauvegardées (privacy by design).

## Fonctionnalités

### 1. Scan OCR Local
- **Technologie**: Tesseract.js (OCR côté client)
- **Langues supportées**: Français + Anglais
- **Extraction automatique**:
  - Montant (CHF)
  - Date (format dd.mm.yyyy ou dd/mm/yyyy)
  - Nom du fournisseur
  - Texte brut (snippet max 1000 chars)

### 2. Normalisation Fournisseur

Le système normalise automatiquement les noms de fournisseurs pour créer une clé unique (merchantKey).

**Fournisseurs suisses reconnus**:
- Supermarchés: Coop, Migros, Manor, Aldi, Lidl, Denner
- Bricolage: Ikea, Jumbo, Landi
- Pharmacies: Amavita, Sun Store, TopPharm, Apotheke
- Essence: Shell, Esso, BP, Tamoil, Agrola
- Transport: SBB CFF FFS
- Restaurants: McDonald's, Burger King, Subway

**Algorithme de normalisation**:
```
1. Convertir en majuscules
2. Supprimer chiffres et caractères spéciaux
3. Rechercher mots-clés connus
4. Si trouvé → merchantKey prédéfini (ex: COOP, MIGROS)
5. Sinon → prendre 1-2 premiers mots significatifs
```

### 3. Apprentissage Automatique (Merchant Rules)

Après le premier scan d'un fournisseur, l'app mémorise:
- Catégorie par défaut
- Compte par défaut
- Membre par défaut
- Type de déduction fiscale (si applicable)
- Compteur d'utilisation

**Table**: `merchant_rules`
```sql
- id: uuid
- user_id: uuid (RLS par utilisateur)
- merchant_key: text (unique par user)
- merchant_display: text
- category_id: uuid
- default_account_id: uuid
- default_member_id: uuid
- deduction_type: text
- use_count: integer
- created_at, updated_at: timestamptz
```

**Flux d'apprentissage**:
1. Premier scan d'un fournisseur inconnu
2. Message: "Fournisseur non reconnu. Choisis la catégorie une fois."
3. Utilisateur remplit catégorie/compte/membre
4. Toggle "Mémoriser ce fournisseur" ON par défaut
5. À la sauvegarde: création merchant_rule
6. Scans suivants: pré-remplissage automatique

### 4. Intégration Déductions Fiscales

Suggestions automatiques basées sur le fournisseur:

| Fournisseur | Déduction suggérée |
|-------------|-------------------|
| Pharmacies (Amavita, TopPharm, etc.) | HEALTH (Santé) |
| Transport (SBB, essence) | TRANSPORT |
| Crèche/garderie | CHILDCARE (si détecté) |

Les suggestions sont proposées mais l'utilisateur peut confirmer/rejeter.

### 5. Privacy & Sécurité

**AUCUNE image n'est sauvegardée**:
- Traitement en mémoire uniquement
- Suppression immédiate après OCR
- Affichage aperçu pendant scan puis destruction

**Données stockées** (table `transactions`):
```sql
- merchant_raw: text (nom brut extrait)
- merchant_key: text (version normalisée)
- raw_text_snippet: text (max 1000 chars)
- scanned_at: timestamptz
```

**Message affiché**: "Les images ne sont pas sauvegardées. Elles sont analysées localement puis supprimées immédiatement."

## Utilisation

### Dans QuickAddTransaction

1. Ouvrir "Ajouter transaction"
2. Cliquer "Scanner un ticket"
3. Choisir:
   - Prendre photo (caméra)
   - Ou choisir depuis galerie
4. Attendre analyse (barre de progression)
5. Vérifier/corriger les champs pré-remplis:
   - Montant
   - Date
   - Fournisseur (description)
   - Catégorie (suggérée si règle existante)
6. Toggle "Mémoriser ce fournisseur" (ON par défaut)
7. Enregistrer

### Indicateurs visuels

**Fournisseur reconnu** (merchant rule existe):
- Encart vert: "Fournisseur reconnu"
- Affiche: "{Nom} - Utilisé {N} fois"
- Tous les champs pré-remplis automatiquement

**Fournisseur inconnu**:
- Encart orange: "Fournisseur non reconnu"
- Message: "Choisis la catégorie une fois, l'app s'en souviendra"
- Champs pré-remplis partiellement (montant, date)

## Tests

### Tests Unitaires (26 tests)

**receiptScanner.test.ts**:
- `normalizeMerchant()`: 6 tests
  - Reconnaît Coop, Migros, pharmacies
  - Gère fournisseurs inconnus
  - Gère null/vide
- `extractAmountFromText()`: 6 tests
  - Extrait TOTAL, CHF, formats suisses
  - Gère apostrophe milliers (1'234.50)
  - Prend le plus grand montant si pas de TOTAL
- `extractDateFromText()`: 5 tests
  - Formats dd.mm.yyyy, dd/mm/yyyy, dd-mm-yy
  - Swap jour/mois si nécessaire
  - Fallback aujourd'hui
- `extractMerchantFromText()`: 3 tests
  - Extrait des premières lignes
  - Skip lignes numériques
- `extractReceiptInfo()`: 2 tests
  - Extraction complète
  - Extraction partielle
- `suggestDeductionType()`: 4 tests
  - HEALTH pour pharmacies
  - TRANSPORT pour carburant/train
  - null pour autres

**Commande**: `npm run test`
**Résultat**: ✅ 56/56 tests passent

### Tests E2E (recommandés)

Créer dans Playwright:

```typescript
test('scan ticket flow', async ({ page }) => {
  // 1. Ouvrir app
  await page.goto('/');

  // 2. Ouvrir Quick Add
  await page.click('button:has-text("Ajouter")');

  // 3. Cliquer Scanner
  await page.click('button:has-text("Scanner un ticket")');

  // 4. Upload fixture image
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/receipt-coop.jpg');

  // 5. Attendre extraction
  await page.waitForSelector('text=Analyse du ticket');
  await page.waitForSelector('button:has-text("Enregistrer")');

  // 6. Vérifier champs pré-remplis
  const amount = await page.inputValue('[placeholder="0.00"]');
  expect(amount).toBeTruthy();

  // 7. Enregistrer
  await page.click('button:has-text("Enregistrer")');

  // 8. Vérifier transaction créée
  await page.waitForSelector('text=Transaction ajoutée');
});

test('merchant rule learning', async ({ page }) => {
  // Premier scan: fournisseur inconnu
  // ... scan d'un petit commerce ...
  await page.waitForSelector('text=Fournisseur non reconnu');
  await page.click('#remember-merchant'); // Toggle ON
  // ... sélectionner catégorie ...
  await page.click('button:has-text("Enregistrer")');

  // Deuxième scan: même fournisseur
  // ... scan du même commerce ...
  await page.waitForSelector('text=Fournisseur reconnu');
  await page.waitForSelector('text=Utilisé 1 fois');
  // Catégorie automatiquement pré-sélectionnée
});
```

## Architecture Technique

### Fichiers créés

1. **Migration**:
   - `supabase/migrations/*_add_merchant_rules_and_receipt_scan.sql`
   - Crée table `merchant_rules`
   - Ajoute colonnes scan à `transactions`
   - RLS activé

2. **Helpers**:
   - `src/lib/receiptScanner.ts` (functions)
   - `src/lib/receiptScanner.test.ts` (26 tests)

3. **Composants**:
   - `src/components/ReceiptScanner.tsx` (UI scan)
   - `src/components/QuickAddTransaction.tsx` (intégration)

4. **Dépendance**:
   - `tesseract.js@^5.1.1`

### Flux de données

```
┌─────────────┐
│   Camera    │
│  / Galerie  │
└──────┬──────┘
       │ Image
       ▼
┌─────────────┐
│ Tesseract   │
│ OCR Local   │
└──────┬──────┘
       │ Text
       ▼
┌─────────────┐
│  Extract    │
│  Helpers    │
└──────┬──────┘
       │ {amount, date, merchant}
       ▼
┌─────────────┐
│  Normalize  │
│  Merchant   │
└──────┬──────┘
       │ merchantKey
       ▼
┌─────────────┐
│   Find      │
│MerchantRule │
└──────┬──────┘
       │ Rule | null
       ▼
┌─────────────┐
│  Pre-fill   │
│   Fields    │
└──────┬──────┘
       │ User confirms
       ▼
┌─────────────┐
│   Save      │
│ Transaction │
│ + Rule      │
└─────────────┘
```

### Optimisations possibles

1. **Cloud OCR** (optionnel):
   - Google Cloud Vision API
   - AWS Textract
   - Azure Computer Vision
   - Meilleure précision mais coûts

2. **Amélioration extraction**:
   - ML pour détection montant
   - Reconnaissance logos
   - Extraction TVA

3. **Interface**:
   - Crop/rotate image avant OCR
   - Ajustement contraste
   - Multi-page

4. **Merchant matching**:
   - Fuzzy matching (Levenshtein)
   - Suggestions multiples
   - Apprentissage par ML

## Déploiement

### Checklist

- [x] Migration appliquée
- [x] Tesseract.js installé
- [x] Tests unitaires passent (56/56)
- [x] Build réussi (862 KB)
- [x] RLS configuré
- [x] Privacy notice affiché
- [ ] Tests E2E (optionnel)
- [ ] Test sur vrai device mobile

### Configuration requise

**Backend**:
- Supabase DB avec migration appliquée
- RLS actif sur `merchant_rules`

**Frontend**:
- `tesseract.js` version 5.1.1+
- Navigateur avec `FileReader` API
- Caméra (optionnel, peut utiliser galerie)

**Browser Support**:
- Chrome/Edge 88+
- Safari 14+
- Firefox 90+

### Permissions mobile

**Android**: `<uses-permission android:name="android.permission.CAMERA" />`
**iOS**: `NSCameraUsageDescription` dans Info.plist

## Support & FAQ

### Q: Pourquoi l'OCR est lent ?
**R**: Tesseract.js tourne côté client pour garantir privacy. Première utilisation télécharge modèles (~10MB). Ensuite c'est en cache.

### Q: Peut-on utiliser une API OCR externe ?
**R**: Oui, remplacer Tesseract.js par un appel API dans `ReceiptScanner.tsx`. Attention: images envoyées au serveur (moins de privacy).

### Q: Les merchant rules sont-elles partagées entre utilisateurs ?
**R**: Non, RLS garantit isolation par user. Chaque utilisateur a ses propres règles.

### Q: Que se passe-t-il si je change de catégorie pour un fournisseur connu ?
**R**: La merchant rule est mise à jour. Le compteur `use_count` s'incrémente.

### Q: Peut-on supprimer/éditer les merchant rules ?
**R**: Pas d'UI pour l'instant. Peut être ajouté dans Settings > Fournisseurs mémorisés.

### Q: Les tickets à l'envers/flous sont reconnus ?
**R**: OCR best effort. Si échec, saisie manuelle possible. Améliorer avec pre-processing image.

## Roadmap

### Version actuelle (v1.0)
- [x] Scan basique avec Tesseract.js
- [x] Extraction montant/date/fournisseur
- [x] Normalisation fournisseurs suisses
- [x] Apprentissage automatique (merchant rules)
- [x] Intégration déductions fiscales
- [x] Privacy by design (pas de stockage images)

### Futur (v1.1+)
- [ ] Page gestion merchant rules
- [ ] Statistiques fournisseurs
- [ ] Export merchant rules
- [ ] Amélioration OCR (pre-processing)
- [ ] Support multi-langues OCR
- [ ] Détection automatique devise
- [ ] Scan batch (plusieurs tickets)
- [ ] Historique scans ratés

## Contribution

Pour améliorer la reconnaissance:

1. **Ajouter fournisseur** dans `SWISS_MERCHANTS` (receiptScanner.ts)
2. **Ajouter test** dans receiptScanner.test.ts
3. **Tester** avec vrai ticket du fournisseur
4. **PR** avec exemple d'extraction

Format:
```typescript
NOUVEAU_MERCHANT: {
  display: 'Nom Affiché',
  keywords: ['mot-clé1', 'mot-clé2']
}
```
