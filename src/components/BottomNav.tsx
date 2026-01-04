import { Home, Receipt, RepeatIcon, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: Home, label: 'Tableau de bord' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/recurring', icon: RepeatIcon, label: 'Charges fixes' },
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
