interface TransactionDefaults {
  category_id: string;
  account_id: string;
  member_id: string;
  type: 'expense' | 'income';
}

const STORAGE_KEY = 'transaction_defaults';

export function getTransactionDefaults(): Partial<TransactionDefaults> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erreur lecture defaults:', error);
  }
  return {};
}

export function saveTransactionDefaults(data: Partial<TransactionDefaults>): void {
  try {
    const current = getTransactionDefaults();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Erreur sauvegarde defaults:', error);
  }
}
