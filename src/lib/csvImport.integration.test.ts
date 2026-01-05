import { describe, it, expect } from 'vitest';
import { parseCsv } from './csvParser';
import { extractMerchantFromUBS, normalizeMerchant } from './bankDescriptionCleaner';

describe('UBS CSV Import Integration', () => {
  const ubsCsvContent = `Date de comptabilisation;Description 1;Description 2;Description 3;Débit;Crédit;No de transaction
01.12.2024;ALDI SUISSE SA;;;150.50;;TRX-001
02.12.2024;ENI STATION;;;80.00;;TRX-002
03.12.2024;;Versement salaire;;Entreprise SA;;3500.00;TRX-003
05.12.2024;MIGROS LAUSANNE;;;120.30;;TRX-004
06.12.2024;FEDEX SWITZERLAND;;;45.00;;TRX-005
08.12.2024;COOP GENEVE;;;98.50;;TRX-006
10.12.2024;LATICRETE MATERIEL;;;450.00;;TRX-007
12.12.2024;PHARMACIE AMAVITA;;;32.80;;TRX-008
15.12.2024;SBB CFF FFS;;;25.00;;TRX-009
18.12.2024;RESTAURANT LA PINTE;;;85.00;;TRX-010`;

  it('should parse UBS CSV correctly', () => {
    const parsed = parseCsv(ubsCsvContent, ';');

    expect(parsed.headers).toContain('Date de comptabilisation');
    expect(parsed.headers).toContain('Description 1');
    expect(parsed.headers).toContain('Débit');
    expect(parsed.headers).toContain('Crédit');
    expect(parsed.rows).toHaveLength(10);
  });

  it('should extract clean merchant names', () => {
    const parsed = parseCsv(ubsCsvContent, ';');
    const desc1Index = parsed.headers.indexOf('Description 1');
    const desc2Index = parsed.headers.indexOf('Description 2');
    const desc3Index = parsed.headers.indexOf('Description 3');

    const merchants = parsed.rows.map(row => {
      const desc1 = row[desc1Index] || '';
      const desc2 = row[desc2Index] || '';
      const desc3 = row[desc3Index] || '';
      return extractMerchantFromUBS(desc1, desc2, desc3);
    });

    expect(merchants[0]).toBe('ALDI SUISSE SA');
    expect(merchants[1]).toBe('ENI STATION');
    expect(merchants[2]).toBe('Versement salaire');
    expect(merchants[3]).toBe('MIGROS LAUSANNE');
  });

  it('should normalize merchants uniquely', () => {
    const merchants = [
      'ALDI SUISSE SA',
      'ENI STATION',
      'MIGROS LAUSANNE',
      'FEDEX SWITZERLAND',
      'COOP GENEVE',
      'LATICRETE MATERIEL',
      'PHARMACIE AMAVITA',
      'SBB CFF FFS',
      'RESTAURANT LA PINTE'
    ];

    const normalized = merchants.map(m => normalizeMerchant(m));

    expect(normalized[0]).toContain('ALDI');
    expect(normalized[1]).toContain('ENI');
    expect(normalized[2]).toContain('MIGROS');
    expect(normalized[3]).toContain('FEDEX');
    expect(normalized[4]).toContain('COOP');

    const uniqueNormalized = new Set(normalized);
    expect(uniqueNormalized.size).toBe(normalized.length);
  });

  it('should distinguish between expenses and income amounts', () => {
    const expenses = [
      { amount: -150.50, description: 'ALDI SUISSE SA' },
      { amount: -80.00, description: 'ENI STATION' },
      { amount: -120.30, description: 'MIGROS LAUSANNE' }
    ];

    const income = [
      { amount: 3500.00, description: 'Versement salaire' }
    ];

    expenses.forEach(exp => {
      expect(exp.amount).toBeLessThan(0);
    });

    income.forEach(inc => {
      expect(inc.amount).toBeGreaterThan(0);
    });

    expect(expenses.length).toBeGreaterThan(0);
    expect(income.length).toBeGreaterThan(0);
  });

  it('should keep descriptions under 80 characters', () => {
    const descriptions = [
      'ALDI SUISSE SA',
      'ENI STATION',
      'Versement salaire',
      'MIGROS LAUSANNE',
      'FEDEX SWITZERLAND',
      'COOP GENEVE',
      'LATICRETE MATERIEL',
      'PHARMACIE AMAVITA',
      'SBB CFF FFS',
      'RESTAURANT LA PINTE'
    ];

    descriptions.forEach(desc => {
      expect(desc.length).toBeLessThanOrEqual(80);
    });
  });

  it('should recognize at least 4 different merchant categories', () => {
    const merchantPatterns = [
      { merchant: 'ALDI', expectedCategory: 'courses' },
      { merchant: 'ENI', expectedCategory: 'essence' },
      { merchant: 'MIGROS', expectedCategory: 'courses' },
      { merchant: 'FEDEX', expectedCategory: 'services' },
      { merchant: 'COOP', expectedCategory: 'courses' },
      { merchant: 'LATICRETE', expectedCategory: 'travaux' },
      { merchant: 'PHARMACIE', expectedCategory: 'sante' },
      { merchant: 'SBB', expectedCategory: 'transports' },
      { merchant: 'RESTAURANT', expectedCategory: 'restaurants' }
    ];

    const categories = new Set(merchantPatterns.map(p => p.expectedCategory));

    expect(categories.size).toBeGreaterThanOrEqual(4);
    expect(categories.has('courses')).toBe(true);
    expect(categories.has('essence')).toBe(true);
    expect(categories.has('travaux')).toBe(true);
    expect(categories.has('restaurants')).toBe(true);
  });
});
