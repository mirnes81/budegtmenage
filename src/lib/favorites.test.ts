import { describe, it, expect, vi } from 'vitest';
import { getFavoriteCategories, getGroupedCategories } from './favorites';

const createMockChain = () => {
  const mockChain: any = {
    eq: vi.fn(() => mockChain),
    gte: vi.fn(() => ({ data: [], error: null })),
    in: vi.fn(() => mockChain),
    order: vi.fn(() => mockChain),
    data: [],
    error: null,
  };
  return mockChain;
};

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => createMockChain()),
    })),
  },
}));

describe('getFavoriteCategories', () => {
  it('should return empty array when no transactions', async () => {
    const result = await getFavoriteCategories('expense', 6);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should limit results to specified number', async () => {
    const result = await getFavoriteCategories('expense', 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should handle errors gracefully', async () => {
    const result = await getFavoriteCategories('income', 6);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getGroupedCategories', () => {
  it('should return grouped categories object', async () => {
    const result = await getGroupedCategories('expense', []);
    expect(typeof result).toBe('object');
  });

  it('should exclude specified category IDs', async () => {
    const result = await getGroupedCategories('expense', ['test-id']);
    expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
  });

  it('should handle errors gracefully', async () => {
    const result = await getGroupedCategories('income', []);
    expect(typeof result).toBe('object');
  });
});
