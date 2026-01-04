import { describe, it, expect } from 'vitest';
import { generateLineHash } from './importDeduplication';

describe('Import Deduplication', () => {
  describe('generateLineHash', () => {
    it('should generate consistent hash for same transaction', async () => {
      const transaction = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const hash1 = await generateLineHash(transaction);
      const hash2 = await generateLineHash(transaction);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should generate different hash for different date', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const transaction2 = {
        ...transaction1,
        date: new Date('2024-01-16')
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hash for different amount', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const transaction2 = {
        ...transaction1,
        amount: 100.51
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hash for different description', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const transaction2 = {
        ...transaction1,
        description: 'Different Transaction'
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hash for different account', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const transaction2 = {
        ...transaction1,
        accountId: 'account-456'
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize description whitespace', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test  Transaction'
      };

      const transaction2 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).toBe(hash2);
    });

    it('should include reference in hash if provided', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction',
        reference: 'REF-123'
      };

      const transaction2 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction',
        reference: 'REF-456'
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should include valueDate in hash if provided', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction',
        valueDate: new Date('2024-01-16')
      };

      const transaction2 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction',
        valueDate: new Date('2024-01-17')
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize amounts to 2 decimals', async () => {
      const transaction1 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.5,
        description: 'Test Transaction'
      };

      const transaction2 = {
        accountId: 'account-123',
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test Transaction'
      };

      const hash1 = await generateLineHash(transaction1);
      const hash2 = await generateLineHash(transaction2);

      expect(hash1).toBe(hash2);
    });
  });
});
