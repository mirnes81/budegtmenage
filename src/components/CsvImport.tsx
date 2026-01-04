import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { parse as parseDate } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  readFileAsText,
  parseCsv,
  detectFormat,
  parseAmount,
  generateFileHash
} from '../lib/csvParser';
import {
  loadBankPresets,
  detectPreset,
  mapColumns,
  validateMapping,
  type BankPreset,
  type ColumnMapping
} from '../lib/bankPresets';
import {
  generateLineHash,
  checkDuplicateFile
} from '../lib/importDeduplication';
import {
  normalizeMerchant,
  extractMerchantFromUBS
} from '../lib/bankDescriptionCleaner';
import QuickCategorization from './QuickCategorization';

type Step = 'upload' | 'detect' | 'mapping' | 'result' | 'categorize';

interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  delimiter: string;
  dateFormat: string | null;
  decimalSeparator: '.' | ',';
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Member {
  id: string;
  name: string;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

interface CsvImportProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CsvImport({ onClose, onSuccess }: CsvImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [csvData, setCsvData] = useState<ParsedCsvData | null>(null);
  const [detectedPreset, setDetectedPreset] = useState<BankPreset | null>(null);
  const [allPresets, setAllPresets] = useState<BankPreset[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    description: null,
    description2: null,
    description3: null,
    amount: null,
    debit: null,
    credit: null,
    currency: null,
    balance: null,
    valueDate: null,
    reference: null
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [applyMerchantRules, setApplyMerchantRules] = useState(true);
  const [saveMapping, setSaveMapping] = useState(true);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileId, setImportFileId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [duplicateFileWarning, setDuplicateFileWarning] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const presets = await loadBankPresets();
    setAllPresets(presets);

    const { data: accountsData } = await supabase
      .from('accounts')
      .select('id, name, type')
      .order('order_index');

    const { data: membersData } = await supabase
      .from('members')
      .select('id, name')
      .order('order_index');

    if (accountsData) setAccounts(accountsData);
    if (membersData) {
      setMembers(membersData);
      const household = membersData.find(m => m.name === 'Ménage');
      if (household) setSelectedMember(household.id);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
  }

  async function handleAnalyze() {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const hash = await generateFileHash(file);
      setFileHash(hash);

      if (selectedAccount) {
        const duplicateCheck = await checkDuplicateFile(selectedAccount, hash);
        if (duplicateCheck.isDuplicate) {
          const date = duplicateCheck.importDate
            ? format(new Date(duplicateCheck.importDate), 'dd.MM.yyyy HH:mm')
            : 'unknown date';
          setDuplicateFileWarning(
            `This file was already imported on ${date} (${duplicateCheck.rowsImported} rows). Continue to skip duplicates.`
          );
        }
      }

      const content = await readFileAsText(file);
      const delimiter = content.includes(';') ? ';' : ',';
      const parsed = parseCsv(content, delimiter);

      if (parsed.headers.length === 0) {
        setError('No headers found in CSV file');
        setLoading(false);
        return;
      }

      const detected = detectFormat(content, parsed.headers, parsed.rows);

      setCsvData({
        headers: parsed.headers,
        rows: parsed.rows.slice(0, 20),
        delimiter: detected.delimiter,
        dateFormat: detected.dateFormat,
        decimalSeparator: detected.decimalSeparator
      });

      const preset = detectPreset(parsed.headers, allPresets);
      setDetectedPreset(preset);

      if (preset) {
        const autoMapping = mapColumns(parsed.headers, preset);
        setMapping(autoMapping);
      }

      setStep('detect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze file');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file || !csvData || !selectedAccount || !selectedMember) return;

    const validation = validateMapping(mapping);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const content = await readFileAsText(file);
      const parsed = parseCsv(content, csvData.delimiter);

      const dateIndex = csvData.headers.indexOf(mapping.date!);
      const descIndex = csvData.headers.indexOf(mapping.description!);
      const desc2Index = mapping.description2 ? csvData.headers.indexOf(mapping.description2) : -1;
      const desc3Index = mapping.description3 ? csvData.headers.indexOf(mapping.description3) : -1;
      const amountIndex = mapping.amount ? csvData.headers.indexOf(mapping.amount) : -1;
      const debitIndex = mapping.debit ? csvData.headers.indexOf(mapping.debit) : -1;
      const creditIndex = mapping.credit ? csvData.headers.indexOf(mapping.credit) : -1;

      let fallbackCategoryId: string | null = null;
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categories && categories.length > 0) {
        const diversCategory = categories.find(c =>
          c.name.toLowerCase() === 'divers' ||
          c.name.toLowerCase() === 'autres' ||
          c.name.toLowerCase() === 'other'
        );
        fallbackCategoryId = diversCategory?.id || categories[0].id;
      }

      if (!fallbackCategoryId) {
        setError('No categories found. Please create at least one category first.');
        setLoading(false);
        return;
      }

      const { data: keywordRules } = await supabase
        .from('keyword_rules')
        .select('pattern, category_id, priority')
        .eq('is_active', true)
        .order('priority');

      const { data: importFileRecord, error: importFileError } = await supabase
        .from('import_files')
        .insert({
          account_id: selectedAccount,
          file_name: file.name,
          file_size: file.size,
          file_hash: fileHash,
          rows_total: parsed.rows.length,
          rows_imported: 0,
          rows_skipped: 0,
          preset_used: detectedPreset?.name
        })
        .select()
        .single();

      if (importFileError || !importFileRecord) {
        setError('Failed to create import record: ' + (importFileError?.message || 'Unknown error'));
        setLoading(false);
        return;
      }

      const fileId = importFileRecord.id;
      setImportFileId(fileId);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];

        try {
          const dateStr = row[dateIndex];
          if (!dateStr) {
            skipped++;
            continue;
          }

          const date = parseDate(dateStr, csvData.dateFormat || 'dd.MM.yyyy', new Date());

          let amount = 0;
          if (amountIndex >= 0 && row[amountIndex]) {
            amount = parseAmount(row[amountIndex], csvData.decimalSeparator);
          } else {
            const debitValue = debitIndex >= 0 && row[debitIndex]
              ? parseAmount(row[debitIndex], csvData.decimalSeparator)
              : 0;
            const creditValue = creditIndex >= 0 && row[creditIndex]
              ? parseAmount(row[creditIndex], csvData.decimalSeparator)
              : 0;

            if (creditValue !== 0) {
              amount = creditValue;
            } else if (debitValue !== 0) {
              amount = -Math.abs(debitValue);
            }
          }

          if (amount === 0) {
            skipped++;
            continue;
          }

          const descParts = [
            row[descIndex] || '',
            desc2Index >= 0 ? row[desc2Index] || '' : '',
            desc3Index >= 0 ? row[desc3Index] || '' : ''
          ];

          const rawDescription = descParts.filter(part => part.trim()).join(' ');

          const cleanedDescription = extractMerchantFromUBS(
            descParts[0] || '',
            descParts[1] || '',
            descParts[2] || ''
          );

          const description = cleanedDescription || 'Unknown';

          const lineHash = await generateLineHash({
            accountId: selectedAccount,
            date,
            amount,
            description
          });

          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('import_line_hash', lineHash)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }

          let categoryId = fallbackCategoryId;

          if (applyMerchantRules) {
            const merchantKey = normalizeMerchant(description);
            const { data: rule } = await supabase
              .from('merchant_rules')
              .select('default_category_id')
              .ilike('merchant_key', `%${merchantKey.slice(0, 30)}%`)
              .maybeSingle();

            if (rule?.default_category_id) {
              categoryId = rule.default_category_id;
            }
          }

          if (categoryId === fallbackCategoryId && keywordRules && keywordRules.length > 0) {
            const textToSearch = (description + ' ' + rawDescription).toLowerCase();

            for (const rule of keywordRules) {
              const pattern = rule.pattern.toLowerCase();
              if (textToSearch.includes(pattern)) {
                categoryId = rule.category_id;
                break;
              }
            }
          }

          const { error: insertError } = await supabase
            .from('transactions')
            .insert({
              date: format(date, 'yyyy-MM-dd'),
              amount,
              type: amount >= 0 ? 'income' : 'expense',
              description,
              category_id: categoryId,
              account_id: selectedAccount,
              member_id: selectedMember,
              import_source: 'CSV',
              import_line_hash: lineHash,
              import_file_id: fileId
            });

          if (insertError) {
            errors.push(`Row ${i + 2}: ${insertError.message}`);
            skipped++;
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          skipped++;
        }
      }

      await supabase
        .from('import_files')
        .update({
          rows_imported: imported,
          rows_skipped: skipped
        })
        .eq('id', fileId);

      setImportResult({
        total: parsed.rows.length,
        imported,
        skipped,
        errors
      });

      setStep('categorize');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    onSuccess?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Import CSV Bank Statement</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {(['upload', 'detect', 'mapping', 'result'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : i < ['upload', 'detect', 'mapping', 'result'].indexOf(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && <div className="w-16 h-0.5 bg-slate-700 mx-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>Upload</span>
            <span>Detect</span>
            <span>Mapping</span>
            <span>Result</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <UploadStep
              file={file}
              accounts={accounts}
              selectedAccount={selectedAccount}
              onFileSelect={handleFileSelect}
              onAccountChange={setSelectedAccount}
              onAnalyze={handleAnalyze}
              loading={loading}
              error={error}
            />
          )}

          {step === 'detect' && csvData && (
            <DetectStep
              csvData={csvData}
              preset={detectedPreset}
              duplicateWarning={duplicateFileWarning}
              onNext={() => setStep('mapping')}
            />
          )}

          {step === 'mapping' && csvData && (
            <MappingStep
              headers={csvData.headers}
              mapping={mapping}
              members={members}
              selectedMember={selectedMember}
              applyMerchantRules={applyMerchantRules}
              saveMapping={saveMapping}
              onMappingChange={setMapping}
              onMemberChange={setSelectedMember}
              onApplyMerchantRulesChange={setApplyMerchantRules}
              onSaveMappingChange={setSaveMapping}
              onImport={handleImport}
              loading={loading}
              error={error}
            />
          )}

          {step === 'result' && importResult && (
            <ResultStep result={importResult} onFinish={handleFinish} />
          )}

          {step === 'categorize' && (
            <div className="text-center text-white">
              <p>Import complete! Loading categorization...</p>
            </div>
          )}
        </div>
      </div>

      {step === 'categorize' && importFileId && (
        <QuickCategorization
          importFileId={importFileId}
          onClose={() => setStep('result')}
          onComplete={() => {
            onSuccess?.();
            setStep('result');
          }}
        />
      )}
    </div>
  );
}

