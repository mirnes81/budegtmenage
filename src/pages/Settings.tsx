import { useState, useEffect } from 'react';
import { Moon, Sun, Key, Database, Download, Upload, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { changePassword } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Database as DatabaseTypes } from '../lib/database.types';

type Category = DatabaseTypes['public']['Tables']['categories']['Row'];

export function Settings() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const logout = useAuthStore(state => state.logout);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('group_name')
        .order('order_index');

      if (error) throw error;
      setCategories(data || []);

      const groups: Record<string, boolean> = {};
      data?.forEach((cat) => {
        const groupName = cat.group_name || 'Autres';
        if (!(groupName in groups)) {
          groups[groupName] = true;
        }
      });
      setExpandedGroups(groups);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleCategoryVisibility = async (categoryId: string, currentHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_hidden: !currentHidden })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, is_hidden: !currentHidden } : cat
        )
      );
    } catch (error) {
      console.error('Erreur mise à jour visibilité:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const success = await changePassword(passwordData.current, passwordData.new);

    if (success) {
      setPasswordSuccess(true);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } else {
      setPasswordError('Mot de passe actuel incorrect');
    }
  };

  const exportData = async () => {
    try {
      const tables = ['members', 'accounts', 'categories', 'transactions', 'recurring_expenses', 'budgets', 'tax_settings'];
      const exportData: any = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        exportData[table] = data;
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('Export réussi!');
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const data = JSON.parse(text);

      if (!confirm('Attention: Cette action va remplacer toutes les données existantes. Continuer?')) {
        return;
      }

      for (const [table, records] of Object.entries(data)) {
        if (table === 'app_users') continue;

        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (Array.isArray(records) && records.length > 0) {
          const { error } = await supabase.from(table).insert(records);
          if (error) throw error;
        }
      }

      alert('Import réussi! Rechargez la page.');
      window.location.reload();
    } catch (error) {
      console.error('Erreur import:', error);
      alert('Erreur lors de l\'import');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>

      <div className="grid gap-6">
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Apparence</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Mode sombre</p>
              <p className="text-xs md:text-sm text-slate-400 truncate">Thème par défaut</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              {darkMode ? 'Sombre' : 'Clair'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Sécurité</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Mot de passe</p>
                <p className="text-xs md:text-sm text-slate-400 truncate">Modifier votre accès</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Key size={18} />
                <span className="hidden sm:inline">Changer</span>
              </button>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Données</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Exporter les données</p>
                <p className="text-xs md:text-sm text-slate-400 truncate">Sauvegarde JSON</p>
              </div>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            </div>
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Importer les données</p>
                <p className="text-xs md:text-sm text-slate-400 truncate">Restaurer sauvegarde</p>
              </div>
              <label className="flex items-center gap-2 px-3 md:px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex-shrink-0">
                <Upload size={18} />
                <span className="hidden sm:inline">Importer</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Format</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xs md:text-sm text-slate-400 truncate">Devise</span>
              <span className="font-medium text-sm whitespace-nowrap flex-shrink-0">CHF</span>
            </div>
            <div className="flex justify-between items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xs md:text-sm text-slate-400 truncate">Format nombres</span>
              <span className="font-medium text-sm whitespace-nowrap flex-shrink-0">3'420.50</span>
            </div>
            <div className="flex justify-between items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xs md:text-sm text-slate-400 truncate">Fuseau horaire</span>
              <span className="font-medium text-sm whitespace-nowrap flex-shrink-0">Europe/Zurich</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Catégories</h2>
          <p className="text-xs md:text-sm text-slate-400 mb-4">
            Gérer la visibilité des catégories. Les catégories masquées n'apparaissent plus dans les listes.
          </p>

          {loadingCategories ? (
            <div className="text-center py-8 text-slate-400">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                categories.reduce((acc, cat) => {
                  const groupName = cat.group_name || 'Autres';
                  if (!acc[groupName]) acc[groupName] = [];
                  acc[groupName].push(cat);
                  return acc;
                }, {} as Record<string, Category[]>)
              ).map(([groupName, groupCategories]) => (
                <div key={groupName} className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedGroups[groupName] ? (
                        <ChevronDown size={20} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={20} className="text-slate-400" />
                      )}
                      <span className="font-semibold text-white">{groupName}</span>
                      <span className="text-sm text-slate-400">
                        ({groupCategories.length})
                      </span>
                    </div>
                  </button>

                  {expandedGroups[groupName] && (
                    <div className="px-4 pb-3 space-y-2">
                      {groupCategories.map((category) => (
                        <div
                          key={category.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg ${
                            category.is_hidden ? 'bg-slate-800/50' : 'bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 overflow-hidden"
                              style={{ backgroundColor: category.color }}
                            >
                              <span className="text-base leading-none">{category.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${category.is_hidden ? 'text-slate-500' : 'text-white'}`}>
                                {category.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {category.type === 'expense' ? 'Dépense' : 'Revenu'}
                                {category.is_hidden && ' • Masquée'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              toggleCategoryVisibility(category.id, category.is_hidden)
                            }
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                              category.is_hidden
                                ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                                : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                            }`}
                            title={category.is_hidden ? 'Afficher' : 'Masquer'}
                          >
                            {category.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">À propos</h2>
          <div className="space-y-2 text-xs md:text-sm">
            <p className="text-slate-400">
              <span className="font-medium text-white">Budget Ménage Suisse</span>
              <br />
              Version 1.0.0
            </p>
            <p className="text-slate-400">
              Application de gestion de budget familial pour les ménages suisses.
            </p>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold">Changer le mot de passe</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirmer nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {passwordError && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
                  Mot de passe modifié avec succès!
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                    setPasswordError('');
                    setPasswordSuccess(false);
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
