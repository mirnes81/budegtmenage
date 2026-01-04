import { Home, Receipt, RepeatIcon, BarChart3, Settings, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/accounts', icon: Wallet, label: 'Comptes' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-600 z-50 shadow-2xl">
      <div className="flex justify-around items-center h-20 px-2 safe-bottom">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-2 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-300 active:bg-slate-700/50'
              }`}
            >
              <Icon size={26} strokeWidth={2} />
              <span className="text-[10px] font-medium mt-1.5 leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
