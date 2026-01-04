import { describe, it, expect, beforeEach } from 'vitest';
import { getTransactionDefaults, saveTransactionDefaults } from './smartDefaults';

describe('smartDefaults', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTransactionDefaults', () => {
    it('should return empty object when no defaults saved', () => {
      const result = getTransactionDefaults();
      expect(result).toEqual({});
    });

    it('should return saved defaults', () => {
      const defaults = {
        category_id: 'cat-1',
        account_id: 'acc-1',
        member_id: 'mem-1',
        type: 'expense' as const,
      };

      localStorage.setItem('transaction_defaults', JSON.stringify(defaults));

      const result = getTransactionDefaults();
      expect(result).toEqual(defaults);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('transaction_defaults', 'invalid-json');

      const result = getTransactionDefaults();
      expect(result).toEqual({});
    });
  });

  describe('saveTransactionDefaults', () => {
    it('should save defaults to localStorage', () => {
      const defaults = {
        category_id: 'cat-1',
        type: 'expense' as const,
      };

      saveTransactionDefaults(defaults);

      const stored = localStorage.getItem('transaction_defaults');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(defaults);
    });

    it('should merge with existing defaults', () => {
      const initial = { category_id: 'cat-1', account_id: 'acc-1' };
      saveTransactionDefaults(initial);

      const update = { member_id: 'mem-1' };
      saveTransactionDefaults(update);

      const result = getTransactionDefaults();
      expect(result).toEqual({ ...initial, ...update });
    });
  });
});
