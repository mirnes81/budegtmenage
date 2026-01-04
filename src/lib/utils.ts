import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCHF(amount: number): string {
  const formatted = Math.abs(amount).toFixed(2);
  const [integerPart, decimalPart] = formatted.split('.');

  const withApostrophes = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  const sign = amount < 0 ? '-' : '';
  return `${sign}${withApostrophes}.${decimalPart}`;
}

export function parseCHFInput(value: string): number {
  const cleaned = value.replace(/['\s]/g, '');
  return parseFloat(cleaned) || 0;
}

export function getMerchantInitials(merchantName: string): string {
  if (!merchantName) return '???';

  const cleaned = merchantName.trim().toUpperCase();

  if (cleaned.length <= 3) return cleaned;

  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w[0]).join('') + (words[2]?.[0] || '');
  }

  return cleaned.substring(0, 3);
}

export function getMerchantColor(merchantName: string): string {
  if (!merchantName) return '#6b7280';

  let hash = 0;
  for (let i = 0; i < merchantName.length; i++) {
    hash = merchantName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#14b8a6',
    '#6366f1',
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
