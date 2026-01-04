import { useEffect, useState } from 'react';
import { Save, AlertTriangle, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCHF } from '../lib/utils';

const SWISS_CANTONS = [
  { code: 'ZH', name: 'Zurich' },
  { code: 'BE', name: 'Berne' },
  { code: 'LU', name: 'Lucerne' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwald' },
  { code: 'NW', name: 'Nidwald' },
  { code: 'GL', name: 'Glaris' },
  { code: 'ZG', name: 'Zoug' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'SO', name: 'Soleure' },
  { code: 'BS', name: 'Bâle-Ville' },
  { code: 'BL', name: 'Bâle-Campagne' },
  { code: 'SH', name: 'Schaffhouse' },
  { code: 'AR', name: 'Appenzell Rhodes-Extérieures' },
  { code: 'AI', name: 'Appenzell Rhodes-Intérieures' },
  { code: 'SG', name: 'Saint-Gall' },
  { code: 'GR', name: 'Grisons' },
  { code: 'AG', name: 'Argovie' },
  { code: 'TG', name: 'Thurgovie' },
  { code: 'TI', name: 'Tessin' },
  { code: 'VD', name: 'Vaud' },
  { code: 'VS', name: 'Valais' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'GE', name: 'Genève' },
  { code: 'JU', name: 'Jura' },
];

export function Taxes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    postal_code: '',
    municipality: '',
    canton: '',
    marital_status: 'married',
    num_children: 3,
    church_tax: false,
    annual_income: null as number | null,
    deductions: null as number | null,
  });

  const [estimatedIncome, setEstimatedIncome] = useState(0);
  const [taxEstimate, setTaxEstimate] = useState({ low: 0, high: 0, marginalRate: 0 });

  useEffect(() => {
    fetchSettings();
    calculateEstimatedIncome();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          postal_code: data.postal_code || '',
          municipality: data.municipality || '',
          canton: data.canton || '',
          marital_status: data.marital_status,
          num_children: data.num_children,
          church_tax: data.church_tax,
          annual_income: data.annual_income,
          deductions: data.deductions,
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres fiscaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedIncome = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .gte('date', startDate)
        .lte('date', endDate);

      if (transactions) {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0));

        setEstimatedIncome(income);

        const taxableIncome = settings.annual_income || income;
        const deductions = settings.deductions || 0;
        const netIncome = taxableIncome - deductions;

        const federalTax = calculateSimpleFederalTax(netIncome, settings.marital_status, settings.num_children);

        const cantonalTaxRate = 0.08;
        const cantonalTax = netIncome * cantonalTaxRate;

        const municipalTaxRate = 0.04;
        const municipalTax = netIncome * municipalTaxRate;

        const churchTaxAmount = settings.church_tax ? cantonalTax * 0.08 : 0;

        const totalLow = federalTax + cantonalTax + municipalTax + churchTaxAmount;
        const totalHigh = totalLow * 1.15;

        const marginalIncome = netIncome + 1000;
        const marginalFederalTax = calculateSimpleFederalTax(marginalIncome, settings.marital_status, settings.num_children);
        const marginalTotal = marginalFederalTax + (marginalIncome * cantonalTaxRate) + (marginalIncome * municipalTaxRate);
        const marginalRate = ((marginalTotal - totalLow) / 1000) * 100;

        setTaxEstimate({ low: totalLow, high: totalHigh, marginalRate });
      }
    } catch (error) {
      console.error('Erreur calcul revenu estimé:', error);
    }
  };

  const calculateSimpleFederalTax = (income: number, maritalStatus: string, numChildren: number): number => {
    if (income <= 0) return 0;

    const childDeduction = numChildren * 6500;
    const taxableIncome = Math.max(0, income - childDeduction);

    if (taxableIncome <= 17800) return 0;

    let tax = 0;
    if (taxableIncome <= 31600) {
      tax = (taxableIncome - 17800) * 0.01;
    } else if (taxableIncome <= 41400) {
      tax = 138 + (taxableIncome - 31600) * 0.02;
    } else if (taxableIncome <= 55200) {
      tax = 334 + (taxableIncome - 41400) * 0.03;
    } else if (taxableIncome <= 72500) {
      tax = 748 + (taxableIncome - 55200) * 0.04;
    } else if (taxableIncome <= 78100) {
      tax = 1440 + (taxableIncome - 72500) * 0.05;
    } else if (taxableIncome <= 103600) {
      tax = 1720 + (taxableIncome - 78100) * 0.06;
    } else if (taxableIncome <= 134600) {
      tax = 3250 + (taxableIncome - 103600) * 0.07;
    } else if (taxableIncome <= 176000) {
      tax = 5420 + (taxableIncome - 134600) * 0.08;
    } else if (taxableIncome <= 755200) {
      tax = 8732 + (taxableIncome - 176000) * 0.09;
    } else {
      tax = 60840 + (taxableIncome - 755200) * 0.11;
    }

    return maritalStatus === 'married' ? tax * 0.9 : tax;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { data: existing } = await supabase
        .from('tax_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('tax_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_settings')
          .insert([settings]);

        if (error) throw error;
      }

      await calculateEstimatedIncome();
      alert('Paramètres sauvegardés avec succès!');
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold">Estimation Impôts</h1>
        <p className="text-slate-400 mt-1">
          Estimation indicative des impôts en Suisse
        </p>
      </div>

      <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-400 flex-shrink-0" size={24} />
        <div className="text-sm">
          <p className="text-amber-400 font-semibold mb-1">Attention: Estimation simplifiée</p>
          <p className="text-amber-200/80">
            Cette estimation est basée sur des calculs simplifiés et ne remplace pas une déclaration fiscale officielle.
            Les barèmes varient selon le canton et la commune. Consultez un expert fiscal pour une estimation précise.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Calculator className="text-blue-400" size={24} />
          </div>
          <p className="text-slate-400 text-sm mb-2">Revenu annuel estimé</p>
          <p className="text-2xl font-bold">CHF {formatCHF(estimatedIncome)}</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Estimation impôts (fourchette)</p>
          <p className="text-2xl font-bold text-orange-400">
            CHF {formatCHF(taxEstimate.low)} - {formatCHF(taxEstimate.high)}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Taux marginal estimé</p>
          <p className={`text-2xl font-bold ${taxEstimate.marginalRate > 30 ? 'text-red-400' : 'text-green-400'}`}>
            {taxEstimate.marginalRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {taxEstimate.marginalRate > 30 && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <p className="text-red-400 font-semibold">Zone fortement taxée</p>
          <p className="text-red-200/80 text-sm mt-1">
            Votre taux marginal dépasse 30%. Chaque franc supplémentaire gagné est taxé à plus de 30%.
          </p>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-6">Paramètres fiscaux</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">NPA (Code postal)</label>
              <input
                type="text"
                value={settings.postal_code}
                onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Commune</label>
              <input
                type="text"
                value={settings.municipality}
                onChange={(e) => setSettings({ ...settings, municipality: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Lausanne"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Canton</label>
              <select
                value={settings.canton}
                onChange={(e) => setSettings({ ...settings, canton: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {SWISS_CANTONS.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">État civil</label>
              <select
                value={settings.marital_status}
                onChange={(e) => setSettings({ ...settings, marital_status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Célibataire</option>
                <option value="married">Marié(e)</option>
                <option value="divorced">Divorcé(e)</option>
                <option value="widowed">Veuf/Veuve</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre d'enfants</label>
              <input
                type="number"
                min="0"
                value={settings.num_children}
                onChange={(e) => setSettings({ ...settings, num_children: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="church_tax"
              checked={settings.church_tax}
              onChange={(e) => setSettings({ ...settings, church_tax: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="church_tax" className="text-sm">
              Impôt ecclésiastique (facultatif)
            </label>
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <h3 className="font-semibold mb-4">Affinage (optionnel)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Revenu annuel imposable (CHF)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.annual_income || ''}
                  onChange={(e) => setSettings({ ...settings, annual_income: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Laisser vide pour estimation automatique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Déductions totales (CHF)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.deductions || ''}
                  onChange={(e) => setSettings({ ...settings, deductions: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 10000"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Save size={20} />
              {saving ? 'Sauvegarde...' : 'Sauvegarder et recalculer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
