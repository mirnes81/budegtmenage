import { Home, Receipt, RepeatIcon, BarChart3, Settings, LogOut, Landmark, FileText, Wallet, Upload } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { path: '/', icon: Home, label: 'Tableau de bord' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/accounts', icon: Wallet, label: 'Comptes' },
  { path: '/import-csv', icon: Upload, label: 'Import CSV' },
  { path: '/recurring', icon: RepeatIcon, label: 'Charges fixes' },
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  { path: '/taxes', icon: Landmark, label: 'Impôts' },
  { path: '/tax-report', icon: FileText, label: 'Rapport Fiscal' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Budget Ménage</h1>
        <p className="text-sm text-slate-400 mt-1">Suisse</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-700 w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
