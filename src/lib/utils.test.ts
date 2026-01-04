import { describe, it, expect } from 'vitest';
import { formatCHF, parseCHFInput } from './utils';

describe('formatCHF', () => {
  it('formate correctement les nombres avec apostrophe milliers', () => {
    expect(formatCHF(1000)).toBe("1'000.00");
    expect(formatCHF(10000)).toBe("10'000.00");
    expect(formatCHF(100000)).toBe("100'000.00");
    expect(formatCHF(1000000)).toBe("1'000'000.00");
  });

  it('gère les décimales', () => {
    expect(formatCHF(1234.56)).toBe("1'234.56");
    expect(formatCHF(9999.99)).toBe("9'999.99");
  });

  it('gère les nombres négatifs', () => {
    expect(formatCHF(-1234.56)).toBe("-1'234.56");
  });

  it('gère zéro', () => {
    expect(formatCHF(0)).toBe("0.00");
  });

  it('arrondit correctement', () => {
    expect(formatCHF(1234.567)).toBe("1'234.57");
    expect(formatCHF(1234.564)).toBe("1'234.56");
  });
});

describe('parseCHFInput', () => {
  it('parse correctement les valeurs avec apostrophes', () => {
    expect(parseCHFInput("1'000")).toBe(1000);
    expect(parseCHFInput("10'000.50")).toBe(10000.50);
  });

  it('parse correctement les valeurs sans apostrophes', () => {
    expect(parseCHFInput("1000")).toBe(1000);
    expect(parseCHFInput("1234.56")).toBe(1234.56);
  });

  it('gère les valeurs invalides', () => {
    expect(parseCHFInput("")).toBe(0);
    expect(parseCHFInput("abc")).toBe(0);
  });
});
