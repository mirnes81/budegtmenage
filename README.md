# Budget Ménage Suisse

Application web moderne de gestion de budget familial pour les ménages suisses.

## Fonctionnalités

### Gestion des transactions
- Ajout, modification et suppression de transactions
- Support des revenus et dépenses
- Catégorisation détaillée
- Filtrage et recherche avancée
- Attribution par membre du ménage
- Gestion multi-comptes (Banque, Carte, Cash, TWINT)

### Charges fixes récurrentes
- Configuration de dépenses récurrentes (mensuelles, trimestrielles, semestrielles, annuelles)
- Génération automatique des transactions
- Prévention des doublons
- Activation/désactivation des charges

### Budgets
- Définition de budgets par catégorie
- Suivi en temps réel de la consommation
- Alertes visuelles en cas de dépassement

### Statistiques et rapports
- Graphiques interactifs (évolution mensuelle, répartition par catégorie, dépenses par membre)
- Périodes configurables (mois, trimestre, année)
- Top 10 des catégories
- Export CSV

### Estimation impôts Suisse
- Calcul simplifié des impôts fédéraux, cantonaux et communaux
- Configuration par canton et commune
- Prise en compte de l'état civil et du nombre d'enfants
- Taux marginal d'imposition
- Alertes si taux élevé

