import { supabase } from './supabase';
import { Database } from './database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export async function getFavoriteCategories(
  type: 'expense' | 'income',
  limit = 6
): Promise<Category[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateThreshold = ninetyDaysAgo.toISOString().split('T')[0];

  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('category_id')
    .eq('type', type)
    .gte('date', dateThreshold);

  if (transError || !transactions) {
    console.error('Erreur chargement transactions pour favoris:', transError);
    return [];
  }

  const categoryUsageMap = new Map<string, number>();
  transactions.forEach((transaction) => {
    const count = categoryUsageMap.get(transaction.category_id) || 0;
    categoryUsageMap.set(transaction.category_id, count + 1);
  });

  const sortedCategoryIds = Array.from(categoryUsageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0]);

  if (sortedCategoryIds.length === 0) {
    return [];
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .in('id', sortedCategoryIds)
    .eq('type', type)
    .eq('is_active', true)
    .eq('is_hidden', false);

  if (catError || !categories) {
    console.error('Erreur chargement catégories favorites:', catError);
    return [];
  }

  const orderedCategories = sortedCategoryIds
    .map((id) => categories.find((cat) => cat.id === id))
    .filter((cat): cat is Category => cat !== undefined);

  return orderedCategories;
}

export async function getGroupedCategories(
  type: 'expense' | 'income',
  excludeIds: string[] = []
): Promise<Record<string, Category[]>> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .eq('is_hidden', false)
    .order('group_name', { ascending: true })
    .order('order_index', { ascending: true });

  if (error || !categories) {
    console.error('Erreur chargement catégories groupées:', error);
    return {};
  }

  const filteredCategories = categories.filter(
    (cat) => !excludeIds.includes(cat.id)
  );

  const grouped: Record<string, Category[]> = {};

  filteredCategories.forEach((category) => {
    const groupName = category.group_name || 'Autres';
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(category);
  });

  return grouped;
}
