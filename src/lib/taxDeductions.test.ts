import { describe, it, expect } from 'vitest';
import {
  aggregateDeductionsByType,
  calculateHealthDeductionThreshold,
  formatDeductionsSummary,
  DEDUCTION_LABELS,
} from './taxDeductions';

describe('taxDeductions', () => {
  describe('aggregateDeductionsByType', () => {
    it('should aggregate transactions by deduction type', () => {
      const transactions = [
        { amount: -1000, deduction_type: 'HEALTH' },
        { amount: -500, deduction_type: 'HEALTH' },
        { amount: -2000, deduction_type: 'CHILDCARE' },
        { amount: -300, deduction_type: 'DONATION' },
      ];

      const result = aggregateDeductionsByType(transactions);

      expect(result.HEALTH).toBe(1500);
      expect(result.CHILDCARE).toBe(2000);
      expect(result.DONATION).toBe(300);
      expect(result.MORTGAGE_INTEREST).toBe(0);
      expect(result.PROPERTY_MAINTENANCE).toBe(0);
      expect(result.OTHER).toBe(0);
    });

    it('should handle absolute values correctly', () => {
      const transactions = [
        { amount: -1000, deduction_type: 'HEALTH' },
        { amount: 500, deduction_type: 'HEALTH' },
      ];

      const result = aggregateDeductionsByType(transactions);

      expect(result.HEALTH).toBe(1500);
    });

    it('should handle empty transactions array', () => {
      const result = aggregateDeductionsByType([]);

      expect(result.HEALTH).toBe(0);
      expect(result.CHILDCARE).toBe(0);
    });
  });

  describe('calculateHealthDeductionThreshold', () => {
    it('should calculate 5% of net income', () => {
      expect(calculateHealthDeductionThreshold(100000)).toBe(5000);
      expect(calculateHealthDeductionThreshold(80000)).toBe(4000);
      expect(calculateHealthDeductionThreshold(50000)).toBe(2500);
    });

    it('should handle zero income', () => {
      expect(calculateHealthDeductionThreshold(0)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateHealthDeductionThreshold(77777)).toBeCloseTo(3888.85, 2);
    });
  });

  describe('formatDeductionsSummary', () => {
    it('should format deductions without net income', () => {
      const totals = {
        NONE: 0,
        HEALTH: 3000,
        CHILDCARE: 5000,
        MORTGAGE_INTEREST: 0,
        PROPERTY_MAINTENANCE: 0,
        DONATION: 200,
        OTHER: 0,
      };

      const summary = formatDeductionsSummary(totals);

      expect(summary).toContain('Frais de santé: CHF 3000.00');
      expect(summary).toContain('Garde d\'enfants: CHF 5000.00');
      expect(summary).toContain('Dons: CHF 200.00');
      expect(summary).not.toContain('Aucune');
    });

    it('should include health threshold when net income provided', () => {
      const totals = {
        NONE: 0,
        HEALTH: 5000,
        CHILDCARE: 0,
        MORTGAGE_INTEREST: 0,
        PROPERTY_MAINTENANCE: 0,
        DONATION: 0,
        OTHER: 0,
      };

      const summary = formatDeductionsSummary(totals, 80000);

      expect(summary).toContain('Frais de santé: CHF 5000.00');
      expect(summary).toContain('(Franchise: CHF 4000.00)');
      expect(summary).toContain('(Déductible: CHF 1000.00)');
    });

    it('should handle health amount below threshold', () => {
      const totals = {
        NONE: 0,
        HEALTH: 2000,
        CHILDCARE: 0,
        MORTGAGE_INTEREST: 0,
        PROPERTY_MAINTENANCE: 0,
        DONATION: 0,
        OTHER: 0,
      };

      const summary = formatDeductionsSummary(totals, 80000);

      expect(summary).toContain('(Déductible: CHF 0.00)');
    });

    it('should skip zero amounts', () => {
      const totals = {
        NONE: 0,
        HEALTH: 0,
        CHILDCARE: 1000,
        MORTGAGE_INTEREST: 0,
        PROPERTY_MAINTENANCE: 0,
        DONATION: 0,
        OTHER: 0,
      };

      const summary = formatDeductionsSummary(totals);

      expect(summary).not.toContain('Frais de santé');
      expect(summary).toContain('Garde d\'enfants');
    });
  });

  describe('DEDUCTION_LABELS', () => {
    it('should have labels for all deduction types', () => {
      expect(DEDUCTION_LABELS.NONE).toBe('Aucune');
      expect(DEDUCTION_LABELS.HEALTH).toBe('Frais de santé');
      expect(DEDUCTION_LABELS.CHILDCARE).toBe('Garde d\'enfants');
      expect(DEDUCTION_LABELS.MORTGAGE_INTEREST).toBe('Intérêts hypothécaires');
      expect(DEDUCTION_LABELS.PROPERTY_MAINTENANCE).toBe('Entretien propriété');
      expect(DEDUCTION_LABELS.DONATION).toBe('Dons');
      expect(DEDUCTION_LABELS.OTHER).toBe('Autre déduction');
    });
  });
});
