export interface ReceiptExtraction {
  amount: number | null;
  date: string | null;
  merchantRaw: string | null;
  merchantKey: string | null;
  rawTextSnippet: string;
  confidence: number;
}

export interface MerchantRule {
  id: string;
  merchant_key: string;
  merchant_display: string;
  category_id: string | null;
  default_account_id: string | null;
  default_member_id: string | null;
  deduction_type: string | null;
  use_count: number;
}

const SWISS_MERCHANTS: Record<string, { display: string; keywords: string[] }> = {
  COOP: { display: 'Coop', keywords: ['coop'] },
  MIGROS: { display: 'Migros', keywords: ['migros'] },
  MANOR: { display: 'Manor', keywords: ['manor'] },
  ALDI: { display: 'Aldi', keywords: ['aldi'] },
  LIDL: { display: 'Lidl', keywords: ['lidl'] },
  DENNER: { display: 'Denner', keywords: ['denner'] },
  IKEA: { display: 'Ikea', keywords: ['ikea'] },
  JUMBO: { display: 'Jumbo', keywords: ['jumbo'] },
  LANDI: { display: 'Landi', keywords: ['landi'] },
  AMAVITA: { display: 'Amavita', keywords: ['amavita'] },
  SUNSTORE: { display: 'Sun Store', keywords: ['sunstore', 'sun store'] },
  TOPPHARM: { display: 'TopPharm', keywords: ['toppharm', 'top pharm'] },
  APOTHEKE: { display: 'Pharmacie', keywords: ['apotheke', 'pharmacie', 'pharmacy'] },
  SHELL: { display: 'Shell', keywords: ['shell'] },
  ESSO: { display: 'Esso', keywords: ['esso'] },
  BP: { display: 'BP', keywords: ['bp'] },
  TAMOIL: { display: 'Tamoil', keywords: ['tamoil'] },
  AGROLA: { display: 'Agrola', keywords: ['agrola'] },
  SBB: { display: 'SBB CFF FFS', keywords: ['sbb', 'cff', 'ffs', 'sbb cff ffs'] },
  MCDONALD: { display: "McDonald's", keywords: ['mcdonald', 'mcdo'] },
  BURGER_KING: { display: 'Burger King', keywords: ['burger king'] },
  SUBWAY: { display: 'Subway', keywords: ['subway'] },
};

export function normalizeMerchant(merchantRaw: string | null): {
  merchantKey: string | null;
  merchantDisplay: string | null;
  confidence: number;
} {
  if (!merchantRaw || merchantRaw.trim().length === 0) {
    return { merchantKey: null, merchantDisplay: null, confidence: 0 };
  }

  const normalized = merchantRaw
    .toUpperCase()
    .trim()
    .replace(/[0-9]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');

  for (const [key, config] of Object.entries(SWISS_MERCHANTS)) {
    for (const keyword of config.keywords) {
      if (normalized.includes(keyword.toUpperCase())) {
        return {
          merchantKey: key,
          merchantDisplay: config.display,
          confidence: 90,
        };
      }
    }
  }

  const words = normalized.split(' ').filter((w) => w.length > 2);
  if (words.length === 0) {
    return { merchantKey: null, merchantDisplay: null, confidence: 0 };
  }

  const merchantKey = words.slice(0, 2).join('_');
  const merchantDisplay = merchantRaw
    .split(' ')
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    merchantKey,
    merchantDisplay,
    confidence: 40,
  };
}

export function extractAmountFromText(text: string): number | null {
  const lines = text.split('\n');
  const amounts: number[] = [];

  const chfPattern = /(?:CHF|Fr\.?|FS)\s*([0-9]{1,6}[',.]?[0-9]{0,3}\.?[0-9]{2})/gi;
  const totalPattern =
    /(?:TOTAL|MONTANT|SOMME|BETRAG|SUM|AMOUNT)\s*:?\s*([0-9]{1,6}[',.]?[0-9]{0,3}\.?[0-9]{2})/gi;

  for (const line of lines) {
    let match;

    match = totalPattern.exec(line);
    if (match) {
      const amount = parseFloat(match[1].replace(/[',]/g, '').replace(/\./g, '.'));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }

    while ((match = chfPattern.exec(line)) !== null) {
      const amount = parseFloat(match[1].replace(/[',]/g, '').replace(/\./g, '.'));
      if (!isNaN(amount) && amount > 0) {
        amounts.push(amount);
      }
    }
  }

  if (amounts.length > 0) {
    return Math.max(...amounts);
  }

  return null;
}

export function extractDateFromText(text: string): string | null {
  const datePattern = /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/g;
  const matches = text.match(datePattern);

  if (matches && matches.length > 0) {
    const dateStr = matches[0];
    const parts = dateStr.split(/[./-]/);

    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      if (year < 100) {
        year += 2000;
      }

      if (day > 31 && month <= 12) {
        [day, month] = [month, day];
      }

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

export function extractMerchantFromText(text: string): string | null {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) return null;

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length >= 3 && line.length <= 50 && !/^[0-9\s]+$/.test(line)) {
      return line;
    }
  }

  return lines[0];
}

export function extractReceiptInfo(text: string): ReceiptExtraction {
  const amount = extractAmountFromText(text);
  const date = extractDateFromText(text);
  const merchantRaw = extractMerchantFromText(text);
  const { merchantKey, merchantDisplay, confidence } = normalizeMerchant(merchantRaw);

  const snippet = text.substring(0, 1000);

  return {
    amount,
    date,
    merchantRaw: merchantDisplay || merchantRaw,
    merchantKey,
    rawTextSnippet: snippet,
    confidence,
  };
}

export function suggestDeductionType(merchantKey: string | null): string | null {
  if (!merchantKey) return null;

  const healthKeywords = ['AMAVITA', 'SUNSTORE', 'TOPPHARM', 'APOTHEKE'];
  const transportKeywords = ['SBB', 'SHELL', 'ESSO', 'BP', 'TAMOIL', 'AGROLA'];

  if (healthKeywords.some((k) => merchantKey.includes(k))) {
    return 'HEALTH';
  }

  if (transportKeywords.some((k) => merchantKey.includes(k))) {
    return 'TRANSPORT';
  }

  return null;
}
