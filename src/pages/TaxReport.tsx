import { useEffect, useState } from 'react';
import { Download, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';
import {
  getDeductionsByYear,
  aggregateDeductionsByType,
  calculateHealthDeductionThreshold,
  DeductionType,
  DEDUCTION_LABELS,
} from '../lib/taxDeductions';

export function TaxReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totals, setTotals] = useState<Record<DeductionType, number> | null>(null);
  const [estimatedIncome, setEstimatedIncome] = useState<number>(0);

  useEffect(() => {
    loadDeductions();
  }, [selectedYear]);

  const loadDeductions = async () => {
    setLoading(true);
    try {
      const data = await getDeductionsByYear(selectedYear);
      setTransactions(data);

      const aggregated = aggregateDeductionsByType(data);
      setTotals(aggregated);

      await estimateIncome();
    } catch (error) {
      console.error('Error loading deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateIncome = async () => {
    try {
      const { data: incomeTransactions, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('tax_year', selectedYear)
        .eq('type', 'income');

      if (error) throw error;

      const totalIncome = (incomeTransactions || []).reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );

      setEstimatedIncome(totalIncome);
    } catch (error) {
      console.error('Error estimating income:', error);
    }
  };

  const exportCSV = () => {
    if (!totals || transactions.length === 0) return;

    const headers = ['Date', 'Description', 'Catégorie', 'Montant', 'Type de déduction'];
    const rows = transactions.map((t) => [
      t.date,
      t.description,
      t.categories?.name || '',
      formatCHF(Math.abs(t.amount)),
      DEDUCTION_LABELS[t.deduction_type as DeductionType],
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `deductions-fiscales-${selectedYear}.csv`;
    link.click();
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const healthThreshold = calculateHealthDeductionThreshold(estimatedIncome);
  const healthTotal = totals?.HEALTH || 0;
  const healthDeductible = Math.max(0, healthTotal - healthThreshold);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Rapport Fiscal (VD)</h1>

        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-300 mb-1">Estimation indicative uniquement</p>
            <p className="text-sm text-amber-200">
              Ce rapport est une estimation basée sur vos transactions et les règles fiscales du
              canton de Vaud. Il ne remplace pas les conseils d'un fiscaliste. Les montants
              déductibles dépendent de votre situation personnelle et des justificatifs fournis.
            </p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
          <p className="text-slate-400 text-lg mb-2">Aucune déduction confirmée pour {selectedYear}</p>
          <p className="text-slate-500 text-sm">
            Les déductions apparaissent ici une fois confirmées lors de la saisie de transactions
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Revenu estimé (année)</p>
              <p className="text-3xl font-bold text-white">CHF {formatCHF(estimatedIncome)}</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Déductions totales</p>
              <p className="text-3xl font-bold text-green-400">
                CHF{' '}
                {formatCHF(
                  Object.entries(totals || {}).reduce(
                    (sum, [key, val]) => (key !== 'NONE' ? sum + val : sum),
                    0
                  )
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Déductions par catégorie</h2>

            <div className="space-y-4">
              {totals?.HEALTH && totals.HEALTH > 0 && (
                <div className="border border-slate-600 rounded-lg p-4 bg-slate-750">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">{DEDUCTION_LABELS.HEALTH}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Frais de santé après franchise de 5% du revenu net
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">CHF {formatCHF(healthTotal)}</p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300">Total frais de santé:</span>
                      <span className="font-medium text-blue-200">CHF {formatCHF(healthTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300">Franchise (5% revenu):</span>
                      <span className="font-medium text-blue-200">
                        - CHF {formatCHF(healthThreshold)}
                      </span>
                    </div>
                    <div className="border-t border-blue-700/30 pt-2 flex justify-between">
                      <span className="font-semibold text-blue-200">Montant déductible:</span>
                      <span className="font-bold text-blue-400">
                        CHF {formatCHF(healthDeductible)}
                      </span>
                    </div>
                  </div>

                  {healthDeductible === 0 && (
                    <div className="mt-2 flex items-start gap-2">
                      <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">
                        Les frais de santé n'atteignent pas la franchise minimale
                      </p>
                    </div>
                  )}
                </div>
              )}

              {Object.entries(totals || {}).map(([type, amount]) => {
                if (type === 'NONE' || type === 'HEALTH' || amount === 0) return null;

                return (
                  <div
                    key={type}
                    className="border border-slate-600 rounded-lg p-4 flex justify-between items-center bg-slate-750"
                  >
                    <div>
                      <p className="font-semibold text-lg">
                        {DEDUCTION_LABELS[type as DeductionType]}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {type === 'CHILDCARE' &&
                          'Max CHF 10\'100 par enfant si les deux parents travaillent (VD)'}
                        {type === 'MORTGAGE_INTEREST' && 'Intérêts uniquement, pas le capital'}
                        {type === 'PROPERTY_MAINTENANCE' &&
                          'Entretien déductible, pas les améliorations'}
                        {type === 'DONATION' && 'CHF 100 minimum à 20% du revenu net max (VD)'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">CHF {formatCHF(amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Transactions détaillées</h2>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center p-3 bg-slate-750 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(t.date).toLocaleDateString('fr-CH')} •{' '}
                      {DEDUCTION_LABELS[t.deduction_type as DeductionType]}
                    </p>
                  </div>
                  <p className="font-bold text-blue-400">CHF {formatCHF(Math.abs(t.amount))}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
