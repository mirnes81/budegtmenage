import { format } from 'date-fns';
import { normalizeDescription } from './csvParser';
import { supabase } from './supabase';

export interface TransactionForHash {
  accountId: string;
  date: Date;
  amount: number;
  description: string;
  reference?: string;
  valueDate?: Date;
}

export async function generateLineHash(transaction: TransactionForHash): Promise<string> {
  const normalizedDate = format(transaction.date, 'yyyy-MM-dd');
  const normalizedAmount = transaction.amount.toFixed(2);
  const normalizedDescription = normalizeDescription(transaction.description);
  const normalizedReference = transaction.reference
    ? normalizeDescription(transaction.reference)
    : '';
  const normalizedValueDate = transaction.valueDate
    ? format(transaction.valueDate, 'yyyy-MM-dd')
    : '';

  const composite = [
    transaction.accountId,
    normalizedDate,
    normalizedAmount,
    normalizedDescription,
    normalizedReference,
    normalizedValueDate
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkDuplicateLineHash(lineHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('transactions')
    .select('id')
    .eq('import_line_hash', lineHash)
    .maybeSingle();

  return !!data;
}

export async function checkDuplicateFile(
  accountId: string,
  fileHash: string
): Promise<{ isDuplicate: boolean; importDate?: string; rowsImported?: number }> {
  const { data } = await supabase
    .from('import_files')
    .select('created_at, rows_imported')
    .eq('account_id', accountId)
    .eq('file_hash', fileHash)
    .maybeSingle();

  if (data) {
    return {
      isDuplicate: true,
      importDate: data.created_at,
      rowsImported: data.rows_imported
    };
  }

  return { isDuplicate: false };
}

export async function saveImportFile(params: {
  accountId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  presetUsed?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('import_files')
    .insert({
      account_id: params.accountId,
      file_name: params.fileName,
      file_size: params.fileSize,
      file_hash: params.fileHash,
      rows_total: params.rowsTotal,
      rows_imported: params.rowsImported,
      rows_skipped: params.rowsSkipped,
      preset_used: params.presetUsed
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving import file:', error);
    return null;
  }

  return data.id;
}
