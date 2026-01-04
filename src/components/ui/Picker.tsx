import { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { Sheet } from './Sheet';
import { Database } from '../../lib/database.types';
import { getFavoriteCategories, getGroupedCategories } from '../../lib/favorites';

type Category = Database['public']['Tables']['categories']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

type PickerItem = Category | Account | Member;

interface PickerProps {
  open: boolean;
  onClose: () => void;
  items?: PickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  title: string;
  type?: 'category' | 'account' | 'member';
  categoryType?: 'expense' | 'income';
}

export function Picker({
  open,
  onClose,
  items = [],
  selectedId,
  onSelect,
  title,
  type,
  categoryType,
}: PickerProps) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Category[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (open && type === 'category' && categoryType) {
      loadCategoryData();
    }
  }, [open, type, categoryType]);

  const loadCategoryData = async () => {
    if (!categoryType) return;

    setLoadingFavorites(true);
    try {
      const favs = await getFavoriteCategories(categoryType, 6);
      setFavorites(favs);

      const favoriteIds = favs.map((f) => f.id);
      const grouped = await getGroupedCategories(categoryType, favoriteIds);
      setGroupedCategories(grouped);
    } catch (error) {
      console.error('Erreur chargement données catégories:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFavorites = favorites.filter((fav) =>
    fav.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroupedCategories: Record<string, Category[]> = {};
  Object.entries(groupedCategories).forEach(([groupName, cats]) => {
    const filtered = cats.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredGroupedCategories[groupName] = filtered;
    }
  });

  const renderItem = (item: PickerItem) => {
    const isSelected = item.id === selectedId;
    const iconName = 'icon' in item ? item.icon : 'circle';
    const color = 'color' in item ? item.color : '#6b7280';

    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item.id)}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : color }}
        >
          <span className="text-xl">{getIconEmoji(iconName)}</span>
        </div>
        <span className="flex-1 text-left font-medium">{item.name}</span>
        {isSelected && <Check size={20} />}
      </button>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-slate-700 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {type === 'category' && !loadingFavorites && (
          <>
            {filteredFavorites.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">
                  ⭐ Favoris
                </h3>
                <div className="space-y-2">
                  {filteredFavorites.map((fav) => renderItem(fav))}
                </div>
              </div>
            )}

            {Object.entries(filteredGroupedCategories).map(([groupName, cats]) => (
              <div key={groupName}>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">
                  {groupName}
                </h3>
                <div className="space-y-2">
                  {cats.map((cat) => renderItem(cat))}
                </div>
              </div>
            ))}
          </>
        )}

        {type !== 'category' && (
          <div className="space-y-2">
            {filteredItems.map((item) => renderItem(item))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    'home': '🏠',
    'building': '🏢',
    'zap': '⚡',
    'droplet': '💧',
    'wifi': '📶',
    'shield': '🛡️',
    'wrench': '🔧',
    'hammer': '🔨',
    'fuel': '⛽',
    'car': '🚗',
    'square-parking': '🅿️',
    'train': '🚆',
    'heart': '❤️',
    'heart-pulse': '💗',
    'pill': '💊',
    'school': '🏫',
    'party-popper': '🎉',
    'shirt': '👕',
    'shopping-cart': '🛒',
    'utensils': '🍽️',
    'gamepad-2': '🎮',
    'repeat': '🔄',
    'landmark': '🏛️',
    'circle-dollar-sign': '💰',
    'piggy-bank': '🐷',
    'banknote': '💵',
    'gift': '🎁',
    'undo-2': '↩️',
    'plus-circle': '➕',
    'building-2': '🏦',
    'credit-card': '💳',
    'wallet': '👛',
    'smartphone': '📱',
  };
  return iconMap[iconName] || '⭕';
}
