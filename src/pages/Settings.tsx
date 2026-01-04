import { useState } from 'react';
import { Moon, Sun, Key, Database, Download, Upload } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { changePassword } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const logout = useAuthStore(state => state.logout);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <div className="grid gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Apparence</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mode sombre</p>
              <p className="text-sm text-slate-400">Thème par défaut de l'application</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              {darkMode ? 'Sombre' : 'Clair'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Sécurité</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mot de passe</p>
                <p className="text-sm text-slate-400">Modifier votre mot de passe d'accès</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Key size={20} />
                Changer
              </button>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Données</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Exporter les données</p>
                <p className="text-sm text-slate-400">Télécharger une sauvegarde JSON complète</p>
              </div>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Download size={20} />
                Exporter
              </button>
            </div>
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-medium">Importer les données</p>
                <p className="text-sm text-slate-400">Restaurer depuis une sauvegarde</p>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer">
                <Upload size={20} />
                Importer
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Format</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-400">Devise</span>
              <span className="font-medium">CHF (Franc suisse)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-400">Format nombres</span>
              <span className="font-medium">3'420.50 (apostrophe milliers)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-400">Fuseau horaire</span>
              <span className="font-medium">Europe/Zurich</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">À propos</h2>
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">
              <span className="font-medium text-white">Budget Ménage Suisse</span>
              <br />
              Version 1.0.0
            </p>
            <p className="text-slate-400">
              Application de gestion de budget familial conçue pour les ménages suisses.
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
