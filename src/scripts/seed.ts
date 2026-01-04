import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_PASSWORD = 'admin123';

async function seed() {
  console.log('🌱 Début du seeding...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const { data: existingUser } = await supabase.from('app_users').select('id').maybeSingle();

  if (!existingUser) {
    const { error: userError } = await supabase.from('app_users').insert({
      password_hash: passwordHash,
    });
    if (userError) {
      console.error('Erreur création utilisateur:', userError);
      return;
    }
    console.log('✅ Utilisateur créé (mot de passe: admin123)');
  } else {
    console.log('ℹ️ Utilisateur existe déjà');
  }

  const members = [
    { name: 'Mirnes', type: 'adult', order_index: 0 },
    { name: 'Madame', type: 'adult', order_index: 1 },
    { name: 'Enfant 1', type: 'child', order_index: 2 },
    { name: 'Enfant 2', type: 'child', order_index: 3 },
    { name: 'Enfant 3', type: 'child', order_index: 4 },
    { name: 'Ménage', type: 'household', order_index: 5 },
  ] as const;

  const { data: existingMembers } = await supabase.from('members').select('name');
  const existingMemberNames = new Set(existingMembers?.map(m => m.name) || []);

  const newMembers = members.filter(m => !existingMemberNames.has(m.name));

  if (newMembers.length > 0) {
    const { error: membersError } = await supabase.from('members').insert(newMembers);
    if (membersError) {
      console.error('Erreur création membres:', membersError);
      return;
    }
    console.log(`✅ ${newMembers.length} membres créés`);
  } else {
    console.log('ℹ️ Tous les membres existent déjà');
  }

  const accounts = [
    { name: 'Banque', type: 'bank', icon: 'building-2', color: '#3b82f6', order_index: 0 },
    { name: 'Carte de crédit', type: 'card', icon: 'credit-card', color: '#8b5cf6', order_index: 1 },
    { name: 'Cash', type: 'cash', icon: 'wallet', color: '#10b981', order_index: 2 },
    { name: 'TWINT', type: 'digital', icon: 'smartphone', color: '#f59e0b', order_index: 3 },
  ] as const;

  const { data: existingAccounts } = await supabase.from('accounts').select('name');
  const existingAccountNames = new Set(existingAccounts?.map(a => a.name) || []);

  const newAccounts = accounts.filter(a => !existingAccountNames.has(a.name));

  if (newAccounts.length > 0) {
    const { error: accountsError } = await supabase.from('accounts').insert(newAccounts);
    if (accountsError) {
      console.error('Erreur création comptes:', accountsError);
      return;
    }
    console.log(`✅ ${newAccounts.length} comptes créés`);
  } else {
    console.log('ℹ️ Tous les comptes existent déjà');
  }

  const expenseCategories = [
    { name: 'Loyer/Hypothèque', icon: 'home', color: '#ef4444', type: 'expense', order_index: 0 },
    { name: 'Charges PPE', icon: 'building', color: '#f97316', type: 'expense', order_index: 1 },
    { name: 'Électricité', icon: 'zap', color: '#eab308', type: 'expense', order_index: 2 },
    { name: 'Eau/Déchets', icon: 'droplet', color: '#06b6d4', type: 'expense', order_index: 3 },
    { name: 'Internet/Mobile', icon: 'wifi', color: '#8b5cf6', type: 'expense', order_index: 4 },
    { name: 'Assurances ménage/RC', icon: 'shield', color: '#ec4899', type: 'expense', order_index: 5 },
    { name: 'Entretien/Réparations', icon: 'wrench', color: '#6b7280', type: 'expense', order_index: 6 },
    { name: 'Essence', icon: 'fuel', color: '#dc2626', type: 'expense', order_index: 7 },
    { name: 'Assurance auto', icon: 'car', color: '#ea580c', type: 'expense', order_index: 8 },
    { name: 'Entretien auto', icon: 'car', color: '#ca8a04', type: 'expense', order_index: 9 },
    { name: 'Parking', icon: 'square-parking', color: '#65a30d', type: 'expense', order_index: 10 },
    { name: 'Transports publics', icon: 'train', color: '#0891b2', type: 'expense', order_index: 11 },
    { name: 'LAMal', icon: 'heart', color: '#e11d48', type: 'expense', order_index: 12 },
    { name: 'Complémentaire', icon: 'heart-pulse', color: '#be123c', type: 'expense', order_index: 13 },
    { name: 'Médecin/Pharmacie', icon: 'pill', color: '#f43f5e', type: 'expense', order_index: 14 },
    { name: 'École/Crèche', icon: 'school', color: '#7c3aed', type: 'expense', order_index: 15 },
    { name: 'Activités enfants', icon: 'party-popper', color: '#a855f7', type: 'expense', order_index: 16 },
    { name: 'Vêtements enfants', icon: 'shirt', color: '#c084fc', type: 'expense', order_index: 17 },
    { name: 'Courses', icon: 'shopping-cart', color: '#10b981', type: 'expense', order_index: 18 },
    { name: 'Restaurants', icon: 'utensils', color: '#f59e0b', type: 'expense', order_index: 19 },
    { name: 'Loisirs', icon: 'gamepad-2', color: '#06b6d4', type: 'expense', order_index: 20 },
    { name: 'Abonnements', icon: 'repeat', color: '#8b5cf6', type: 'expense', order_index: 21 },
    { name: 'Impôts (acomptes)', icon: 'landmark', color: '#991b1b', type: 'expense', order_index: 22 },
    { name: 'Frais bancaires', icon: 'circle-dollar-sign', color: '#92400e', type: 'expense', order_index: 23 },
  ];

  const incomeCategories = [
    { name: 'Salaire', icon: 'banknote', color: '#10b981', type: 'income', order_index: 0 },
    { name: 'Allocations', icon: 'gift', color: '#14b8a6', type: 'income', order_index: 1 },
    { name: 'Loyer encaissé', icon: 'key', color: '#06b6d4', type: 'income', order_index: 2 },
    { name: 'Autres revenus', icon: 'plus-circle', color: '#0ea5e9', type: 'income', order_index: 3 },
  ];

  const allCategories = [...expenseCategories, ...incomeCategories];

  const { data: existingCategories } = await supabase.from('categories').select('name');
  const existingCategoryNames = new Set(existingCategories?.map(c => c.name) || []);

  const newCategories = allCategories.filter(c => !existingCategoryNames.has(c.name));

  if (newCategories.length > 0) {
    const { error: categoriesError } = await supabase.from('categories').insert(newCategories);
    if (categoriesError) {
      console.error('Erreur création catégories:', categoriesError);
      return;
    }
    console.log(`✅ ${newCategories.length} catégories créées`);
  } else {
    console.log('ℹ️ Toutes les catégories existent déjà');
  }

  const { data: dbMembers } = await supabase.from('members').select('id, name');
  const { data: dbAccounts } = await supabase.from('accounts').select('id, name');
  const { data: dbCategories } = await supabase.from('categories').select('id, name, type');

  if (!dbMembers || !dbAccounts || !dbCategories) {
    console.error('Erreur récupération des données de base');
    return;
  }

  const menageId = dbMembers.find(m => m.name === 'Ménage')?.id;
  const mirnesId = dbMembers.find(m => m.name === 'Mirnes')?.id;
  const banqueId = dbAccounts.find(a => a.name === 'Banque')?.id;
  const salaireId = dbCategories.find(c => c.name === 'Salaire')?.id;
  const loyerId = dbCategories.find(c => c.name === 'Loyer/Hypothèque')?.id;
  const coursesId = dbCategories.find(c => c.name === 'Courses')?.id;

  if (!menageId || !mirnesId || !banqueId || !salaireId || !loyerId || !coursesId) {
    console.error('Données de base manquantes');
    return;
  }

  const { data: existingTransactions } = await supabase.from('transactions').select('id');

  if (!existingTransactions || existingTransactions.length === 0) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const sampleTransactions = [];

    for (let i = 0; i < 3; i++) {
      const month = currentMonth - i;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month < 0 ? 12 + month : month;

      sampleTransactions.push(
        {
          date: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-05`,
          amount: 8500,
          type: 'income',
          category_id: salaireId,
          account_id: banqueId,
          member_id: mirnesId,
          description: 'Salaire Mirnes',
          is_fixed: false,
        },
        {
          date: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-01`,
          amount: -2200,
          type: 'expense',
          category_id: loyerId,
          account_id: banqueId,
          member_id: menageId,
          description: 'Loyer mensuel',
          is_fixed: true,
        },
        {
          date: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-15`,
          amount: -450,
          type: 'expense',
          category_id: coursesId,
          account_id: banqueId,
          member_id: menageId,
          description: 'Courses Migros',
          is_fixed: false,
        }
      );
    }

    const { error: transactionsError } = await supabase.from('transactions').insert(sampleTransactions);
    if (transactionsError) {
      console.error('Erreur création transactions:', transactionsError);
      return;
    }
    console.log(`✅ ${sampleTransactions.length} transactions créées`);
  } else {
    console.log('ℹ️ Des transactions existent déjà');
  }

  const { data: existingRecurring } = await supabase.from('recurring_expenses').select('id');

  if (!existingRecurring || existingRecurring.length === 0) {
    const recurringExpenses = [
      {
        name: 'Loyer mensuel',
        amount: 2200,
        frequency: 'monthly',
        category_id: loyerId,
        account_id: banqueId,
        member_id: menageId,
        day_of_month: 1,
        is_active: true,
      }
    ] as const;

    const { error: recurringError } = await supabase.from('recurring_expenses').insert(recurringExpenses);
    if (recurringError) {
      console.error('Erreur création charges fixes:', recurringError);
      return;
    }
    console.log(`✅ ${recurringExpenses.length} charges fixes créées`);
  } else {
    console.log('ℹ️ Des charges fixes existent déjà');
  }

  const { data: existingTaxSettings } = await supabase.from('tax_settings').select('id');

  if (!existingTaxSettings || existingTaxSettings.length === 0) {
    const { error: taxError } = await supabase.from('tax_settings').insert({
      marital_status: 'married',
      num_children: 3,
      church_tax: false,
    });
    if (taxError) {
      console.error('Erreur création paramètres fiscaux:', taxError);
      return;
    }
    console.log('✅ Paramètres fiscaux créés');
  } else {
    console.log('ℹ️ Paramètres fiscaux existent déjà');
  }

  console.log('🎉 Seeding terminé avec succès!');
  console.log('📝 Mot de passe par défaut: admin123');
}

seed().catch(console.error);
