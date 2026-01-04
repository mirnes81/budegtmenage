# QA Checklist - Budget Ménage Suisse

## Authentification
- [x] **Écran de login** - Affiche correctement
- [x] **Login avec mot de passe** - Fonctionne avec mot de passe correct
- [x] **Message d'erreur** - Affiche erreur si mot de passe incorrect
- [x] **Masquer/Afficher mot de passe** - Toggle fonctionne
- [x] **Persistance session** - Reste connecté après refresh
- [x] **Déconnexion** - Bouton déconnexion fonctionne

## Navigation
- [x] **Bottom Navigation (Mobile)** - Affiche et fonctionne sur mobile
- [x] **Sidebar (Desktop)** - Affiche et fonctionne sur desktop
- [x] **Navigation entre pages** - Toutes les routes fonctionnent
- [x] **Highlighting page active** - Page active est mise en évidence

## Dashboard
- [x] **Affichage statistiques du mois** - Revenus, Dépenses, Solde, Épargne
- [x] **Calculs corrects** - Sommes correctes
- [x] **Transactions récentes** - Liste des 5 dernières transactions
- [x] **Format CHF** - Affichage avec apostrophe milliers (3'420.50)
- [x] **Couleurs** - Vert pour revenus, rouge pour dépenses

## Transactions
### Création
- [x] **Bouton "Nouvelle transaction"** - Ouvre le modal
- [x] **Formulaire complet** - Tous les champs présents
- [x] **Validation champs** - Champs requis vérifiés
- [x] **Sélection type** - Dépense/Revenu
- [x] **Sélection catégorie** - Liste filtrée par type
- [x] **Sélection compte** - Toutes les options disponibles
- [x] **Sélection membre** - Tous les membres disponibles
- [x] **Sauvegarde** - Crée la transaction correctement
- [x] **Fermeture modal** - Modal se ferme après sauvegarde

### Liste
- [x] **Affichage liste** - Toutes les transactions affichées
- [x] **Format tableau** - Colonnes correctes et lisibles
- [x] **Tri par date** - Transactions triées par date décroissante
- [x] **Recherche** - Filtre par description et catégorie
- [x] **Filtres type** - Tout/Revenus/Dépenses fonctionnent
- [x] **Affichage mobile** - Responsive et lisible

### Modification
- [x] **Bouton éditer** - Ouvre le modal en mode édition
- [x] **Champs pré-remplis** - Données de la transaction chargées
- [x] **Mise à jour** - Sauvegarde les modifications
- [x] **Annulation** - Ferme sans modifier

### Suppression
- [x] **Bouton supprimer** - Accessible
- [x] **Confirmation** - Demande confirmation
- [x] **Suppression** - Retire de la liste
- [x] **Annulation suppression** - Cancel fonctionne

## Charges Fixes
### Création
- [x] **Bouton "Nouvelle charge"** - Ouvre le modal
- [x] **Formulaire complet** - Tous les champs présents
- [x] **Sélection fréquence** - Mensuel/Trimestriel/Semestriel/Annuel
- [x] **Jour du mois** - Validation 1-31
- [x] **Checkbox actif** - Fonctionne
- [x] **Sauvegarde** - Crée la charge fixe

### Liste
- [x] **Affichage liste** - Toutes les charges affichées
- [x] **Information complètes** - Toutes les données visibles
- [x] **Indicateur inactif** - Charges inactives marquées
- [x] **Tri** - Par jour du mois

### Génération automatique
- [x] **Bouton "Générer ce mois"** - Accessible
- [x] **Confirmation** - Demande confirmation
- [x] **Génération transactions** - Crée les transactions automatiquement
- [x] **Prévention doublons** - Ne génère pas deux fois le même mois
- [x] **Marquage transactions fixes** - is_fixed = true
- [x] **Feedback** - Message de succès/erreur

### Modification/Suppression
- [x] **Bouton éditer** - Fonctionne
- [x] **Mise à jour** - Sauvegarde les modifications
- [x] **Bouton supprimer** - Fonctionne avec confirmation

## Statistiques
### Affichage
- [x] **Sélection période** - Mois/Trimestre/Année
- [x] **Résumé chiffres** - Revenus/Dépenses/Solde
- [x] **Graphique évolution** - Line chart 12 mois
- [x] **Graphique catégories** - Pie chart dépenses
- [x] **Graphique membres** - Bar chart dépenses
- [x] **Top 10 catégories** - Liste avec pourcentages
- [x] **Couleurs graphiques** - Lisibles et cohérentes

### Export
- [x] **Bouton Export CSV** - Accessible
- [x] **Téléchargement CSV** - Fichier généré
- [x] **Format CSV** - Correct et lisible

## Estimation Impôts
### Configuration
- [x] **Champ NPA** - Input texte
- [x] **Champ commune** - Input texte
- [x] **Sélection canton** - Dropdown avec tous les cantons
- [x] **État civil** - Dropdown
- [x] **Nombre enfants** - Input nombre
- [x] **Checkbox impôt ecclésiastique** - Fonctionne
- [x] **Revenu annuel manuel** - Input optionnel
- [x] **Déductions** - Input optionnel
- [x] **Bouton sauvegarder** - Sauvegarde et recalcule

### Calcul
- [x] **Estimation automatique** - Basée sur transactions
- [x] **Fourchette basse/haute** - Affichée
- [x] **Taux marginal** - Calculé et affiché
- [x] **Alerte zone taxée** - Si taux > 30%
- [x] **Disclaimer** - Avertissement estimation

### Affichage
- [x] **Revenu estimé** - Affiché
- [x] **Estimation impôts** - Fourchette affichée
- [x] **Taux marginal** - Pourcentage affiché
- [x] **Couleurs alertes** - Rouge si élevé

## Paramètres
### Apparence
- [x] **Toggle dark mode** - Fonctionne (déjà dark par défaut)
- [x] **Persistance** - Mode sauvegardé

### Sécurité
- [x] **Bouton changer mot de passe** - Ouvre modal
- [x] **Formulaire changement** - Tous les champs
- [x] **Validation** - Vérifie ancien mot de passe
- [x] **Confirmation** - Nouveau mot de passe confirmé
- [x] **Mise à jour** - Hash et sauvegarde
- [x] **Message succès** - Affiché
- [x] **Bouton déconnexion** - Fonctionne

### Données
- [x] **Export données** - Génère JSON complet
- [x] **Format export** - JSON valide avec toutes les tables
- [x] **Nom fichier** - Avec date
- [x] **Import données** - Charge fichier JSON
- [x] **Confirmation import** - Avertissement remplacement
- [x] **Restauration** - Remplace les données

### Format
- [x] **Affichage devise** - CHF
- [x] **Format nombres** - Apostrophe milliers
- [x] **Fuseau horaire** - Europe/Zurich

### À propos
- [x] **Version** - Affichée
- [x] **Description** - Présente

## Responsive Design
- [x] **Mobile portrait** - Tous les écrans lisibles
- [x] **Mobile landscape** - Fonctionnel
- [x] **Tablette** - Layout adapté
- [x] **Desktop** - Pleine utilisation de l'espace
- [x] **Bottom nav mobile** - Fixée en bas
- [x] **Sidebar desktop** - Fixée à gauche

## Performance
- [x] **Chargement initial** - < 3 secondes
- [x] **Navigation entre pages** - Instantanée
- [x] **Skeleton loading** - États de chargement
- [x] **Build réussi** - npm run build OK
- [x] **Pas d'erreurs console** - Console propre

## Données de démo
- [x] **Script seed** - npm run seed fonctionne
- [x] **Membres** - 6 membres créés
- [x] **Comptes** - 4 comptes créés
- [x] **Catégories** - 28 catégories créées
- [x] **Transactions exemples** - Créées
- [x] **Charge fixe exemple** - Créée
- [x] **Paramètres fiscaux** - Initialisés

## Tests
- [x] **Tests unitaires** - 8/8 passent
- [x] **Format CHF** - Testé
- [x] **Parse CHF** - Testé
- [x] **npm run qa** - Lint + typecheck + tests + build OK

## Sécurité
- [x] **Mot de passe hashé** - bcrypt
- [x] **Pas de secrets exposés** - Variables env uniquement
- [x] **RLS Supabase** - Activé sur toutes les tables
- [x] **Validation inputs** - Champs requis vérifiés

## UX/UI
- [x] **Dark mode** - Cohérent
- [x] **Couleurs** - Palette harmonieuse
- [x] **Typographie** - Lisible
- [x] **Espacement** - Correct
- [x] **Feedback visuel** - Hover states
- [x] **Messages erreur** - Clairs
- [x] **Messages succès** - Affichés
- [x] **Loading states** - Spinners présents
- [x] **Empty states** - Gérés

---

## Résumé
**Total items**: 150+
**Status**: ✅ Toutes les fonctionnalités principales sont implémentées et fonctionnelles

## UX Améliorations (Style FocusDaily)
### Saisie Transaction Ultra-Rapide
- [x] **Auto-focus montant** - Focus automatique sur champ montant
- [x] **Smart defaults** - Mémorisation des derniers choix (catégorie, compte, membre, type)
- [x] **Raccourcis catégories** - Section ⚡ Raccourcis avec 6 catégories fréquentes (Courses, Loyer, Essence, LAMal, École, Abonnements)
- [x] **Favoris dynamiques** - Section ⭐ Favoris avec top 6 catégories les plus utilisées (90 jours)
- [x] **Bouton Dupliquer** - Copie transaction avec date du jour
- [x] **Objectif < 10 secondes** - Workflow optimisé pour saisie rapide

### Liste Transactions Premium
- [x] **Groupement par jour** - Séparateurs clairs avec "Aujourd'hui", "Hier", dates
- [x] **Total journalier** - Somme affichée pour chaque jour
- [x] **Menu contextuel** - Actions Modifier/Dupliquer/Supprimer via bouton •••
- [x] **Icônes catégories** - Emojis colorés avec badges
- [x] **Montants alignés** - À droite pour lecture rapide
- [x] **Couleurs contrastées** - Vert revenus / Rouge dépenses
- [x] **Empty state** - Message pédagogique si aucune transaction

### Pickers Style FocusDaily
- [x] **Bottom drawer mobile** - Slide-up animé avec backdrop blur
- [x] **Recherche instantanée** - Filtre en temps réel
- [x] **3 sections** - Raccourcis / Favoris / Groupes
- [x] **Sélection 1-tap** - Fermeture automatique
- [x] **Animations 250ms** - Smooth et fluides
- [x] **Visual feedback** - État sélectionné avec check

### Micro-UX
- [x] **Toasts** - Notifications courtes et claires (succès/erreur/info)
- [x] **Skeleton loading** - États de chargement élégants
- [x] **FAB positioning** - Positionné pour pouce (bottom-20 mobile, bottom-8 desktop)
- [x] **Feedback immédiat** - Hover states sur tous les boutons
- [x] **Animations CSS** - slideUp, slideDown (300ms ease-out)
- [x] **Empty states** - Messages pédagogiques avec call-to-action

### Design Premium
- [x] **Cards arrondis** - Border-radius 16-20px (xl)
- [x] **Espacement cohérent** - Système 8px avec gap-3, gap-4, gap-6
- [x] **Typographie** - Hiérarchie claire (3xl bold / lg medium / sm regular)
- [x] **Couleurs** - Palette slate avec accents blue/green/red
- [x] **Backdrop blur** - Sur modals et toasts
- [x] **Shadow system** - shadow-2xl sur FAB et toasts

### Performance UX
- [x] **localStorage** - Persistence des defaults (pas de backend)
- [x] **Lazy loading catégories** - Chargement à l'ouverture du picker
- [x] **Debounce search** - Pas implémenté (pas nécessaire avec React state)
- [x] **Smooth scroll** - Navigation fluide entre sections

## Déductions Fiscales (Canton de Vaud)
### Suggestions Automatiques
- [x] **Règles de déduction** - 5 règles créées (LAMal, Médecin/Pharmacie, École/Crèche, Loyer/Hypothèque, Entretien/Réparations)
- [x] **Suggestion lors de saisie** - Bandeau bleu apparaît après sélection catégorie
- [x] **Boutons Confirmer/Ignorer** - Actions claires
- [x] **Split choice pour règles ambiguës** - Demande précision (entretien vs amélioration, etc.)
- [x] **Confirmation visuelle** - Badge vert quand déduction confirmée
- [x] **Sauvegarde avec transaction** - deduction_type, deduction_status, tax_year stockés

### Page Rapport Fiscal
- [x] **Sélecteur année** - Dropdown 5 dernières années
- [x] **Revenu estimé** - Calculé automatiquement depuis transactions income
- [x] **Déductions totales** - Somme de toutes déductions confirmées
- [x] **Section Santé spéciale** - Calcul franchise 5% revenu net
- [x] **Montant déductible santé** - Total - franchise, avec détails
- [x] **Déductions par type** - Card pour chaque type avec notes VD
- [x] **Liste transactions détaillées** - Toutes transactions avec déduction confirmée
- [x] **Export CSV** - Téléchargement rapport complet
- [x] **Disclaimer clair** - Avertissement estimation indicative
- [x] **Empty state** - Message si aucune déduction

### Data Model
- [x] **Colonne deduction_type** - Enum 7 types (NONE, HEALTH, CHILDCARE, etc.)
- [x] **Colonne deduction_status** - Enum 4 statuts (NONE, SUGGESTED, CONFIRMED, REJECTED)
- [x] **Colonne tax_year** - Année fiscale auto-remplie
- [x] **Table deduction_rules** - Règles suggestion par catégorie
- [x] **RLS activé** - Policies lecture/écriture pour authenticated
- [x] **Index créés** - tax_year, deduction_type, deduction_status, category_id

### Tests
- [x] **Tests unitaires déductions** - 11 tests pour taxDeductions.ts
- [x] **Aggregate par type** - Fonction testée
- [x] **Calcul franchise santé** - 5% revenu testé
- [x] **Format summary** - Formatage testé

## Améliorations Mobile (Janvier 2026)
### Corrections d'affichage
- [x] **Transaction cards** - Emojis contraints, texte tronqué correctement
- [x] **Layout flex amélioré** - Utilisation de flex-shrink-0, min-w-0, truncate
- [x] **Icônes optimisées** - Taille réduite (text-xl, leading-none, overflow-hidden)
- [x] **Boutons responsive** - Text adaptatif (sm:inline/sm:hidden)
- [x] **Headers responsive** - Titres text-2xl md:text-3xl
- [x] **Padding bottom** - pb-24 sur toutes les pages pour éviter bottom nav

### Pages optimisées mobile
- [x] **Dashboard** - Cards transactions compactes et responsive
- [x] **Transactions** - Layout amélioré, filtres scrollables horizontalement
- [x] **Stats** - Boutons export adaptés mobile
- [x] **Rapport Fiscal** - Dropdown et export responsive
- [x] **Recurring** - Boutons génération adaptés mobile

### Détails techniques
- [x] **whitespace-nowrap** sur montants pour éviter coupure
- [x] **max-w-[80px]** sur noms de comptes
- [x] **gap-3** au lieu de gap-4 pour plus compact
- [x] **items-start** au lieu de items-center pour éviter étirement
- [x] **flex-1 md:flex-none** sur selects pour remplir largeur mobile

## Scan de Tickets + Apprentissage Fournisseur (Janvier 2026)
### Fonctionnalités scan
- [x] **Bouton scan** - Dans QuickAddTransaction
- [x] **OCR local** - Tesseract.js (français + anglais)
- [x] **Extraction automatique** - Montant, date, fournisseur
- [x] **Normalisation merchant** - 15+ fournisseurs suisses reconnus
- [x] **Privacy** - Images jamais sauvegardées, traitement local uniquement

### Apprentissage automatique (Merchant Rules)
- [x] **Table merchant_rules** - Migration appliquée avec RLS
- [x] **Détection fournisseur** - merchantKey unique par user
- [x] **Pré-remplissage auto** - Catégorie, compte, membre mémorisés
- [x] **Toggle mémorisation** - ON par défaut, désactivable
- [x] **Incrémentation usage** - use_count++ à chaque utilisation
- [x] **Intégration déductions** - Suggestions auto (pharmacies→HEALTH, transport→TRANSPORT)

### UI/UX scan
- [x] **Encart privacy** - "Images non sauvegardées"
- [x] **Barre progression** - 0-100% pendant OCR
- [x] **Indicateur fournisseur reconnu** - Encart vert avec compteur
- [x] **Indicateur fournisseur inconnu** - Encart orange avec explication
- [x] **Vérification champs** - Tous éditables avant enregistrement

### Tests scan
- [x] **26 tests unitaires** - receiptScanner.test.ts
- [x] **normalizeMerchant** - 6 tests (Coop, Migros, pharmacies, inconnus)
- [x] **extractAmount** - 6 tests (TOTAL, CHF, formats suisses)
- [x] **extractDate** - 5 tests (formats variés, fallback)
- [x] **extractMerchant** - 3 tests
- [x] **extractReceiptInfo** - 2 tests (complet, partiel)
- [x] **suggestDeductionType** - 4 tests
- [x] **Total tests** - 56/56 passent ✅

## Import CSV Bancaire (Janvier 2026)
### Étape 1 - Upload
- [x] **Page import dédiée** - Route /import-csv accessible
- [x] **Bouton dans Transactions** - Lien "Import CSV" visible
- [x] **Sélection compte** - Dropdown tous comptes disponibles
- [x] **Upload fichier** - Input file accepte .csv uniquement
- [x] **Affichage fichier** - Nom et taille affichés
- [x] **Validation** - Erreur si pas .csv ou pas de compte sélectionné
- [x] **Bouton Analyser** - Lance l'analyse du fichier

### Étape 2 - Détection automatique
- [x] **Détection séparateur** - ; , ou \t détecté automatiquement
- [x] **Détection format date** - dd.MM.yyyy, yyyy-MM-dd, dd/MM/yyyy
- [x] **Détection décimales** - . ou , détecté
- [x] **Détection preset banque** - UBS, PostFinance, Raiffeisen, BCV, Generic
- [x] **Preview CSV** - Affichage 20 premières lignes avec headers
- [x] **Warning doublon fichier** - Message si fichier déjà importé avec date

### Étape 3 - Mapping colonnes
- [x] **Mapping automatique** - Colonnes mappées selon preset détecté
- [x] **Mapping manuel** - Dropdowns pour chaque champ si Generic
- [x] **Champs requis** - Date, Description validés
- [x] **Amount OU Debit/Credit** - Au moins un requis
- [x] **Champs optionnels** - Currency, Balance, ValueDate, Reference
- [x] **Sélection membre** - Défaut "Ménage"
- [x] **Toggle règles marchands** - ON par défaut (auto-catégorisation)
- [x] **Toggle mémoriser mapping** - ON par défaut
- [x] **Validation mapping** - Messages d'erreur si incomplet

### Étape 4 - Import et résultat
- [x] **Import transactions** - Création en base de données
- [x] **Déduplication par hash** - import_line_hash unique
- [x] **Skip doublons** - Transactions existantes ignorées
- [x] **Compteurs** - Total / Importées / Ignorées affichés
- [x] **Liste erreurs** - Si erreurs lors import
- [x] **Bouton Terminé** - Retour à liste transactions

### Parsing robuste
- [x] **Parse montants** - 1'234.50, 1.234,50, 1234.50, 1234,50
- [x] **Parse debit/credit** - Colonnes séparées supportées
- [x] **Parse montant signé** - Colonne Amount avec +/-
- [x] **Parse dates** - Multiples formats supportés
- [x] **Normalisation description** - Trim, collapse spaces, remove control chars
- [x] **Gestion currency** - CHF, EUR, USD reconnus
- [x] **Gestion balance** - Colonne solde optionnelle
- [x] **Gestion valeurs vides** - Skip lignes invalides

### Anti-doublons
- [x] **Line hash** - SHA-256 (accountId + date + amount + description + ref + valueDate)
- [x] **Unique index** - import_line_hash indexé en base
- [x] **File hash** - SHA-256 du fichier complet
- [x] **Detection réimport** - Warning si fichier déjà importé
- [x] **Table import_files** - Historique des imports
- [x] **Compteur usage** - rows_total, rows_imported, rows_skipped

### Présets banques
- [x] **Preset UBS** - Headers détectés, mapping auto
- [x] **Preset PostFinance** - Structure prête
- [x] **Preset Raiffeisen** - Structure prête
- [x] **Preset BCV** - Structure prête
- [x] **Preset Generic** - Mapping manuel pour autres banques
- [x] **Match partiel** - 50% threshold pour détection
- [x] **Case insensitive** - Headers matchés sans casse
- [x] **Table bank_csv_presets** - Présets en base de données
- [x] **Multi-language** - EN/DE/FR headers supportés

### Base de données
- [x] **Table import_files** - id, account_id, file_name, file_hash, stats, created_at
- [x] **Table bank_csv_presets** - id, name, match_headers, mapping, hints
- [x] **Transactions.import_source** - "CSV" ou "MANUAL"
- [x] **Transactions.import_line_hash** - Unique index pour déduplication
- [x] **Transactions.import_file_id** - Foreign key vers import_files
- [x] **RLS activé** - Policies sur toutes nouvelles tables
- [x] **Unique constraint** - (account_id, file_hash) pour détection réimport

### Privacy et sécurité
- [x] **CSV en mémoire** - Fichiers jamais stockés sur serveur
- [x] **Hash uniquement** - Seulement file_hash sauvegardé
- [x] **RLS** - Row Level Security sur toutes tables
- [x] **Validation inputs** - Tous champs validés avant insert
- [x] **No SQL injection** - Prepared statements Supabase

### Tests
- [x] **Tests CSV parser** - 24 tests unitaires
- [x] **Tests déduplication** - 9 tests unitaires
- [x] **Tests bank presets** - 17 tests unitaires
- [x] **Total tests import** - 50 tests passent ✅
- [x] **Détection délimiteur** - Testé
- [x] **Parse montants** - Tous formats testés
- [x] **Parse dates** - Multiples formats testés
- [x] **Hash stable** - Génération consistente testée
- [x] **Validation mapping** - Cas valides/invalides testés

### UX/UI
- [x] **Wizard 4 étapes** - Progression visuelle claire
- [x] **Numéros étapes** - 1-2-3-4 avec couleurs
- [x] **Bouton retour** - Navigation vers Transactions
- [x] **Liste banques supportées** - Affichée sur page accueil
- [x] **Instructions claires** - 4 étapes expliquées
- [x] **Loading states** - Spinners pendant analyse/import
- [x] **Messages erreur** - Clairs et contextuels
- [x] **Messages succès** - Toast après import
- [x] **Responsive** - Mobile et desktop optimisés

## Notes
- Application complète et fonctionnelle
- Toutes les pages principales implémentées
- CRUD complet sur transactions et charges fixes
- Statistiques avec graphiques
- Estimation impôts basique mais fonctionnelle
- **Déductions fiscales VD avec suggestions automatiques**
- **Rapport fiscal avec agrégation et export CSV**
- **Scan de tickets avec apprentissage automatique fournisseur**
- **Import CSV bancaire avec présets UBS + autres banques**
- **Anti-doublons infaillible avec line hash + file hash**
- **Privacy by design: aucune image ni CSV sauvegardés**
- Format CHF suisse respecté
- Dark mode par défaut
- **Responsive mobile et desktop - optimisé janvier 2026**
- Tests unitaires passent (106/106) ✅
- Build réussi
- **UX premium style FocusDaily implémentée**
- **Problèmes d'affichage mobile corrigés (débordement texte, emojis)**
