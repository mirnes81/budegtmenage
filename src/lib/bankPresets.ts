import { supabase } from './supabase';

export interface BankPreset {
  id: string;
  name: string;
  matchHeaders: string[];
  delimiterHint: string;
  dateFormatHint: string;
  decimalSeparatorHint: '.' | ',';
  mapping: Record<string, string[]>;
  isActive: boolean;
  orderIndex: number;
}

export interface ColumnMapping {
  date: string | null;
  description: string | null;
  amount: string | null;
  debit: string | null;
  credit: string | null;
  currency: string | null;
  balance: string | null;
  valueDate: string | null;
  reference: string | null;
}

export async function loadBankPresets(): Promise<BankPreset[]> {
  const { data, error } = await supabase
    .from('bank_csv_presets')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (error) {
    console.error('Error loading bank presets:', error);
    return [];
  }

  return data.map(preset => ({
    id: preset.id,
    name: preset.name,
    matchHeaders: preset.match_headers as string[],
    delimiterHint: preset.delimiter_hint,
    dateFormatHint: preset.date_format_hint,
    decimalSeparatorHint: preset.decimal_separator_hint as '.' | ',',
    mapping: preset.mapping as Record<string, string[]>,
    isActive: preset.is_active,
    orderIndex: preset.order_index
  }));
}

export function detectPreset(headers: string[], presets: BankPreset[]): BankPreset | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

  for (const preset of presets) {
    if (preset.name === 'Generic') continue;

    const matchHeaders = preset.matchHeaders.map(h => h.toLowerCase());
    if (matchHeaders.length === 0) continue;

    const matchCount = matchHeaders.filter(pattern =>
      normalizedHeaders.some(header => header.includes(pattern.toLowerCase()))
    ).length;

    const matchRatio = matchCount / matchHeaders.length;

    if (matchRatio >= 0.5) {
      return preset;
    }
  }

  return presets.find(p => p.name === 'Generic') || null;
}

export function mapColumns(
  headers: string[],
  preset: BankPreset | null
): ColumnMapping {
  const mapping: ColumnMapping = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
    currency: null,
    balance: null,
    valueDate: null,
    reference: null
  };

  if (!preset || !preset.mapping) {
    return mapping;
  }

  const normalizedHeaders = headers.map(h => h.trim());

  for (const [field, patterns] of Object.entries(preset.mapping)) {
    for (const pattern of patterns as string[]) {
      const index = normalizedHeaders.findIndex(h =>
        h.toLowerCase() === pattern.toLowerCase() ||
        h.toLowerCase().includes(pattern.toLowerCase())
      );

      if (index !== -1) {
        mapping[field as keyof ColumnMapping] = normalizedHeaders[index];
        break;
      }
    }
  }

  return mapping;
}

export function validateMapping(mapping: ColumnMapping): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mapping.date) {
    errors.push('Date column is required');
  }

  if (!mapping.description) {
    errors.push('Description column is required');
  }

  const hasAmount = mapping.amount !== null;
  const hasDebitCredit = mapping.debit !== null || mapping.credit !== null;

  if (!hasAmount && !hasDebitCredit) {
    errors.push('Amount column or Debit/Credit columns are required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
