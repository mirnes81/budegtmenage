const STOP_TOKENS = [
  'No de transaction',
  'IBAN',
  'Motif du paiement',
  'Reference',
  'QRR',
  'Account no.',
  'Coûts:',
  'BIC/BC:',
  'Montant payé:',
  'Exchange rate:',
  'Paiement carte de debit',
  'Retrait au Bancomat',
  'Remboursement carte de debit'
];

export function cleanBankDescription(text: string): string {
  if (!text) return '';

  let cleaned = text.trim();

  const semicolonIndex = cleaned.indexOf(';');
  if (semicolonIndex > 0) {
    cleaned = cleaned.substring(0, semicolonIndex);
  }

  for (const token of STOP_TOKENS) {
    const index = cleaned.indexOf(token);
    if (index > 0) {
      cleaned = cleaned.substring(0, index);
      break;
    }
  }

  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/[;-]+$/, '')
    .trim();

  return cleaned;
}

export function normalizeMerchant(description: string): string {
  let normalized = description.toUpperCase().trim();

  normalized = normalized.replace(/\d+/g, '');

  normalized = normalized.replace(/\b\d{4}\b/g, '');

  const cityPatterns = [
    /\b\d{4}\s+[A-Z-]+$/,
    /\b[A-Z-]+\s+\d{4}$/,
    /\sCH$/,
    /\sIT\s/,
    /\sDE\s/,
    /\sFR\s/,
    /\sBA\s/,
    /\sGB$/
  ];

  for (const pattern of cityPatterns) {
    normalized = normalized.replace(pattern, '');
  }

  normalized = normalized
    .replace(/\s+/g, ' ')
    .replace(/[,;.-]+$/, '')
    .trim();

  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  if (words.length === 0) return normalized;
  if (words.length === 1) return words[0];
  if (words.length === 2) return words.join(' ');

  return words.slice(0, 2).join(' ');
}

interface CategoryRule {
  keywords: string[];
  categoryName: string;
  priority: number;
}

const SWISS_CATEGORY_RULES: CategoryRule[] = [
  {
    keywords: ['salaire', 'salary', 'lohn', 'paie'],
    categoryName: 'Revenus',
    priority: 1
  },
  {
    keywords: ['credit référence qr', 'versement', 'bonification', 'virement recu'],
    categoryName: 'Revenus',
    priority: 2
  },
  {
    keywords: ['solde décompte', 'décompte des prix'],
    categoryName: 'Frais bancaires',
    priority: 1
  },
  {
    keywords: ['frais', 'coûts', 'e-banking', 'banking fee'],
    categoryName: 'Frais bancaires',
    priority: 2
  },
  {
    keywords: ['migros', 'coop', 'aldi', 'lidl', 'denner', 'manor food', 'spar'],
    categoryName: 'Courses',
    priority: 1
  },
  {
    keywords: ['station', 'eni', 'shell', 'bp', 'esso', 'avanti', 'tamoil', 'essence'],
    categoryName: 'Transports',
    priority: 1
  },
  {
    keywords: ['sbb', 'cff', 'ffs', 'tl', 'tpg', 'postbus', 'carpostal'],
    categoryName: 'Transports',
    priority: 1
  },
  {
    keywords: ['pharmacie', 'amavita', 'benu', 'apotheke', 'sun store', 'santé'],
    categoryName: 'Santé',
    priority: 1
  },
  {
    keywords: ['fedex', 'dhl', 'post', 'livraison', 'courrier'],
    categoryName: 'Services',
    priority: 1
  },
  {
    keywords: ['assurance', 'insurance', 'versicherung', 'baloise', 'axa', 'zurich', 'vaudoise'],
    categoryName: 'Assurances',
    priority: 1
  },
  {
    keywords: ['loyer', 'miete', 'rent', 'immobilier'],
    categoryName: 'Logement',
    priority: 1
  },
  {
    keywords: ['restaurant', 'cafe', 'pizza', 'mcdonalds', 'burger'],
    categoryName: 'Restaurants',
    priority: 1
  },
  {
    keywords: ['landi', 'hornbach', 'baumarkt', 'bricolage', 'obi', 'jumbo'],
    categoryName: 'Maison',
    priority: 1
  },
  {
    keywords: ['bmw', 'garage', 'auto', 'voiture', 'vehicle'],
    categoryName: 'Transports',
    priority: 1
  },
  {
    keywords: ['credit'],
    categoryName: 'Revenus',
    priority: 3
  }
];

export function categorizeBySuissKeywords(
  description: string,
  fullText: string = ''
): string | null {
  const textToAnalyze = (description + ' ' + fullText).toLowerCase();

  let bestMatch: { categoryName: string; priority: number } | null = null;

  for (const rule of SWISS_CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (textToAnalyze.includes(keyword)) {
        if (!bestMatch || rule.priority < bestMatch.priority) {
          bestMatch = { categoryName: rule.categoryName, priority: rule.priority };
        }
        break;
      }
    }
  }

  return bestMatch?.categoryName || null;
}

export function extractMerchantFromUBS(
  description1: string,
  description2: string,
  description3: string
): string {
  const parts = [description1, description2, description3]
    .filter(Boolean)
    .map(s => s.trim());

  if (parts.length === 0) return 'Unknown';

  const genericTerms = [
    'ordre global e-banking',
    'ordre e-banking',
    'paiement instantané',
    'credit référence qr',
    'divers ordres permanents',
    'solde décompte'
  ];

  for (const part of parts) {
    const cleaned = cleanBankDescription(part);
    if (cleaned && cleaned.length > 3) {
      const isGeneric = genericTerms.some(term =>
        cleaned.toLowerCase().includes(term)
      );

      if (!isGeneric) {
        return cleaned;
      }
    }
  }

  const mainDescription = cleanBankDescription(parts[0]);
  return mainDescription || parts[0] || 'Unknown';
}
