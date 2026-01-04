import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCsv,
  detectDateFormat,
  detectDecimalSeparator,
  parseAmount,
  normalizeDescription
} from './csvParser';

describe('CSV Parser', () => {
  describe('detectDelimiter', () => {
    it('should detect semicolon delimiter', () => {
      const content = 'Date;Description;Amount\n01.01.2024;Test;100.00';
      expect(detectDelimiter(content)).toBe(';');
    });

    it('should detect comma delimiter', () => {
      const content = 'Date,Description,Amount\n01/01/2024,Test,100.00';
      expect(detectDelimiter(content)).toBe(',');
    });

    it('should detect tab delimiter', () => {
      const content = 'Date\tDescription\tAmount\n01.01.2024\tTest\t100.00';
      expect(detectDelimiter(content)).toBe('\t');
    });

    it('should default to comma if no delimiter found', () => {
      const content = 'SingleColumn';
      expect(detectDelimiter(content)).toBe(',');
    });
  });

  describe('parseCsv', () => {
    it('should parse simple CSV with semicolon', () => {
      const content = 'Date;Description;Amount\n01.01.2024;Test;100.00\n02.01.2024;Test2;200.00';
      const result = parseCsv(content, ';');

      expect(result.headers).toEqual(['Date', 'Description', 'Amount']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['01.01.2024', 'Test', '100.00']);
    });

    it('should handle quoted values with delimiters', () => {
      const content = 'Date;Description;Amount\n01.01.2024;"Test; with semicolon";100.00';
      const result = parseCsv(content, ';');

      expect(result.rows[0][1]).toBe('Test; with semicolon');
    });

    it('should handle empty lines', () => {
      const content = 'Date;Description;Amount\n01.01.2024;Test;100.00\n\n02.01.2024;Test2;200.00';
      const result = parseCsv(content, ';');

      expect(result.rows).toHaveLength(2);
    });
  });

  describe('detectDateFormat', () => {
    it('should detect dd.MM.yyyy format', () => {
      const samples = ['01.01.2024', '15.03.2024', '31.12.2024'];
      expect(detectDateFormat(samples)).toBe('dd.MM.yyyy');
    });

    it('should detect yyyy-MM-dd format', () => {
      const samples = ['2024-01-01', '2024-03-15', '2024-12-31'];
      expect(detectDateFormat(samples)).toBe('yyyy-MM-dd');
    });

    it('should detect dd/MM/yyyy format', () => {
      const samples = ['01/01/2024', '15/03/2024', '31/12/2024'];
      expect(detectDateFormat(samples)).toBe('dd/MM/yyyy');
    });

    it('should return null for unrecognized format', () => {
      const samples = ['invalid', 'date', 'format'];
      expect(detectDateFormat(samples)).toBeNull();
    });
  });

  describe('detectDecimalSeparator', () => {
    it('should detect dot as decimal separator', () => {
      const samples = ['100.50', '200.75', '1500.00'];
      expect(detectDecimalSeparator(samples)).toBe('.');
    });

    it('should detect comma as decimal separator', () => {
      const samples = ['100,50', '200,75', '1500,00'];
      expect(detectDecimalSeparator(samples)).toBe(',');
    });

    it('should default to dot if unclear', () => {
      const samples = ['100', '200', '1500'];
      expect(detectDecimalSeparator(samples)).toBe('.');
    });
  });

  describe('parseAmount', () => {
    it('should parse amount with dot decimal separator', () => {
      expect(parseAmount('100.50', '.')).toBe(100.50);
      expect(parseAmount('1234.56', '.')).toBe(1234.56);
    });

    it('should parse amount with comma decimal separator', () => {
      expect(parseAmount('100,50', ',')).toBe(100.50);
      expect(parseAmount('1234,56', ',')).toBe(1234.56);
    });

    it('should parse amount with thousands separator', () => {
      expect(parseAmount("1'234.50", '.')).toBe(1234.50);
      expect(parseAmount('1.234,50', ',')).toBe(1234.50);
    });

    it('should handle negative amounts', () => {
      expect(parseAmount('-100.50', '.')).toBe(-100.50);
      expect(parseAmount('-1234,56', ',')).toBe(-1234.56);
    });

    it('should handle amounts with currency symbols', () => {
      expect(parseAmount('CHF 100.50', '.')).toBe(100.50);
      expect(parseAmount('$ 1234.56', '.')).toBe(1234.56);
    });

    it('should return 0 for empty or invalid values', () => {
      expect(parseAmount('', '.')).toBe(0);
      expect(parseAmount('   ', '.')).toBe(0);
      expect(parseAmount('invalid', '.')).toBe(0);
    });
  });

  describe('normalizeDescription', () => {
    it('should trim whitespace', () => {
      expect(normalizeDescription('  Test  ')).toBe('Test');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeDescription('Test   Description')).toBe('Test Description');
    });

    it('should remove control characters', () => {
      expect(normalizeDescription('Test\u0000Description\u001F')).toBe('TestDescription');
    });

    it('should handle empty strings', () => {
      expect(normalizeDescription('')).toBe('');
      expect(normalizeDescription('   ')).toBe('');
    });
  });
});
