import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { Download, TrendingUp, TrendingDown, Calendar, PieChart as PieChartIcon, Wallet } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Stats() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [fixedVsVariableCosts, setFixedVsVariableCosts] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, fixedCosts: 0, variableCosts: 0 });

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, color), members(name)')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'));

      if (transactions) {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0));

        const fixedCosts = Math.abs(transactions
          .filter(t => t.type === 'expense' && t.is_fixed)
          .reduce((sum, t) => sum + Number(t.amount), 0));

        const variableCosts = Math.abs(transactions
          .filter(t => t.type === 'expense' && !t.is_fixed)
          .reduce((sum, t) => sum + Number(t.amount), 0));

        setSummary({ income, expenses, balance: income - expenses, fixedCosts, variableCosts });

        const categoryMap = new Map<string, { name: string; amount: number; color: string }>();
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const key = t.categories?.name || 'Autre';
            const current = categoryMap.get(key) || { name: key, amount: 0, color: t.categories?.color || '#6b7280' };
            categoryMap.set(key, {
              ...current,
              amount: current.amount + Math.abs(Number(t.amount)),
            });
          });

        const catData = Array.from(categoryMap.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);
        setCategoryData(catData);

        const memberMap = new Map<string, { name: string; amount: number }>();
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const key = t.members?.name || 'Autre';
            const current = memberMap.get(key) || { name: key, amount: 0 };
            memberMap.set(key, {
              ...current,
              amount: current.amount + Math.abs(Number(t.amount)),
            });
          });

        setMemberData(Array.from(memberMap.values()));

        const monthMap = new Map<string, { month: string; income: number; expenses: number; fixed: number; variable: number }>();
        for (let i = 11; i >= 0; i--) {
          const date = subMonths(now, i);
          const monthKey = format(date, 'MMM yyyy');
          monthMap.set(monthKey, { month: monthKey, income: 0, expenses: 0, fixed: 0, variable: 0 });
        }

        transactions.forEach(t => {
          const monthKey = format(new Date(t.date), 'MMM yyyy');
          const current = monthMap.get(monthKey);
          if (current) {
            if (t.type === 'income') {
              current.income += Number(t.amount);
            } else {
              const amount = Math.abs(Number(t.amount));
              current.expenses += amount;
              if (t.is_fixed) {
                current.fixed += amount;
              } else {
                current.variable += amount;
              }
            }
          }
        });

        setMonthlyData(Array.from(monthMap.values()));
        setFixedVsVariableCosts(Array.from(monthMap.values()).map(m => ({
          month: m.month,
          'Coûts fixes': m.fixed,
          'Coûts variables': m.variable,
        })));

        const weekMap = new Map<string, { week: string; expenses: number }>();
        for (let i = 11; i >= 0; i--) {
          const weekStart = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
          const weekKey = `Sem. ${format(weekStart, 'w')}`;
          weekMap.set(weekKey, { week: weekKey, expenses: 0 });
        }

        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const weekStart = startOfWeek(new Date(t.date), { weekStartsOn: 1 });
            const weekKey = `Sem. ${format(weekStart, 'w')}`;
            const current = weekMap.get(weekKey);
            if (current) {
              current.expenses += Math.abs(Number(t.amount));
            }
          });

        setWeeklyData(Array.from(weekMap.values()));
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Catégorie', 'Montant (CHF)'];
    const rows = categoryData.map(item => [item.name, item.amount.toFixed(2)]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Statistiques</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 md:flex-none"
          >
            <option value="month">Ce mois</option>
            <option value="quarter">3 derniers mois</option>
            <option value="year">12 derniers mois</option>
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-slate-400 text-sm">Revenus</p>
          </div>
          <p className="text-2xl font-bold text-green-400">CHF {formatCHF(summary.income)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-slate-400 text-sm">Dépenses</p>
          </div>
          <p className="text-2xl font-bold text-red-400">CHF {formatCHF(summary.expenses)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm">Solde</p>
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            CHF {formatCHF(summary.balance)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm">Coûts fixes</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">CHF {formatCHF(summary.fixedCosts)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-600/20 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-slate-400 text-sm">Coûts variables</p>
          </div>
          <p className="text-2xl font-bold text-cyan-400">CHF {formatCHF(summary.variableCosts)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Dépenses par semaine</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => `CHF ${formatCHF(value)}`}
              />
              <Bar dataKey="expenses" fill="#3b82f6" name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Dépenses par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => `CHF ${formatCHF(value)}`}
              />
              <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Coûts fixes vs variables par mois</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fixedVsVariableCosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value: number) => `CHF ${formatCHF(value)}`}
            />
            <Legend />
            <Bar dataKey="Coûts fixes" fill="#f97316" name="Coûts fixes" />
            <Bar dataKey="Coûts variables" fill="#06b6d4" name="Coûts variables" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Évolution mensuelle</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value: number) => `CHF ${formatCHF(value)}`}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="Revenus" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Dépenses" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Dépenses par catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.amount / summary.expenses) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => `CHF ${formatCHF(value)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Dépenses par membre</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => `CHF ${formatCHF(value)}`}
              />
              <Bar dataKey="amount" fill="#3b82f6" name="Montant" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Top 10 catégories</h2>
        <div className="space-y-3">
          {categoryData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold">CHF {formatCHF(item.amount)}</p>
                <p className="text-sm text-slate-400">
                  {((item.amount / summary.expenses) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
