import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface Stats {
  income: number;
  expenses: number;
  balance: number;
  accountsTotal: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ income: 0, expenses: 0, balance: 0, accountsTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, date, description, categories(name, icon, color)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (transactions) {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0));

        setStats({
          income,
          expenses,
          balance: income - expenses,
          accountsTotal: income - expenses,
        });

        setRecentTransactions(transactions.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-slate-400 mt-1">
          Aperçu de votre budget pour {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Revenus</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            CHF {formatCHF(stats.income)}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Dépenses</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            CHF {formatCHF(stats.expenses)}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Solde</p>
          <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            CHF {formatCHF(stats.balance)}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <PiggyBank className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Épargne potentielle</p>
          <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
            CHF {formatCHF(Math.max(0, stats.balance))}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Transactions récentes</h2>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Aucune transaction ce mois-ci</p>
          ) : (
            recentTransactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: transaction.categories?.color + '20' }}
                  >
                    <span style={{ color: transaction.categories?.color }}>
                      {transaction.categories?.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-slate-400">{transaction.categories?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.type === 'income' ? '+' : '-'}CHF {formatCHF(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-sm text-slate-400">
                    {format(new Date(transaction.date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
