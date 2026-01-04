import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TestAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadAccounts() {
      try {
        console.log('Starting to load accounts...');

        const { data, error: queryError } = await supabase
          .from('accounts')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        console.log('Query result:', { data, queryError });

        if (queryError) {
          console.error('Query error:', queryError);
          setError(`Erreur: ${queryError.message}`);
        } else if (data) {
          console.log('Accounts loaded successfully:', data);
          setAccounts(data);
        } else {
          console.warn('No data returned');
          setError('Aucune donnée retournée');
        }
      } catch (err) {
        console.error('Catch error:', err);
        setError(`Exception: ${err}`);
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test de chargement des comptes</h1>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800">Chargement en cours...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="font-bold text-red-800 mb-2">Erreur:</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && accounts.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">Aucun compte trouvé</p>
          </div>
        )}

        {!loading && accounts.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h2 className="font-bold text-green-800 mb-2">
              ✓ {accounts.length} compte(s) chargé(s) avec succès
            </h2>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actif
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {account.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.is_active ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Ouvre la console du navigateur (F12)</li>
            <li>Regarde les logs dans l'onglet "Console"</li>
            <li>Vérifie les messages de debug</li>
            <li>Prends une capture d'écran si tu vois des erreurs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
