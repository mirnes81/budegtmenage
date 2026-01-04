import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';
import { useMembers, useAccounts, useCategories } from '../hooks/useSupabase';
import { format } from 'date-fns';

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category_id: string;
  account_id: string;
  member_id: string;
  day_of_month: number;
  is_active: boolean;
  categories?: { name: string };
  accounts?: { name: string };
  members?: { name: string };
}

export function Recurring() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { members } = useMembers();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    category_id: '',
    account_id: '',
    member_id: '',
    day_of_month: 1,
    is_active: true,
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*, categories(name), accounts(name), members(name)')
        .order('day_of_month');

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erreur chargement charges fixes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingId) {
        const { error } = await supabase
          .from('recurring_expenses')
          .update({ ...expenseData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recurring_expenses')
          .insert([expenseData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Erreur sauvegarde charge fixe:', error);
    }
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      frequency: expense.frequency,
      category_id: expense.category_id,
      account_id: expense.account_id,
      member_id: expense.member_id,
      day_of_month: expense.day_of_month,
      is_active: expense.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette charge fixe?')) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Erreur suppression charge fixe:', error);
    }
  };

  const generateTransactions = async () => {
    if (!confirm('Générer les transactions pour ce mois?')) return;

    try {
      setGenerating(true);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const activeExpenses = expenses.filter(e => e.is_active);

      for (const expense of activeExpenses) {
        const { data: existing } = await supabase
          .from('generated_transactions')
          .select('id')
          .eq('recurring_expense_id', expense.id)
          .eq('year', currentYear)
          .eq('month', currentMonth)
          .maybeSingle();

        if (existing) {
          continue;
        }

        const transactionDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(expense.day_of_month).padStart(2, '0')}`;

        const { data: transaction, error: transError } = await supabase
          .from('transactions')
          .insert({
            date: transactionDate,
            amount: -Math.abs(expense.amount),
            type: 'expense',
            category_id: expense.category_id,
            account_id: expense.account_id,
            member_id: expense.member_id,
            description: expense.name,
            is_fixed: true,
            recurring_expense_id: expense.id,
          })
          .select()
          .single();

        if (transError) throw transError;

        const { error: genError } = await supabase
          .from('generated_transactions')
          .insert({
            recurring_expense_id: expense.id,
            year: currentYear,
            month: currentMonth,
            transaction_id: transaction.id,
          });

        if (genError) throw genError;
      }

      alert('Transactions générées avec succès!');
    } catch (error) {
      console.error('Erreur génération transactions:', error);
      alert('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category_id: '',
      account_id: '',
      member_id: '',
      day_of_month: 1,
      is_active: true,
    });
  };

  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    'semi-annual': 'Semestriel',
    annual: 'Annuel',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Charges fixes</h1>
        <div className="flex gap-2">
          <button
            onClick={generateTransactions}
            disabled={generating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
          >
            <PlayCircle size={20} />
            {generating ? 'Génération...' : 'Générer ce mois'}
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nouvelle charge
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {expenses.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
              <p className="text-slate-400">Aucune charge fixe configurée</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className={`bg-slate-800 rounded-xl p-6 border ${expense.is_active ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{expense.name}</h3>
                      {!expense.is_active && (
                        <span className="px-2 py-1 bg-slate-700 text-xs rounded">Inactif</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                      <div>
                        <span className="block text-slate-500">Catégorie</span>
                        <span>{expense.categories?.name}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Fréquence</span>
                        <span>{frequencyLabels[expense.frequency]}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Jour</span>
                        <span>{expense.day_of_month}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Membre</span>
                        <span>{expense.members?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-400">
                        CHF {formatCHF(expense.amount)}
                      </p>
                      <p className="text-sm text-slate-400">{expense.accounts?.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold">
                {editingId ? 'Modifier la charge fixe' : 'Nouvelle charge fixe'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Loyer mensuel"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Montant (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fréquence</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="quarterly">Trimestriel</option>
                    <option value="semi-annual">Semestriel</option>
                    <option value="annual">Annuel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Compte</label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Membre</label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jour du mois</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm">Actif</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-6 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
