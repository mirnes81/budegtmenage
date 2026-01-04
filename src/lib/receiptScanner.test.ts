import { describe, it, expect } from 'vitest';
import {
  normalizeMerchant,
  extractAmountFromText,
  extractDateFromText,
  extractMerchantFromText,
  extractReceiptInfo,
  suggestDeductionType,
} from './receiptScanner';

describe('receiptScanner', () => {
  describe('normalizeMerchant', () => {
    it('should recognize Coop', () => {
      const result = normalizeMerchant('COOP-1234 LAUSANNE');
      expect(result.merchantKey).toBe('COOP');
      expect(result.merchantDisplay).toBe('Coop');
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should recognize Migros', () => {
      const result = normalizeMerchant('Migros Genève');
      expect(result.merchantKey).toBe('MIGROS');
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should recognize pharmacies', () => {
      const result = normalizeMerchant('AMAVITA SA');
      expect(result.merchantKey).toBe('AMAVITA');
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should handle unknown merchants', () => {
      const result = normalizeMerchant('PETIT COMMERCE LOCAL');
      expect(result.merchantKey).toBeTruthy();
      expect(result.confidence).toBeLessThan(60);
    });

    it('should handle null input', () => {
      const result = normalizeMerchant(null);
      expect(result.merchantKey).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle empty string', () => {
      const result = normalizeMerchant('   ');
      expect(result.merchantKey).toBeNull();
    });
  });

  describe('extractAmountFromText', () => {
    it('should extract TOTAL amount', () => {
      const text = 'Article 1: 10.50\nArticle 2: 5.00\nTOTAL: CHF 15.50';
      const amount = extractAmountFromText(text);
      expect(amount).toBe(15.5);
    });

    it('should extract CHF amount', () => {
      const text = 'CHF 42.90';
      const amount = extractAmountFromText(text);
      expect(amount).toBe(42.9);
    });

    it('should handle Swiss apostrophe format', () => {
      const text = "CHF 1'234.50";
      const amount = extractAmountFromText(text);
      expect(amount).toBe(1234.5);
    });

    it('should pick largest amount if no TOTAL', () => {
      const text = 'CHF 10.00\nCHF 25.50\nCHF 5.00';
      const amount = extractAmountFromText(text);
      expect(amount).toBe(25.5);
    });

    it('should return null for no amount', () => {
      const text = 'No amount here';
      const amount = extractAmountFromText(text);
      expect(amount).toBeNull();
    });

    it('should handle different TOTAL keywords', () => {
      const text = 'MONTANT: 99.99';
      const amount = extractAmountFromText(text);
      expect(amount).toBe(99.99);
    });
  });

  describe('extractDateFromText', () => {
    it('should extract date in dd.mm.yyyy format', () => {
      const text = 'Date: 15.03.2024';
      const date = extractDateFromText(text);
      expect(date).toBe('2024-03-15');
    });

    it('should extract date in dd/mm/yyyy format', () => {
      const text = '01/12/2023';
      const date = extractDateFromText(text);
      expect(date).toBe('2023-12-01');
    });

    it('should handle 2-digit year', () => {
      const text = '25.06.24';
      const date = extractDateFromText(text);
      expect(date).toBe('2024-06-25');
    });

    it('should swap day/month if needed', () => {
      const text = '31.02.2024';
      const date = extractDateFromText(text);
      expect(date).toBeTruthy();
    });

    it('should return today if no date found', () => {
      const text = 'No date here';
      const date = extractDateFromText(text);
      const today = new Date().toISOString().split('T')[0];
      expect(date).toBe(today);
    });
  });

  describe('extractMerchantFromText', () => {
    it('should extract merchant from first lines', () => {
      const text = 'COOP LAUSANNE\n01.01.2024\nTotal: CHF 50.00';
      const merchant = extractMerchantFromText(text);
      expect(merchant).toBe('COOP LAUSANNE');
    });

    it('should skip lines with only numbers', () => {
      const text = '1234567\nMigros Genève\n01.01.2024';
      const merchant = extractMerchantFromText(text);
      expect(merchant).toBe('Migros Genève');
    });

    it('should return null for empty text', () => {
      const merchant = extractMerchantFromText('');
      expect(merchant).toBeNull();
    });
  });

  describe('extractReceiptInfo', () => {
    it('should extract all info from complete receipt', () => {
      const text = `COOP LAUSANNE
Rue du Commerce 5
1003 Lausanne

Date: 15.03.2024

Pain: CHF 3.50
Lait: CHF 2.20
TOTAL: CHF 5.70

Merci de votre visite`;

      const result = extractReceiptInfo(text);

      expect(result.amount).toBe(5.7);
      expect(result.date).toBe('2024-03-15');
      expect(result.merchantRaw).toBe('Coop');
      expect(result.merchantKey).toBe('COOP');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.rawTextSnippet).toBeTruthy();
    });

    it('should handle partial info', () => {
      const text = 'Some shop\nCHF 10.00';
      const result = extractReceiptInfo(text);

      expect(result.amount).toBe(10);
      expect(result.date).toBeTruthy();
      expect(result.merchantRaw).toBeTruthy();
    });
  });

  describe('suggestDeductionType', () => {
    it('should suggest HEALTH for pharmacies', () => {
      expect(suggestDeductionType('AMAVITA')).toBe('HEALTH');
      expect(suggestDeductionType('TOPPHARM')).toBe('HEALTH');
      expect(suggestDeductionType('APOTHEKE')).toBe('HEALTH');
    });

    it('should suggest TRANSPORT for fuel/train', () => {
      expect(suggestDeductionType('SBB')).toBe('TRANSPORT');
      expect(suggestDeductionType('SHELL')).toBe('TRANSPORT');
      expect(suggestDeductionType('ESSO')).toBe('TRANSPORT');
    });

    it('should return null for unknown merchants', () => {
      expect(suggestDeductionType('COOP')).toBeNull();
      expect(suggestDeductionType('RESTAURANT')).toBeNull();
    });

    it('should handle null input', () => {
      expect(suggestDeductionType(null)).toBeNull();
    });
  });
});
