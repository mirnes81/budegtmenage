import { useState, useEffect } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { normalizeMerchant } from '../lib/bankDescriptionCleaner';

interface Category {
  id: string;
  name: string;
}

interface MerchantGroup {
  merchantKey: string;
  originalNames: string[];
  transactionIds: string[];
  count: number;
  selectedCategoryId: string | null;
}

interface QuickCategorizationProps {
  importFileId: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function QuickCategorization({
  importFileId,
  onClose,
  onComplete
}: QuickCategorizationProps) {
  const [merchantGroups, setMerchantGroups] = useState<MerchantGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [importFileId]);

  async function loadData() {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      const diversCategory = categoriesData?.find(c =>
        c.name.toLowerCase() === 'divers' ||
        c.name.toLowerCase() === 'autres' ||
        c.name.toLowerCase() === 'other'
      );

      if (!diversCategory) {
        setLoading(false);
        return;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, description, category_id')
        .eq('import_file_id', importFileId)
        .eq('category_id', diversCategory.id);

      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      const groups = new Map<string, MerchantGroup>();

      for (const transaction of transactions) {
        const merchantKey = normalizeMerchant(transaction.description);

        if (!groups.has(merchantKey)) {
          groups.set(merchantKey, {
            merchantKey,
            originalNames: [transaction.description],
            transactionIds: [transaction.id],
            count: 1,
            selectedCategoryId: null
          });
        } else {
          const group = groups.get(merchantKey)!;
          group.count++;
          group.transactionIds.push(transaction.id);
          if (!group.originalNames.includes(transaction.description)) {
            group.originalNames.push(transaction.description);
          }
        }
      }

      setMerchantGroups(Array.from(groups.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    setSaving(true);
    setError('');

    try {
      for (const group of merchantGroups) {
        if (group.selectedCategoryId) {
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ category_id: group.selectedCategoryId })
            .in('id', group.transactionIds);

          if (updateError) throw updateError;

          const { error: ruleError } = await supabase
            .from('merchant_rules')
            .upsert({
              merchant_key: group.merchantKey,
              default_category_id: group.selectedCategoryId
            }, {
              onConflict: 'merchant_key'
            });

          if (ruleError) throw ruleError;
        }
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply categorization');
    } finally {
      setSaving(false);
    }
  }

  function handleCategoryChange(merchantKey: string, categoryId: string) {
    setMerchantGroups(prev =>
      prev.map(group =>
        group.merchantKey === merchantKey
          ? { ...group, selectedCategoryId: categoryId }
          : group
      )
    );
  }

  function handleSkip() {
    onComplete();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (merchantGroups.length === 0) {
    return null;
  }

  const totalUncategorized = merchantGroups.reduce((sum, g) => sum + g.count, 0);
  const categorizedCount = merchantGroups.filter(g => g.selectedCategoryId).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Quick Categorization
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {totalUncategorized} transactions need categorization ({categorizedCount} of {merchantGroups.length} merchants categorized)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {merchantGroups.map(group => (
              <div
                key={group.merchantKey}
                className="bg-slate-700 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {group.merchantKey}
                    </div>
                    <div className="text-sm text-slate-400">
                      {group.count} transaction{group.count > 1 ? 's' : ''}
                    </div>
                    {group.originalNames.length > 1 && (
                      <div className="text-xs text-slate-500 mt-1">
                        Also appears as: {group.originalNames.slice(1).join(', ')}
                      </div>
                    )}
                  </div>
                  {group.selectedCategoryId && (
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                </div>

                <select
                  value={group.selectedCategoryId || ''}
                  onChange={(e) => handleCategoryChange(group.merchantKey, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for Now
          </button>
          <button
            onClick={handleApply}
            disabled={saving || categorizedCount === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Applying...' : `Apply ${categorizedCount > 0 ? `(${categorizedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
