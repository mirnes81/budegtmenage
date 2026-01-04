import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  order_index: number;
  is_active: boolean;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: 0
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('order_index');

      if (error) throw error;

      const accountsWithBalance = await Promise.all(
        (data || []).map(async (account) => {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('account_id', account.id);

          const balance = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          return {
            ...account,
            balance
          };
        })
      );

      setAccounts(accountsWithBalance);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
      alert('Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Veuillez entrer un nom de compte');
      return;
    }

    try {
      const maxOrder = Math.max(...accounts.map(a => a.order_index), -1);

      const { error } = await supabase
        .from('accounts')
        .insert({
          name: formData.name,
          type: formData.type,
          order_index: maxOrder + 1,
          is_active: true
        });

      if (error) throw error;

      await fetchAccounts();
      setShowAddModal(false);
      setFormData({ name: '', type: 'bank', balance: 0 });
    } catch (error) {
      console.error('Erreur ajout compte:', error);
      alert('Erreur lors de l\'ajout du compte');
    }
  };

  const handleUpdateAccount = async (accountId: string, updates: Partial<Account>) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId);

      if (error) throw error;

      await fetchAccounts();
      setEditingId(null);
    } catch (error) {
      console.error('Erreur mise à jour compte:', error);
      alert('Erreur lors de la mise à jour du compte');
    }
  };

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte "${accountName}" ?\n\nToutes les transactions associées seront également supprimées.`)) {
      return;
    }

    try {
      const { error: transError } = await supabase
        .from('transactions')
        .delete()
        .eq('account_id', accountId);

      if (transError) throw transError;

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      await fetchAccounts();
    } catch (error) {
      console.error('Erreur suppression compte:', error);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const accountTypeLabels: Record<string, string> = {
    bank: 'Compte bancaire',
    cash: 'Argent liquide',
    credit: 'Carte de crédit',
    savings: 'Compte épargne',
    investment: 'Investissement'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Comptes</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Gérez vos comptes bancaires et liquidités
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun compte</h3>
            <p className="text-slate-400 mb-6">
              Créez votre premier compte pour commencer
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Créer un compte
            </button>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              {editingId === account.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    defaultValue={account.name}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== account.name) {
                        handleUpdateAccount(account.id, { name: e.target.value });
                      } else {
                        setEditingId(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold truncate">{account.name}</h3>
                      <span className="px-2 py-1 text-xs bg-slate-700 rounded-lg text-slate-300 whitespace-nowrap">
                        {accountTypeLabels[account.type] || account.type}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      CHF {formatCHF(account.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingId(account.id)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id, account.name)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouveau compte</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', type: 'bank', balance: 0 });
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du compte</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: UBS Compte courant"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type de compte</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank">Compte bancaire</option>
                  <option value="cash">Argent liquide</option>
                  <option value="credit">Carte de crédit</option>
                  <option value="savings">Compte épargne</option>
                  <option value="investment">Investissement</option>
                </select>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-sm text-blue-200">
                <p className="font-medium mb-1">Note</p>
                <p className="text-blue-300/80">
                  Le solde sera calculé automatiquement à partir de vos transactions
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', type: 'bank', balance: 0 });
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