function UploadStep({
  file,
  accounts,
  selectedAccount,
  onFileSelect,
  onAccountChange,
  onAnalyze,
  loading,
  error
}: {
  file: File | null;
  accounts: Account[];
  selectedAccount: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAccountChange: (id: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Selectionner le compte
        </label>
        {accounts.length === 0 ? (
          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-200 mb-2">
              Vous n'avez pas encore de compte. Creez d'abord un compte pour continuer.
            </p>
            <a
              href="/accounts"
              className="inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Aller a la page Comptes →
            </a>
          </div>
        ) : (
          <select
            value={selectedAccount}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-white"
          >
            <option value="">Choisir un compte...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Selectionner le fichier CSV
        </label>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <input
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium"
          >
            Choisir un fichier
          </label>
          <p className="text-sm text-slate-400 mt-2">ou glisser-deposer</p>
        </div>

        {file && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-sm text-slate-400">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!file || !selectedAccount || loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading ? 'Analyse en cours...' : 'Analyser le fichier'}
      </button>
    </div>
  );
}

function DetectStep({
  csvData,
  preset,
  duplicateWarning,
  onNext
}: {
  csvData: ParsedCsvData;
  preset: BankPreset | null;
  duplicateWarning: string;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-100 mb-2">Detection Results</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-300">Delimiter:</span>
            <span className="font-mono text-blue-100">{csvData.delimiter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Date Format:</span>
            <span className="font-mono text-blue-100">{csvData.dateFormat || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Decimal Separator:</span>
            <span className="font-mono text-blue-100">{csvData.decimalSeparator}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Bank Preset:</span>
            <span className="font-semibold text-blue-100">{preset?.name || 'Generic'}</span>
          </div>
        </div>
      </div>

      {duplicateWarning && (
        <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-300">{duplicateWarning}</p>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2 text-white">Preview (first 20 rows)</h3>
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="min-w-full divide-y divide-slate-700 text-sm">
            <thead className="bg-slate-800">
              <tr>
                {csvData.headers.map((header, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium text-slate-300">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-900">
              {csvData.rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-100">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Next: Configure Mapping
      </button>
    </div>
  );
}

function MappingStep({
  headers,
  mapping,
  members,
  selectedMember,
  applyMerchantRules,
  saveMapping,
  onMappingChange,
  onMemberChange,
  onApplyMerchantRulesChange,
  onSaveMappingChange,
  onImport,
  loading,
  error
}: {
  headers: string[];
  mapping: ColumnMapping;
  members: Member[];
  selectedMember: string;
  applyMerchantRules: boolean;
  saveMapping: boolean;
  onMappingChange: (mapping: ColumnMapping) => void;
  onMemberChange: (id: string) => void;
  onApplyMerchantRulesChange: (value: boolean) => void;
  onSaveMappingChange: (value: boolean) => void;
  onImport: () => void;
  loading: boolean;
  error: string;
}) {
  const validation = validateMapping(mapping);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4 text-white">Column Mapping</h3>
        <div className="space-y-3">
          {Object.entries(mapping).map(([field, value]) => (
            <div key={field} className="flex items-center gap-3">
              <label className="w-32 text-sm font-medium text-slate-300 capitalize">
                {field.replace(/([A-Z])/g, ' $1').trim()}
                {['date', 'description'].includes(field) && (
                  <span className="text-red-400">*</span>
                )}
              </label>
              <select
                value={value || ''}
                onChange={(e) =>
                  onMappingChange({ ...mapping, [field]: e.target.value || null })
                }
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-white"
              >
                <option value="">Not mapped</option>
                {headers.map(header => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {!validation.valid && (
          <div className="mt-3 text-sm text-red-400">
            {validation.errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Default Member
          </label>
          <select
            value={selectedMember}
            onChange={(e) => onMemberChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-white"
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={applyMerchantRules}
            onChange={(e) => onApplyMerchantRulesChange(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-300">Apply merchant rules (auto-categorize)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={saveMapping}
            onChange={(e) => onSaveMappingChange(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-300">Remember this mapping</span>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <button
        onClick={onImport}
        disabled={!validation.valid || loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading ? 'Importing...' : 'Import Transactions'}
      </button>
    </div>
  );
}

function ResultStep({ result, onFinish }: { result: ImportResult; onFinish: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/20 rounded-full">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">Import Complete</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
            <span className="text-slate-300">Total Rows:</span>
            <span className="font-semibold text-white">{result.total}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-900/20 rounded-lg">
            <span className="text-green-300">Imported:</span>
            <span className="font-semibold text-green-100">{result.imported}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-900/20 rounded-lg">
            <span className="text-yellow-300">Skipped (duplicates):</span>
            <span className="font-semibold text-yellow-100">{result.skipped}</span>
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="text-left">
          <h4 className="font-medium text-red-100 mb-2">Errors:</h4>
          <div className="max-h-40 overflow-y-auto bg-red-900/20 border border-red-700 rounded-lg p-3 text-sm text-red-200">
            {result.errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onFinish}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Done
      </button>
    </div>
  );
}
