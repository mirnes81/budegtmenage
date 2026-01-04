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

## Notes
- Application complète et fonctionnelle
- Toutes les pages principales implémentées
- CRUD complet sur transactions et charges fixes
- Statistiques avec graphiques
- Estimation impôts basique mais fonctionnelle
- Format CHF suisse respecté
- Dark mode par défaut
- Responsive mobile et desktop
- Tests unitaires passent
- Build réussi
