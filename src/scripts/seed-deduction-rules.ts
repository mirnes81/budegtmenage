import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDeductionRules() {
  console.log('🔧 Seeding deduction rules...');

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'expense');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  const rules = [
    {
      categoryName: 'LAMal',
      deductionType: 'HEALTH',
      confidence: 95,
      needsUserSplit: false,
      note: 'Primes LAMal déductibles intégralement (VD)',
    },
    {
      categoryName: 'Pharmacie',
      deductionType: 'HEALTH',
      confidence: 90,
      needsUserSplit: false,
      note: 'Frais de santé déductibles après franchise de 5% du revenu net',
    },
    {
      categoryName: 'Médecin/Dentiste',
      deductionType: 'HEALTH',
      confidence: 90,
      needsUserSplit: false,
      note: 'Frais médicaux déductibles après franchise de 5% du revenu net',
    },
    {
      categoryName: 'École/Crèche',
      deductionType: 'CHILDCARE',
      confidence: 85,
      needsUserSplit: true,
      note: 'Garde d\'enfants déductible si les deux parents travaillent (max CHF 10\'100 par enfant VD)',
    },
    {
      categoryName: 'Loyer/Hypothèque',
      deductionType: 'MORTGAGE_INTEREST',
      confidence: 80,
      needsUserSplit: true,
      note: 'Seuls les intérêts hypothécaires sont déductibles, pas le capital',
    },
    {
      categoryName: 'Entretien/Réparations',
      deductionType: 'PROPERTY_MAINTENANCE',
      confidence: 70,
      needsUserSplit: true,
      note: 'Entretien déductible (10-20% valeur locative) mais pas les améliorations',
    },
    {
      categoryName: 'Dons',
      deductionType: 'DONATION',
      confidence: 95,
      needsUserSplit: false,
      note: 'Dons déductibles de CHF 100 à 20% du revenu net imposable (VD)',
    },
  ];

  let insertedCount = 0;
  let skippedCount = 0;

  for (const rule of rules) {
    const category = categories.find((c) => c.name === rule.categoryName);

    if (!category) {
      console.log(`⚠️  Category "${rule.categoryName}" not found, skipping...`);
      skippedCount++;
      continue;
    }

    const { data: existing } = await supabase
      .from('deduction_rules')
      .select('id')
      .eq('category_id', category.id)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Rule for "${rule.categoryName}" already exists, skipping...`);
      skippedCount++;
      continue;
    }

    const { error } = await supabase.from('deduction_rules').insert([
      {
        category_id: category.id,
        deduction_type: rule.deductionType,
        confidence: rule.confidence,
        needs_user_split: rule.needsUserSplit,
        note: rule.note,
      },
    ]);

    if (error) {
      console.error(`Error inserting rule for "${rule.categoryName}":`, error);
    } else {
      console.log(`✅ Created rule: ${rule.categoryName} → ${rule.deductionType}`);
      insertedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Inserted: ${insertedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log('✨ Done!\n');
}

seedDeductionRules().catch(console.error);
