import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronRight, Calendar, Info, Check, X } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { Picker } from './ui/Picker';
import { supabase } from '../lib/supabase';
import { useMembers, useAccounts, useCategories } from '../hooks/useSupabase';
import {
  getTransactionDefaults,
  saveTransactionDefaults,
} from '../lib/smartDefaults';
import {
  getDeductionRuleForCategory,
  DeductionType,
  DeductionStatus,
  DeductionSuggestion,
  DEDUCTION_LABELS,
} from '../lib/taxDeductions';

interface QuickAddTransactionProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaction?: {
    id: string;
    date: string;
    amount: number;
    type: 'expense' | 'income';
    category_id: string;
    account_id: string;
    member_id: string;
    description: string;
    notes: string | null;
  } | null;
  duplicatingTransaction?: {
    id?: string;
    date?: string;
    amount: number;
    type: 'expense' | 'income';
    category_id: string;
    account_id: string;
    member_id: string;
    description: string;
    notes: string | null;
  } | null;
}

export function QuickAddTransaction({
  open,
  onClose,
  onSuccess,
  editingTransaction,
  duplicatingTransaction,
}: QuickAddTransactionProps) {
  const { members } = useMembers();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [memberId, setMemberId] = useState('');

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const [deductionSuggestion, setDeductionSuggestion] = useState<DeductionSuggestion | null>(null);
  const [deductionType, setDeductionType] = useState<DeductionType>('NONE');
  const [deductionStatus, setDeductionStatus] = useState<DeductionStatus>('NONE');
  const [showSplitChoice, setShowSplitChoice] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setAmount(Math.abs(editingTransaction.amount).toString());
        setType(editingTransaction.type);
        setDescription(editingTransaction.description);
        setNotes(editingTransaction.notes || '');
        setDate(editingTransaction.date);
        setCategoryId(editingTransaction.category_id);
        setAccountId(editingTransaction.account_id);
        setMemberId(editingTransaction.member_id);
      } else if (duplicatingTransaction) {
        setAmount(Math.abs(duplicatingTransaction.amount).toString());
        setType(duplicatingTransaction.type);
        setDescription(duplicatingTransaction.description);
        setNotes(duplicatingTransaction.notes || '');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setCategoryId(duplicatingTransaction.category_id);
        setAccountId(duplicatingTransaction.account_id);
        setMemberId(duplicatingTransaction.member_id);
      } else {
        resetToDefaults();
      }
    }
  }, [open, editingTransaction, duplicatingTransaction]);

  useEffect(() => {
    if (categoryId && type === 'expense') {
      loadDeductionRule(categoryId);
    } else {
      setDeductionSuggestion(null);
      setShowSplitChoice(false);
    }
  }, [categoryId, type]);

  const loadDeductionRule = async (catId: string) => {
    const rule = await getDeductionRuleForCategory(catId);
    if (rule) {
      setDeductionSuggestion(rule);
      setDeductionType(rule.deductionType);
      setDeductionStatus('SUGGESTED');
    } else {
      setDeductionSuggestion(null);
      setDeductionType('NONE');
      setDeductionStatus('NONE');
    }
  };

  const handleConfirmDeduction = () => {
    if (!deductionSuggestion) return;

    if (deductionSuggestion.needsUserSplit) {
      setShowSplitChoice(true);
    } else {
      setDeductionStatus('CONFIRMED');
      setDeductionSuggestion(null);
    }
  };

  const handleRejectDeduction = () => {
    setDeductionType('NONE');
    setDeductionStatus('REJECTED');
    setDeductionSuggestion(null);
    setShowSplitChoice(false);
  };

  const handleSplitChoice = (isDeductible: boolean) => {
    if (isDeductible) {
      setDeductionStatus('CONFIRMED');
    } else {
      setDeductionType('NONE');
      setDeductionStatus('REJECTED');
    }
    setShowSplitChoice(false);
    setDeductionSuggestion(null);
  };

  const resetToDefaults = () => {
    const defaults = getTransactionDefaults();

    if (defaults.category_id && categories.find((c) => c.id === defaults.category_id)) {
      setCategoryId(defaults.category_id);
    } else if (categories.length > 0) {
      const coursesCategory = categories.find((c) => c.name === 'Courses');
      setCategoryId(coursesCategory?.id || categories[0].id);
    }

    if (defaults.account_id && accounts.find((a) => a.id === defaults.account_id)) {
      setAccountId(defaults.account_id);
    } else if (accounts.length > 0) {
      const banqueAccount = accounts.find((a) => a.name === 'Banque');
      setAccountId(banqueAccount?.id || accounts[0].id);
    }

    if (defaults.member_id && members.find((m) => m.id === defaults.member_id)) {
      setMemberId(defaults.member_id);
    } else if (members.length > 0) {
      const menageMember = members.find((m) => m.name === 'Ménage');
      setMemberId(menageMember?.id || members[0].id);
    }

    setType(defaults.type || 'expense');
    setAmount('');
    setDescription('');
    setNotes('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setDeductionType('NONE');
    setDeductionStatus('NONE');
    setDeductionSuggestion(null);
    setShowSplitChoice(false);
  };

  const handleSave = async () => {
    if (!amount || !description || !categoryId || !accountId || !memberId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const numAmount = parseFloat(amount);
      const taxYear = new Date(date).getFullYear();
      const transactionData = {
        date,
        amount: type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount),
        type,
        category_id: categoryId,
        account_id: accountId,
        member_id: memberId,
        description,
        notes: notes || null,
        deduction_type: deductionType,
        deduction_status: deductionStatus,
        tax_year: taxYear,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update({ ...transactionData, updated_at: new Date().toISOString() })
          .eq('id', editingTransaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert([transactionData]);

        if (error) throw error;

        saveTransactionDefaults({
          category_id: categoryId,
          account_id: accountId,
          member_id: memberId,
          type,
        });
      }

      onSuccess();
      onClose();
      resetToDefaults();
    } catch (error) {
      console.error('Erreur sauvegarde transaction:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedMember = members.find((m) => m.id === memberId);

  const categoriesForType = categories.filter((c) => c.type === type);

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={
          editingTransaction
            ? 'Modifier transaction'
            : duplicatingTransaction
            ? 'Dupliquer transaction'
            : 'Nouvelle transaction'
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <div>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-white text-4xl font-bold text-center border-0 focus:outline-none placeholder-slate-600"
              required
            />
            <div className="text-center text-slate-400 text-sm mt-1">CHF</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              Revenu
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Courses Migros"
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Catégorie
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className="w-full flex items-center gap-3 bg-slate-700 px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-colors"
            >
              {selectedCategory ? (
                <>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    <span className="leading-none">{selectedCategory.icon}</span>
                  </div>
                  <span className="flex-1 text-left text-white truncate">
                    {selectedCategory.name}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-left text-slate-400 truncate">
                  Sélectionner une catégorie
                </span>
              )}
              <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
            </button>
          </div>

          {deductionSuggestion && !showSplitChoice && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-300 mb-1">
                    Déduction fiscale suggérée (VD)
                  </p>
                  <p className="text-sm text-blue-200 mb-2">
                    {DEDUCTION_LABELS[deductionSuggestion.deductionType]}
                  </p>
                  <p className="text-xs text-blue-300/80 mb-3">
                    {deductionSuggestion.note}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDeduction}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Check size={16} />
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectDeduction}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <X size={16} />
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSplitChoice && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-300 mb-2">
                    Précision nécessaire
                  </p>
                  <p className="text-sm text-amber-200 mb-3">
                    Cette dépense est-elle déductible fiscalement ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSplitChoice(true)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Oui, déductible
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSplitChoice(false)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Non, pas déductible
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deductionStatus === 'CONFIRMED' && (
            <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-green-400" />
                <p className="text-sm text-green-300">
                  Déduction confirmée : {DEDUCTION_LABELS[deductionType]}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Compte</label>
            <button
              type="button"
              onClick={() => setShowAccountPicker(true)}
              className="w-full flex items-center gap-3 bg-slate-700 px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-colors"
            >
              {selectedAccount ? (
                <>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: selectedAccount.color }}
                  >
                    <span className="leading-none">{selectedAccount.icon}</span>
                  </div>
                  <span className="flex-1 text-left text-white truncate">
                    {selectedAccount.name}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-left text-slate-400 truncate">
                  Sélectionner un compte
                </span>
              )}
              <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Membre</label>
            <button
              type="button"
              onClick={() => setShowMemberPicker(true)}
              className="w-full flex items-center gap-3 bg-slate-700 px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <span className="flex-1 text-left text-white truncate">
                {selectedMember ? selectedMember.name : 'Sélectionner un membre'}
              </span>
              <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Date</label>
            <div className="relative">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-700 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              rows={3}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving
              ? 'Enregistrement...'
              : editingTransaction
              ? 'Sauvegarder'
              : 'Ajouter'}
          </button>
        </form>
      </Sheet>

      <Picker
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        items={categoriesForType}
        selectedId={categoryId}
        onSelect={setCategoryId}
        title="Sélectionner une catégorie"
        type="category"
        categoryType={type}
      />

      <Picker
        open={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        items={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        title="Sélectionner un compte"
        type="account"
      />

      <Picker
        open={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        items={members}
        selectedId={memberId}
        onSelect={setMemberId}
        title="Sélectionner un membre"
        type="member"
      />
    </>
  );
}
