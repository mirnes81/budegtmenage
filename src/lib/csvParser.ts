import { parse as parseDate, isValid } from 'date-fns';

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
  encoding: string;
}

export interface DetectedFormat {
  delimiter: string;
  dateFormat: string | null;
  decimalSeparator: '.' | ',';
  hasHeader: boolean;
}

export function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  const delimiters = [';', ',', '\t'];

  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
  }));

  counts.sort((a, b) => b.count - a.count);

  return counts[0]?.count > 0 ? counts[0].delimiter : ',';
}

export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8';
  }

  let hasHighBytes = false;
  let validUtf8Sequences = 0;
  let invalidUtf8Sequences = 0;

  for (let i = 0; i < Math.min(bytes.length, 4000); i++) {
    const byte = bytes[i];

    if (byte > 127) {
      hasHighBytes = true;

      if ((byte & 0xE0) === 0xC0) {
        if (i + 1 < bytes.length && (bytes[i + 1] & 0xC0) === 0x80) {
          validUtf8Sequences++;
          i++;
        } else {
          invalidUtf8Sequences++;
        }
      } else if ((byte & 0xF0) === 0xE0) {
        if (i + 2 < bytes.length &&
            (bytes[i + 1] & 0xC0) === 0x80 &&
            (bytes[i + 2] & 0xC0) === 0x80) {
          validUtf8Sequences++;
          i += 2;
        } else {
          invalidUtf8Sequences++;
        }
      } else if ((byte & 0xF8) === 0xF0) {
        if (i + 3 < bytes.length &&
            (bytes[i + 1] & 0xC0) === 0x80 &&
            (bytes[i + 2] & 0xC0) === 0x80 &&
            (bytes[i + 3] & 0xC0) === 0x80) {
          validUtf8Sequences++;
          i += 3;
        } else {
          invalidUtf8Sequences++;
        }
      }
    }
  }

  if (!hasHighBytes) {
    return 'UTF-8';
  }

  if (validUtf8Sequences > 0 && invalidUtf8Sequences === 0) {
    return 'UTF-8';
  }

  if (validUtf8Sequences > invalidUtf8Sequences * 2) {
    return 'UTF-8';
  }

  return 'windows-1252';
}

export function parseCsv(content: string, delimiter: string = ','): CsvParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter, encoding: 'UTF-8' };
  }

  const headers = splitCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map(line => splitCsvLine(line, delimiter));

  return {
    headers,
    rows,
    delimiter,
    encoding: 'UTF-8'
  };
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function detectDateFormat(samples: string[]): string | null {
  const formats = [
    'dd.MM.yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd-MM-yyyy'
  ];

  for (const format of formats) {
    const validCount = samples.filter(sample => {
      try {
        const date = parseDate(sample, format, new Date());
        return isValid(date);
      } catch {
        return false;
      }
    }).length;

    if (validCount / samples.length > 0.8) {
      return format;
    }
  }

  return null;
}

export function detectDecimalSeparator(samples: string[]): '.' | ',' {
  let dotCount = 0;
  let commaCount = 0;

  for (const sample of samples) {
    if (/\d+\.\d{2}$/.test(sample)) dotCount++;
    if (/\d+,\d{2}$/.test(sample)) commaCount++;
  }

  return commaCount > dotCount ? ',' : '.';
}

export function parseAmount(value: string, decimalSeparator: '.' | ',' = '.'): number {
  if (!value || value.trim() === '') return 0;

  let cleaned = value.trim()
    .replace(/[^\d,.\-+]/g, '')
    .replace(/'/g, '');

  if (decimalSeparator === ',') {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function normalizeDescription(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

export function detectFormat(content: string, headers: string[], rows: string[][]): DetectedFormat {
  const delimiter = detectDelimiter(content);

  const dateColumns = headers
    .map((h, i) => ({ header: h.toLowerCase(), index: i }))
    .filter(({ header }) =>
      header.includes('date') ||
      header.includes('datum') ||
      header.includes('data')
    );

  let dateFormat: string | null = null;
  if (dateColumns.length > 0 && rows.length > 0) {
    const dateSamples = rows
      .slice(0, 10)
      .map(row => row[dateColumns[0].index])
      .filter(Boolean);
    dateFormat = detectDateFormat(dateSamples);
  }

  const amountColumns = headers
    .map((h, i) => ({ header: h.toLowerCase(), index: i }))
    .filter(({ header }) =>
      header.includes('amount') ||
      header.includes('montant') ||
      header.includes('betrag') ||
      header.includes('debit') ||
      header.includes('credit')
    );

  let decimalSeparator: '.' | ',' = '.';
  if (amountColumns.length > 0 && rows.length > 0) {
    const amountSamples = rows
      .slice(0, 10)
      .map(row => row[amountColumns[0].index])
      .filter(Boolean);
    decimalSeparator = detectDecimalSeparator(amountSamples);
  }

  return {
    delimiter,
    dateFormat,
    decimalSeparator,
    hasHeader: true
  };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }

      const buffer = e.target.result as ArrayBuffer;
      const encoding = detectEncoding(buffer);

      const decoder = new TextDecoder(encoding);
      const text = decoder.decode(buffer);

      resolve(text);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