### Paramètres
- Changement de mot de passe
- Export/Import des données (sauvegarde JSON complète)
- Mode sombre par défaut
- Format CHF suisse (apostrophe milliers: 3'420.50)

## Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS
- **Graphiques**: Recharts
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Simple (1 mot de passe local hashé avec bcrypt)
- **État**: Zustand
- **Routage**: React Router
- **Tests**: Vitest + Playwright
- **Déploiement**: Docker + Nginx

## Prérequis

- Node.js 18+ et npm
- Docker et Docker Compose (pour déploiement)
- Compte Supabase (déjà configuré)

## Installation locale

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd budget-menage-suisse
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Les variables d'environnement sont déjà configurées dans `.env`:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

### 4. Initialiser la base de données

```bash
npm run seed
```

Cela créera:
- Un utilisateur avec le mot de passe: `admin123`
- 6 membres (Mirnes, Madame, Enfant 1-3, Ménage)
- 4 comptes (Banque, Carte, Cash, TWINT)
- 28 catégories (dépenses et revenus)
- Des transactions et charges fixes de démonstration

### 5. Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Déploiement avec Docker

### Build et lancement

```bash
docker-compose up -d --build
```

L'application sera accessible sur `http://localhost:3000`

### Arrêt

```bash
docker-compose down
```

### Logs

```bash
docker-compose logs -f app
```

## Scripts disponibles

```bash
# Développement
npm run dev           # Lancer le serveur de développement

# Build
npm run build         # Build de production
npm run preview       # Preview du build

# Tests
npm run test          # Tests unitaires
npm run test:ui       # Interface UI des tests
npm run test:e2e      # Tests end-to-end

# Qualité
npm run lint          # Linter ESLint
npm run typecheck     # Vérification TypeScript
npm run qa            # Lint + typecheck + tests + build

# Base de données
npm run seed          # Initialiser avec données de démo
```

## Architecture

```
src/
├── components/       # Composants réutilisables
│   ├── Login.tsx
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── BottomNav.tsx
├── pages/           # Pages de l'application
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Recurring.tsx
│   ├── Stats.tsx
│   ├── Taxes.tsx
│   └── Settings.tsx
├── lib/             # Utilitaires et configuration
│   ├── supabase.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── database.types.ts
├── store/           # État global (Zustand)
│   ├── authStore.ts
│   └── appStore.ts
├── hooks/           # Hooks personnalisés
│   └── useSupabase.ts
└── scripts/         # Scripts utilitaires
    └── seed.ts
```

## Base de données

### Tables principales

- `app_users`: Authentification locale
- `members`: Membres du ménage
- `accounts`: Comptes bancaires/moyens de paiement
- `categories`: Catégories de transactions
- `transactions`: Transactions financières
- `recurring_expenses`: Charges fixes récurrentes
- `budgets`: Budgets par catégorie
- `tax_settings`: Paramètres fiscaux
- `generated_transactions`: Tracking génération auto

Toutes les tables ont RLS (Row Level Security) activé.

## Utilisation

### Premier lancement

1. Connectez-vous avec le mot de passe par défaut: `admin123`
2. Changez le mot de passe dans Paramètres > Sécurité
3. Explorez les données de démonstration
4. Personnalisez les catégories, comptes et membres selon vos besoins

### Workflow recommandé

1. **Configuration initiale**
   - Vérifier/ajuster les catégories dans Paramètres
   - Vérifier/ajuster les comptes
   - Configurer les paramètres fiscaux dans Impôts

2. **Charges fixes**
   - Ajouter toutes vos charges récurrentes (loyer, assurances, etc.)
   - Générer les transactions du mois en cours

3. **Transactions quotidiennes**
   - Ajouter les transactions au fur et à mesure
   - Utiliser la recherche et les filtres pour retrouver rapidement

4. **Suivi mensuel**
   - Consulter le Dashboard pour un aperçu rapide
   - Analyser les Statistiques pour identifier les postes importants
   - Ajuster les budgets si nécessaire

5. **Fin d'année**
   - Consulter l'estimation des impôts
   - Exporter les données pour archivage

## Sauvegarde et restauration

### Export

Dans Paramètres > Données > Exporter les données

Génère un fichier JSON complet avec toutes les données.

### Import

Dans Paramètres > Données > Importer les données

⚠️ **Attention**: L'import remplace toutes les données existantes!

### Backup manuel

Si vous utilisez Supabase, les données sont automatiquement sauvegardées par Supabase.

Pour une sauvegarde locale supplémentaire, exportez régulièrement via l'interface.

## Format CHF

L'application utilise le format suisse standard:
- Séparateur de milliers: apostrophe (')
- Séparateur décimal: point (.)
- Exemple: 3'420.50

## Sécurité

- Mot de passe hashé avec bcrypt (10 rounds)
- RLS activé sur toutes les tables Supabase
- Pas de secrets exposés côté client
- Session persistante avec Zustand

## Tests

### Tests unitaires

```bash
npm run test
```

Tests des fonctions utilitaires (formatage CHF, parsing, calculs).

### Tests E2E

```bash
npm run test:e2e
```

Tests end-to-end avec Playwright (login, CRUD transactions, navigation).

### QA Checklist

Voir `QA_CHECKLIST.md` pour la liste complète des fonctionnalités testées.

## Limitations connues

### Estimation impôts

L'estimation des impôts est **simplifiée** et **indicative**:
- Basée sur des barèmes fédéraux de base
- Les taux cantonaux et communaux sont approximatifs
- Ne prend pas en compte toutes les déductions possibles
- **Ne remplace pas une déclaration fiscale officielle**

Consultez un expert fiscal pour une estimation précise.

### Performance

- Le bundle est volumineux (~800 KB) en raison de Recharts
- Optimisable avec code-splitting si nécessaire
- Performant pour jusqu'à ~10'000 transactions

## Support navigateurs

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Android 90+

## Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT.

## Support

Pour toute question ou problème:
1. Consultez la QA_CHECKLIST.md
2. Vérifiez les logs (console navigateur ou `docker-compose logs`)
3. Ouvrez une issue sur GitHub

## Roadmap

Fonctionnalités futures possibles:
- [ ] Export PDF des rapports
- [ ] Budgets personnalisés par membre
- [ ] Objectifs d'épargne
- [ ] Notifications de dépassement de budget
- [ ] Multi-utilisateurs avec partage
- [ ] Application mobile native
- [ ] Synchronisation bancaire automatique
- [ ] Amélioration calcul impôts (API officielle cantonale)

---

**Version**: 1.0.0
**Date**: 2026-01-04
**Auteur**: Développé pour un ménage suisse
