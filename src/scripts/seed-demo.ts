import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDemo() {
  console.log('🎨 Ajout de données de démonstration...');

  const { data: dbMembers } = await supabase.from('members').select('id, name');
  const { data: dbAccounts } = await supabase.from('accounts').select('id, name');
  const { data: dbCategories } = await supabase.from('categories').select('id, name, type');

  if (!dbMembers || !dbAccounts || !dbCategories) {
    console.error('Erreur: Exécutez d\'abord npm run seed');
    return;
  }

  const menageId = dbMembers.find(m => m.name === 'Ménage')?.id;
  const mirnesId = dbMembers.find(m => m.name === 'Mirnes')?.id;
  const madameId = dbMembers.find(m => m.name === 'Madame')?.id;
  const enfant1Id = dbMembers.find(m => m.name === 'Enfant 1')?.id;

  const banqueId = dbAccounts.find(a => a.name === 'Banque')?.id;
  const carteId = dbAccounts.find(a => a.name === 'Carte de crédit')?.id;
  const cashId = dbAccounts.find(a => a.name === 'Cash')?.id;
  const twintId = dbAccounts.find(a => a.name === 'TWINT')?.id;

  if (!menageId || !mirnesId || !madameId || !banqueId || !carteId || !cashId || !twintId) {
    console.error('Données de base manquantes');
    return;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const demoTransactions = [];

  const coursesId = dbCategories.find(c => c.name === 'Courses')?.id;
  const restaurantsId = dbCategories.find(c => c.name === 'Restaurants')?.id;
  const essenceId = dbCategories.find(c => c.name === 'Essence/Recharge' || c.name === 'Essence')?.id;
  const loisirsId = dbCategories.find(c => c.name === 'Loisirs')?.id;
  const salaireId = dbCategories.find(c => c.name === 'Salaire')?.id;
  const electriciteId = dbCategories.find(c => c.name === 'Électricité')?.id;
  const internetId = dbCategories.find(c => c.name === 'Internet/Mobile')?.id;

  demoTransactions.push(
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      amount: 8500,
      type: 'income',
      category_id: salaireId,
      account_id: banqueId,
      member_id: mirnesId,
      description: 'Salaire Mirnes - Janvier',
      notes: 'Salaire mensuel',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      amount: 6800,
      type: 'income',
      category_id: salaireId,
      account_id: banqueId,
      member_id: madameId,
      description: 'Salaire Madame - Janvier',
      notes: 'Salaire mensuel',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-02`,
      amount: -250.50,
      type: 'expense',
      category_id: coursesId,
      account_id: banqueId,
      member_id: menageId,
      description: 'Courses Migros',
      notes: 'Courses hebdomadaires',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-03`,
      amount: -45.80,
      type: 'expense',
      category_id: restaurantsId,
      account_id: carteId,
      member_id: mirnesId,
      description: 'Déjeuner au restaurant',
      notes: 'Lunch avec collègues',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-04`,
      amount: -95.00,
      type: 'expense',
      category_id: essenceId,
      account_id: carteId,
      member_id: menageId,
      description: 'Essence Shell',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05`,
      amount: -180.40,
      type: 'expense',
      category_id: coursesId,
      account_id: banqueId,
      member_id: menageId,
      description: 'Courses Coop',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-06`,
      amount: -25.00,
      type: 'expense',
      category_id: loisirsId,
      account_id: twintId,
      member_id: enfant1Id,
      description: 'Cinéma',
      notes: 'Sortie cinéma',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-07`,
      amount: -320.00,
      type: 'expense',
      category_id: coursesId,
      account_id: banqueId,
      member_id: menageId,
      description: 'Courses Lidl - Grande courses',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-08`,
      amount: -85.50,
      type: 'expense',
      category_id: restaurantsId,
      account_id: carteId,
      member_id: menageId,
      description: 'Restaurant italien',
      notes: 'Dîner famille',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-09`,
      amount: -150.00,
      type: 'expense',
      category_id: electriciteId,
      account_id: banqueId,
      member_id: menageId,
      description: 'Facture électricité',
    },
    {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-09`,
      amount: -89.90,
      type: 'expense',
      category_id: internetId,
      account_id: banqueId,
      member_id: menageId,
      description: 'Abonnement Swisscom',
    }
  );

  const { data: existingDemo } = await supabase
    .from('transactions')
    .select('id')
    .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
    .lte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`);

  if (existingDemo && existingDemo.length > 5) {
    console.log('ℹ️ Des données de démo existent déjà pour ce mois');
    return;
  }

  const { error: transError } = await supabase.from('transactions').insert(demoTransactions);

  if (transError) {
    console.error('Erreur ajout transactions démo:', transError);
    return;
  }

  console.log(`✅ ${demoTransactions.length} transactions de démo ajoutées`);
  console.log('🎉 Données de démonstration ajoutées avec succès!');
}

seedDemo().catch(console.error);
