# 🚀 Démarrage Rapide - Budget Ménage Suisse

## Installation et Premier Lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Créer la base de données et les données initiales
npm run seed

# 3. Ajouter des transactions de démonstration
npm run demo

# 4. Lancer l'application
npm run dev
```

**App disponible sur:** http://localhost:5173

**Connexion:**
- Mot de passe: `admin123`

---

## 🎨 Nouvelle UX Premium FocusDaily

### Ajouter une Transaction

1. **Cliquer sur le bouton bleu `+`** (en bas à droite)
2. **Entrer le montant** (ex: 50.00)
3. **Choisir Dépense ou Revenu**
4. **Écrire la description** (ex: "Courses Migros")
5. **Sélectionner la catégorie** (tap → liste → choix)
6. **Tap "Ajouter"** → C'est fait! 🎉

> Les derniers choix (catégorie, compte, membre) sont **automatiquement mémorisés** pour aller encore plus vite!

### Voir les Transactions

- **Liste groupée par jour:** Aujourd'hui, Hier, dates...
- **Recherche:** Barre en haut
- **Filtres:** Tout / Revenus / Dépenses

### Modifier/Supprimer

- **Tap sur les 3 points** (⋮) à droite de chaque transaction
- **Choisir:** Modifier ou Supprimer

---

## 📱 Fonctionnalités Disponibles

### Pages Principales

- **📊 Tableau de bord** - Vue d'ensemble du mois
- **💳 Transactions** - Nouvelle UI premium
- **🔄 Charges fixes** - Dépenses récurrentes + génération auto
- **📈 Statistiques** - Graphiques et rapports
- **🏛️ Impôts** - Estimation fiscale Suisse
- **⚙️ Paramètres** - Configuration, export/import

### Navigation

- **Mobile:** Bottom navigation (5 icônes en bas)
- **Desktop:** Sidebar à gauche

---

## 🧪 Tests et Qualité

```bash
# Tests unitaires
npm run test

# Tests E2E (Playwright)
npm run test:e2e

# QA complet (lint + tests + build)
npm run qa
```

**Résultats attendus:** ✅ Tout passe

---

## 🐳 Docker (Production)

```bash
# Build et démarrage
docker-compose up -d --build

# App accessible sur http://localhost:3000

# Arrêt
docker-compose down

# Logs
docker-compose logs -f app
```

---

## 📚 Documentation Complète

- **README.md** - Documentation générale
- **IMPLEMENTATION.md** - Détails UX/UI Premium
- **QA_CHECKLIST.md** - Checklist complète des fonctionnalités

---

## 💡 Astuces

### Smart Defaults
L'app mémorise vos derniers choix:
- Dernière catégorie utilisée
- Dernier compte utilisé
- Dernier membre utilisé

**Pour réinitialiser:** Changez simplement vos choix, ils seront mémorisés automatiquement.

### Données de Démo
Pour ajouter plus de données de test:
```bash
npm run demo
```

### Format CHF
Tous les montants utilisent le format suisse:
- Apostrophe pour les milliers: `3'420.50`
- Point pour les décimales

### Mot de Passe
Pour changer le mot de passe:
1. Aller dans **Paramètres**
2. Section **Sécurité**
3. Cliquer **Changer**

---

## 🎯 Prochaines Étapes

1. ✅ Connectez-vous avec `admin123`
2. ✅ Explorez les données de démo
3. ✅ Ajoutez vos propres transactions
4. ✅ Configurez vos catégories
5. ✅ Personnalisez vos paramètres
6. ✅ Changez votre mot de passe

---

## ⚡ Raccourcis

```bash
npm run dev     # Lancer l'app
npm run seed    # Réinitialiser la DB
npm run demo    # Ajouter données démo
npm run qa      # Tests complets
npm run build   # Build production
```

---

**Besoin d'aide?** Consultez README.md ou IMPLEMENTATION.md

**Version:** 2.0.0 Premium
**Enjoy!** 🎉
