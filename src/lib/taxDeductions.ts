import { supabase } from './supabase';

export type DeductionType =
  | 'NONE'
  | 'HEALTH'
  | 'CHILDCARE'
  | 'MORTGAGE_INTEREST'
  | 'PROPERTY_MAINTENANCE'
  | 'DONATION'
  | 'OTHER';

export type DeductionStatus = 'NONE' | 'SUGGESTED' | 'CONFIRMED' | 'REJECTED';

export interface DeductionRule {
  id: string;
  category_id: string;
  deduction_type: DeductionType;
  confidence: number;
  needs_user_split: boolean;
  note: string;
}

export interface DeductionSuggestion {
  deductionType: DeductionType;
  confidence: number;
  needsUserSplit: boolean;
  note: string;
}

export const DEDUCTION_LABELS: Record<DeductionType, string> = {
  NONE: 'Aucune',
  HEALTH: 'Frais de santé',
  CHILDCARE: 'Garde d\'enfants',
  MORTGAGE_INTEREST: 'Intérêts hypothécaires',
  PROPERTY_MAINTENANCE: 'Entretien propriété',
  DONATION: 'Dons',
  OTHER: 'Autre déduction',
};

export async function getDeductionRuleForCategory(
  categoryId: string
): Promise<DeductionSuggestion | null> {
  try {
    const { data, error } = await supabase
      .from('deduction_rules')
      .select('deduction_type, confidence, needs_user_split, note')
      .eq('category_id', categoryId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      deductionType: data.deduction_type as DeductionType,
      confidence: data.confidence,
      needsUserSplit: data.needs_user_split,
      note: data.note,
    };
  } catch (error) {
    console.error('Error fetching deduction rule:', error);
    return null;
  }
}

export async function getDeductionsByYear(year: number, userId?: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, deduction_type, deduction_status, categories(name), date')
      .eq('tax_year', year)
      .eq('deduction_status', 'CONFIRMED')
      .neq('deduction_type', 'NONE')
      .order('date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return [];
  }
}

export function aggregateDeductionsByType(
  transactions: Array<{
    amount: number;
    deduction_type: string;
  }>
): Record<DeductionType, number> {
  const totals: Record<DeductionType, number> = {
    NONE: 0,
    HEALTH: 0,
    CHILDCARE: 0,
    MORTGAGE_INTEREST: 0,
    PROPERTY_MAINTENANCE: 0,
    DONATION: 0,
    OTHER: 0,
  };

  transactions.forEach((t) => {
    const type = t.deduction_type as DeductionType;
    if (type in totals) {
      totals[type] += Math.abs(t.amount);
    }
  });

  return totals;
}

export function calculateHealthDeductionThreshold(netIncome: number): number {
  return netIncome * 0.05;
}

export function formatDeductionsSummary(
  totals: Record<DeductionType, number>,
  netIncome?: number
): string {
  const lines: string[] = [];

  Object.entries(totals).forEach(([type, amount]) => {
    if (type === 'NONE' || amount === 0) return;

    const label = DEDUCTION_LABELS[type as DeductionType];
    lines.push(`${label}: CHF ${amount.toFixed(2)}`);

    if (type === 'HEALTH' && netIncome) {
      const threshold = calculateHealthDeductionThreshold(netIncome);
      const deductible = Math.max(0, amount - threshold);
      lines.push(`  (Franchise: CHF ${threshold.toFixed(2)})`);
      lines.push(`  (Déductible: CHF ${deductible.toFixed(2)})`);
    }
  });

  return lines.join('\n');
}
