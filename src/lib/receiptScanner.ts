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
  const lines = text.split('\n').map(l => l.trim());
  const amounts: { value: number; priority: number; line: string }[] = [];

  // Patterns pour les totaux (priorité haute)
  const totalPatterns = [
    /(?:TOTAL|MONTANT|SOMME|BETRAG|SUMME|SUM|AMOUNT|GESAMT|ZAHLEN|PAYER|A\s*PAYER|TO\s*PAY)\s*:?\s*(?:CHF|Fr\.?|FS|€|EUR)?\s*([0-9]{1,6}[\s',.]?[0-9]{0,3}[.,][0-9]{2})/gi,
    /(?:CHF|Fr\.?|FS|€|EUR)\s*([0-9]{1,6}[\s',.]?[0-9]{0,3}[.,][0-9]{2})\s*(?:TOTAL|MONTANT|SOMME|BETRAG)/gi,
  ];

  // Patterns pour les montants avec devise (priorité moyenne)
  const currencyPatterns = [
    /(?:CHF|Fr\.?|FS|€|EUR)\s*([0-9]{1,6}[\s',.]?[0-9]{0,3}[.,][0-9]{2})/gi,
    /([0-9]{1,6}[\s',.]?[0-9]{0,3}[.,][0-9]{2})\s*(?:CHF|Fr\.?|FS|€|EUR)/gi,
  ];

  // Pattern général pour les montants (priorité basse)
  const generalPattern = /\b([0-9]{1,6}[\s',.]?[0-9]{0,3}[.,][0-9]{2})\b/g;

  // Recherche des totaux en priorité
  for (const line of lines) {
    const lineUpper = line.toUpperCase();

    // Vérifier si la ligne contient un mot-clé de total
    if (/TOTAL|MONTANT|SOMME|BETRAG|SUMME|ZAHLEN|PAYER|A\s*PAYER|TO\s*PAY|GESAMT/i.test(lineUpper)) {
      for (const pattern of totalPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const cleanAmount = match[1].replace(/[\s',]/g, '').replace(',', '.');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount) && amount > 0 && amount < 100000) {
            amounts.push({ value: amount, priority: 100, line });
          }
        }
      }
    }
  }

  // Si on a trouvé un total, le retourner
  if (amounts.length > 0) {
    return amounts.sort((a, b) => b.priority - a.priority)[0].value;
  }

  // Chercher les montants avec devise
  for (const line of lines) {
    for (const pattern of currencyPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const cleanAmount = match[1].replace(/[\s',]/g, '').replace(',', '.');
        const amount = parseFloat(cleanAmount);
        if (!isNaN(amount) && amount > 0 && amount < 100000) {
          amounts.push({ value: amount, priority: 50, line });
        }
      }
    }
  }

  // Si on a trouvé des montants avec devise, prendre le plus grand
  if (amounts.length > 0) {
    const sorted = amounts.sort((a, b) => b.value - a.value);
    return sorted[0].value;
  }

  // Dernier recours: chercher des patterns numériques généraux
  for (const line of lines) {
    generalPattern.lastIndex = 0;
    let match;
    while ((match = generalPattern.exec(line)) !== null) {
      const cleanAmount = match[1].replace(/[\s',]/g, '').replace(',', '.');
      const amount = parseFloat(cleanAmount);
      if (!isNaN(amount) && amount > 0.50 && amount < 100000) {
        amounts.push({ value: amount, priority: 10, line });
      }
    }
  }

  if (amounts.length > 0) {
    const sorted = amounts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.value - a.value;
    });
    return sorted[0].value;
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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return null;

  // Mots à ignorer (communs sur les tickets mais pas des noms de magasins)
  const ignoreWords = /^(ticket|reçu|receipt|kassenbon|bon|caisse|magasin|filiale|succursale|tel|fax|email|www|http|date|heure|time|merci|danke|thank|bienvenue|welcome|\d+)$/i;

  // Patterns à éviter (lignes qui contiennent ces éléments ne sont probablement pas le nom)
  const avoidPatterns = [
    /^\d+$/,                           // Uniquement des chiffres
    /^[0-9\s\-\.\(\)\/]+$/,           // Numéros de téléphone, dates
    /^\*+$/,                           // Séparateurs
    /^[\-=_]+$/,                       // Séparateurs
    /TVA|VAT|MWST|TAX/i,              // Lignes de taxes
    /^\s*$/,                           // Lignes vides
    /@|\.com|\.ch|\.fr|\.de/i,        // Emails/sites web
  ];

  const candidates: { text: string; score: number; index: number }[] = [];

  // Analyser les 10 premières lignes
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();

    // Ignorer les lignes trop courtes ou trop longues
    if (line.length < 2 || line.length > 60) continue;

    // Ignorer les patterns à éviter
    if (avoidPatterns.some(pattern => pattern.test(line))) continue;

    // Ignorer les mots à ignorer
    if (ignoreWords.test(line)) continue;

    let score = 0;

    // Plus de points si c'est dans les premières lignes
    score += (10 - i) * 10;

    // Plus de points si la ligne contient des mots connus de marchands suisses
    const lineUpper = line.toUpperCase();
    const knownMerchants = Object.keys(SWISS_MERCHANTS);
    for (const merchant of knownMerchants) {
      if (lineUpper.includes(merchant)) {
        score += 100;
        break;
      }
    }

    // Plus de points si la ligne contient des lettres majuscules (noms de magasins souvent en caps)
    const upperCount = (line.match(/[A-Z]/g) || []).length;
    if (upperCount >= line.length * 0.5) {
      score += 20;
    }

    // Moins de points si beaucoup de chiffres
    const digitCount = (line.match(/[0-9]/g) || []).length;
    if (digitCount > line.length * 0.3) {
      score -= 30;
    }

    // Plus de points si longueur raisonnable pour un nom de magasin
    if (line.length >= 3 && line.length <= 25) {
      score += 15;
    }

    // Moins de points si contient des symboles étranges
    if (/[<>{}[\]\\|~`]/.test(line)) {
      score -= 20;
    }

    // Plus de points si contient des espaces (noms composés comme "Manor Food")
    const wordCount = line.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 4) {
      score += 10;
    }

    candidates.push({ text: line, score, index: i });
  }

  // Trier par score
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index; // En cas d'égalité, prendre le plus haut
  });

  if (candidates.length > 0 && candidates[0].score > 0) {
    return candidates[0].text;
  }

  // Fallback: première ligne non vide
  return lines[0] || null;
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
