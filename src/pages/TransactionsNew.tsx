import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Copy, Edit2, Trash2, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF, getMerchantInitials, getMerchantColor } from '../lib/utils';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FAB } from '../components/ui/FAB';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import { Toast } from '../components/ui/Toast';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'expense' | 'income';
  category_id: string;
  account_id: string;
  member_id: string;
  description: string;
  notes: string | null;
  categories?: { name: string; icon: string; color: string };
  accounts?: { name: string };
  members?: { name: string };
}

export function TransactionsNew() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [duplicatingTransaction, setDuplicatingTransaction] = useState<Transaction | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, color), accounts(name), members(name)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      showToast('Erreur chargement transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction({
      id: transaction.id,
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      member_id: transaction.member_id,
      description: transaction.description,
      notes: transaction.notes,
    });
    setShowQuickAdd(true);
    setOpenMenuId(null);
  };

  const handleDuplicate = (transaction: Transaction) => {
    setDuplicatingTransaction({
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      member_id: transaction.member_id,
      description: transaction.description,
      notes: transaction.notes,
      id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowQuickAdd(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette transaction ?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTransactions();
      showToast('Transaction supprimée', 'success');
    } catch (error) {
      console.error('Erreur suppression transaction:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
    setOpenMenuId(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categories?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return 'Hier';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const handleCloseQuickAdd = () => {
    setShowQuickAdd(false);
    setEditingTransaction(null);
    setDuplicatingTransaction(null);
  };

  const handleSuccessQuickAdd = () => {
    fetchTransactions();
    const message = editingTransaction
      ? 'Transaction modifiée'
      : duplicatingTransaction
      ? 'Transaction dupliquée'
      : 'Transaction ajoutée';
    showToast(message, 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterType === 'income' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Revenus
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Dépenses
          </button>
          <button
            onClick={() => navigate('/import-csv')}
            className="ml-auto px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
          >
            <FileDown size={18} />
            Import CSV
          </button>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
          <p className="text-slate-400 text-lg mb-2">Aucune transaction</p>
          <p className="text-slate-500 text-sm">Appuyez sur le bouton + pour commencer</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayTransactions = groupedTransactions[date];
            const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-semibold capitalize">{formatDateHeader(date)}</h2>
                  <span
                    className={`text-sm font-medium ${
                      dayTotal >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {dayTotal >= 0 ? '+' : ''}CHF {formatCHF(dayTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: getMerchantColor(transaction.description) }}
                        >
                          {getMerchantInitials(transaction.description)}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium text-white truncate mb-1">{transaction.description}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {transaction.categories?.name} • {transaction.members?.name}
                          </p>
                        </div>

                        <div className="flex items-start gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-base font-bold whitespace-nowrap ${
                                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}CHF{' '}
                              {formatCHF(Math.abs(transaction.amount))}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[80px]">{transaction.accounts?.name}</p>
                          </div>

                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === transaction.id ? null : transaction.id)
                              }
                              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                            >
                              <MoreVertical size={18} className="text-slate-400" />
                            </button>

                            {openMenuId === transaction.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-700 border border-slate-600 rounded-xl shadow-2xl z-20 overflow-hidden">
                                  <button
                                    onClick={() => handleEdit(transaction)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-600 transition-colors text-left"
                                  >
                                    <Edit2 size={18} className="text-blue-400" />
                                    <span>Modifier</span>
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(transaction)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-600 transition-colors text-left"
                                  >
                                    <Copy size={18} className="text-green-400" />
                                    <span>Dupliquer</span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(transaction.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-600 transition-colors text-left"
                                  >
                                    <Trash2 size={18} className="text-red-400" />
                                    <span>Supprimer</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FAB onClick={() => setShowQuickAdd(true)} />

      <QuickAddTransaction
        open={showQuickAdd}
        onClose={handleCloseQuickAdd}
        onSuccess={handleSuccessQuickAdd}
        editingTransaction={editingTransaction}
        duplicatingTransaction={duplicatingTransaction}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
