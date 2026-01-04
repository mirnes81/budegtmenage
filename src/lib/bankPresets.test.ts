import { describe, it, expect } from 'vitest';
import { detectPreset, mapColumns, validateMapping, type BankPreset } from './bankPresets';

describe('Bank Presets', () => {
  const mockPresets: BankPreset[] = [
    {
      id: 'ubs',
      name: 'UBS',
      matchHeaders: ['Booking date', 'Text', 'Debit', 'Credit', 'Currency'],
      delimiterHint: ';',
      dateFormatHint: 'dd.MM.yyyy',
      decimalSeparatorHint: '.',
      mapping: {
        date: ['Booking date', 'Date'],
        description: ['Text', 'Description'],
        debit: ['Debit'],
        credit: ['Credit'],
        currency: ['Currency'],
        balance: ['Balance']
      },
      isActive: true,
      orderIndex: 0
    },
    {
      id: 'postfinance',
      name: 'PostFinance',
      matchHeaders: ['Date de comptabilisation', 'Libellé', 'Crédit', 'Débit'],
      delimiterHint: ';',
      dateFormatHint: 'dd.MM.yyyy',
      decimalSeparatorHint: '.',
      mapping: {
        date: ['Date de comptabilisation'],
        description: ['Libellé'],
        debit: ['Débit'],
        credit: ['Crédit']
      },
      isActive: true,
      orderIndex: 1
    },
    {
      id: 'generic',
      name: 'Generic',
      matchHeaders: [],
      delimiterHint: ',',
      dateFormatHint: 'yyyy-MM-dd',
      decimalSeparatorHint: '.',
      mapping: {},
      isActive: true,
      orderIndex: 99
    }
  ];

  describe('detectPreset', () => {
    it('should detect UBS preset from headers', () => {
      const headers = ['Booking date', 'Text', 'Debit', 'Credit', 'Currency', 'Balance'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset).not.toBeNull();
      expect(preset?.name).toBe('UBS');
    });

    it('should detect PostFinance preset from headers', () => {
      const headers = ['Date de comptabilisation', 'Libellé', 'Crédit', 'Débit', 'Valeur'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset).not.toBeNull();
      expect(preset?.name).toBe('PostFinance');
    });

    it('should be case insensitive', () => {
      const headers = ['booking date', 'text', 'debit', 'credit'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset).not.toBeNull();
      expect(preset?.name).toBe('UBS');
    });

    it('should match partial headers (50% threshold)', () => {
      const headers = ['Booking date', 'Text', 'Debit'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset).not.toBeNull();
      expect(preset?.name).toBe('UBS');
    });

    it('should return Generic preset for unknown headers', () => {
      const headers = ['Unknown1', 'Unknown2', 'Unknown3'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset).not.toBeNull();
      expect(preset?.name).toBe('Generic');
    });

    it('should skip Generic preset in matching', () => {
      const headers = ['Date', 'Description', 'Amount'];
      const preset = detectPreset(headers, mockPresets);

      expect(preset?.name).toBe('Generic');
    });
  });

  describe('mapColumns', () => {
    it('should map UBS columns correctly', () => {
      const headers = ['Booking date', 'Text', 'Debit', 'Credit', 'Currency', 'Balance'];
      const preset = mockPresets[0];
      const mapping = mapColumns(headers, preset);

      expect(mapping.date).toBe('Booking date');
      expect(mapping.description).toBe('Text');
      expect(mapping.debit).toBe('Debit');
      expect(mapping.credit).toBe('Credit');
      expect(mapping.currency).toBe('Currency');
      expect(mapping.balance).toBe('Balance');
    });

    it('should map alternative column names', () => {
      const headers = ['Date', 'Description', 'Debit', 'Credit'];
      const preset = mockPresets[0];
      const mapping = mapColumns(headers, preset);

      expect(mapping.date).toBe('Date');
      expect(mapping.description).toBe('Description');
    });

    it('should handle case insensitive matching', () => {
      const headers = ['booking date', 'text', 'debit', 'credit'];
      const preset = mockPresets[0];
      const mapping = mapColumns(headers, preset);

      expect(mapping.date).toBe('booking date');
      expect(mapping.description).toBe('text');
    });

    it('should return null for unmapped fields', () => {
      const headers = ['Date', 'Description'];
      const preset = mockPresets[0];
      const mapping = mapColumns(headers, preset);

      expect(mapping.date).toBe('Date');
      expect(mapping.description).toBe('Description');
      expect(mapping.debit).toBeNull();
      expect(mapping.credit).toBeNull();
    });

    it('should return empty mapping for null preset', () => {
      const headers = ['Date', 'Description', 'Amount'];
      const mapping = mapColumns(headers, null);

      expect(mapping.date).toBeNull();
      expect(mapping.description).toBeNull();
      expect(mapping.amount).toBeNull();
    });
  });

  describe('validateMapping', () => {
    it('should validate complete mapping with amount', () => {
      const mapping = {
        date: 'Date',
        description: 'Description',
        amount: 'Amount',
        debit: null,
        credit: null,
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate complete mapping with debit/credit', () => {
      const mapping = {
        date: 'Date',
        description: 'Description',
        amount: null,
        debit: 'Debit',
        credit: 'Credit',
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail without date', () => {
      const mapping = {
        date: null,
        description: 'Description',
        amount: 'Amount',
        debit: null,
        credit: null,
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date column is required');
    });

    it('should fail without description', () => {
      const mapping = {
        date: 'Date',
        description: null,
        amount: 'Amount',
        debit: null,
        credit: null,
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description column is required');
    });

    it('should fail without amount or debit/credit', () => {
      const mapping = {
        date: 'Date',
        description: 'Description',
        amount: null,
        debit: null,
        credit: null,
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount column or Debit/Credit columns are required');
    });

    it('should accept partial debit/credit (at least one)', () => {
      const mapping = {
        date: 'Date',
        description: 'Description',
        amount: null,
        debit: 'Debit',
        credit: null,
        currency: null,
        balance: null,
        valueDate: null,
        reference: null
      };

      const result = validateMapping(mapping);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
