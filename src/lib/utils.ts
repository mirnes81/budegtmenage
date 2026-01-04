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
