import { describe, it, expect } from 'vitest';
import {
  cleanBankDescription,
  normalizeMerchant,
  categorizeBySuissKeywords,
  extractMerchantFromUBS
} from './bankDescriptionCleaner';

describe('cleanBankDescription', () => {
  it('should remove text after semicolon', () => {
    const input = 'Aldi Suisse 87;1305 Penthalaz';
    const result = cleanBankDescription(input);
    expect(result).toBe('Aldi Suisse 87');
  });

  it('should remove text after No de transaction', () => {
    const input = 'Station Mérillat SA No de transaction: 9930859BN4107485';
    const result = cleanBankDescription(input);
    expect(result).toBe('Station Mérillat SA');
  });

  it('should remove text after IBAN', () => {
    const input = 'Company Name IBAN: CH15 0020 4204 2882 5201 N';
    const result = cleanBankDescription(input);
    expect(result).toBe('Company Name');
  });

  it('should remove text after QRR', () => {
    const input = 'Vendor Name QRR: 00 00000 00000 00002 16924 07481';
    const result = cleanBankDescription(input);
    expect(result).toBe('Vendor Name');
  });

  it('should handle multiple stop tokens', () => {
    const input = 'Coop Pronto 5368;1950 Sion Paiement carte de debit No de transaction: 123';
    const result = cleanBankDescription(input);
    expect(result).toBe('Coop Pronto 5368');
  });

  it('should trim whitespace', () => {
    const input = '  Migros   ';
    const result = cleanBankDescription(input);
    expect(result).toBe('Migros');
  });

  it('should collapse multiple spaces', () => {
    const input = 'Landi  Nord   Vaudois';
    const result = cleanBankDescription(input);
    expect(result).toBe('Landi Nord Vaudois');
  });

  it('should return empty string for empty input', () => {
    expect(cleanBankDescription('')).toBe('');
    expect(cleanBankDescription('   ')).toBe('');
  });
});

describe('normalizeMerchant', () => {
  it('should convert to uppercase', () => {
    const result = normalizeMerchant('aldi suisse');
    expect(result).toBe('ALDI SUISSE');
  });

  it('should remove digits', () => {
    const result = normalizeMerchant('Aldi Suisse 87');
    expect(result).toBe('ALDI SUISSE');
  });

  it('should remove postal codes', () => {
    const result = normalizeMerchant('Landi 1304 Cossonay');
    expect(result).toBe('LANDI COSSONAY');
  });

  it('should remove country codes at end', () => {
    expect(normalizeMerchant('Company CH')).toBe('COMPANY');
    expect(normalizeMerchant('Company Name GB')).toBe('COMPANY NAME');
  });

  it('should limit to 2 words maximum', () => {
    const result = normalizeMerchant('Landi Nord Vaudois Venoge');
    expect(result).toBe('LANDI NORD');
  });

  it('should handle short merchants', () => {
    expect(normalizeMerchant('SBB')).toBe('SBB');
    expect(normalizeMerchant('Coop')).toBe('COOP');
  });

  it('should filter out short words', () => {
    const result = normalizeMerchant('A La Migros SA');
    expect(result).toBe('MIGROS');
  });
});

describe('categorizeBySuissKeywords', () => {
  it('should categorize grocery stores as Courses', () => {
    expect(categorizeBySuissKeywords('Migros Lausanne')).toBe('Courses');
    expect(categorizeBySuissKeywords('Coop Pronto 5368')).toBe('Courses');
    expect(categorizeBySuissKeywords('Aldi Suisse 87')).toBe('Courses');
    expect(categorizeBySuissKeywords('Lidl Geneve')).toBe('Courses');
    expect(categorizeBySuissKeywords('Denner Sion')).toBe('Courses');
  });

  it('should categorize gas stations as Transports', () => {
    expect(categorizeBySuissKeywords('Station Mérillat SA')).toBe('Transports');
    expect(categorizeBySuissKeywords('Eni Gondo')).toBe('Transports');
    expect(categorizeBySuissKeywords('Shell Station')).toBe('Transports');
    expect(categorizeBySuissKeywords('Tamoil Route')).toBe('Transports');
    expect(categorizeBySuissKeywords('Avanti')).toBe('Transports');
  });

  it('should categorize public transport as Transports', () => {
    expect(categorizeBySuissKeywords('SBB CFF FFS')).toBe('Transports');
    expect(categorizeBySuissKeywords('TL Transport')).toBe('Transports');
    expect(categorizeBySuissKeywords('TPG Geneve')).toBe('Transports');
  });

  it('should categorize bank fees', () => {
    expect(categorizeBySuissKeywords('Frais E-Banking')).toBe('Frais bancaires');
    expect(categorizeBySuissKeywords('Solde décompte des prix prestations')).toBe('Frais bancaires');
    expect(categorizeBySuissKeywords('Coûts divers')).toBe('Frais bancaires');
  });

  it('should categorize pharmacies as Santé', () => {
    expect(categorizeBySuissKeywords('Pharmacie Centrale')).toBe('Santé');
    expect(categorizeBySuissKeywords('Amavita')).toBe('Santé');
    expect(categorizeBySuissKeywords('Benu')).toBe('Santé');
  });

  it('should categorize shipping as Services', () => {
    expect(categorizeBySuissKeywords('Fedex Express')).toBe('Services');
    expect(categorizeBySuissKeywords('DHL Express')).toBe('Services');
    expect(categorizeBySuissKeywords('La Poste')).toBe('Services');
  });

  it('should categorize income as Revenus', () => {
    expect(categorizeBySuissKeywords('Credit référence QR')).toBe('Revenus');
    expect(categorizeBySuissKeywords('Versement salaire')).toBe('Revenus');
    expect(categorizeBySuissKeywords('Salaire décembre', 'ordre e-banking')).toBe('Revenus');
  });

  it('should categorize restaurants', () => {
    expect(categorizeBySuissKeywords('Restaurant du Pont')).toBe('Restaurants');
    expect(categorizeBySuissKeywords('McDonalds Chablais')).toBe('Restaurants');
    expect(categorizeBySuissKeywords('Pizza Express')).toBe('Restaurants');
  });

  it('should categorize hardware stores as Maison', () => {
    expect(categorizeBySuissKeywords('Hornbach Baumarkt')).toBe('Maison');
    expect(categorizeBySuissKeywords('Landi Nord Vaudois')).toBe('Maison');
    expect(categorizeBySuissKeywords('Jumbo Brico')).toBe('Maison');
  });

  it('should categorize insurance as Assurances', () => {
    expect(categorizeBySuissKeywords('Baloise Assurance')).toBe('Assurances');
    expect(categorizeBySuissKeywords('AXA Winterthur')).toBe('Assurances');
    expect(categorizeBySuissKeywords('Zurich Insurance')).toBe('Assurances');
  });

  it('should return null for unknown merchants', () => {
    expect(categorizeBySuissKeywords('Random Merchant XYZ')).toBeNull();
    expect(categorizeBySuissKeywords('Unknown Store 123')).toBeNull();
  });

  it('should prioritize higher priority matches', () => {
    expect(categorizeBySuissKeywords('Salaire Credit mensuel')).toBe('Revenus');
  });

  it('should search in full text as well', () => {
    const result = categorizeBySuissKeywords(
      'Company Name',
      'ordre global e-banking with coop reference'
    );
    expect(result).toBe('Courses');
  });
});

describe('extractMerchantFromUBS', () => {
  it('should extract merchant from UBS Description1', () => {
    const result = extractMerchantFromUBS(
      'Aldi Suisse 87;1305 Penthalaz',
      '21121515-0 10/28; Paiement carte de debit',
      'No de transaction: 9930859BN3379676'
    );
    expect(result).toBe('Aldi Suisse 87');
  });

  it('should fallback to Description2 if Description1 is empty', () => {
    const result = extractMerchantFromUBS(
      '',
      'Migros Lausanne',
      'Transaction info'
    );
    expect(result).toBe('Migros Lausanne');
  });

  it('should clean each description part', () => {
    const result = extractMerchantFromUBS(
      'Station Mérillat SA;1148 L\'Isle',
      '21121515-0 10/28; Paiement carte de debit',
      'No de transaction: 123'
    );
    expect(result).toBe('Station Mérillat SA');
  });

  it('should return Unknown if all parts are empty', () => {
    const result = extractMerchantFromUBS('', '', '');
    expect(result).toBe('Unknown');
  });

  it('should handle complex UBS formats', () => {
    const result = extractMerchantFromUBS(
      'ordre global e-banking',
      'LEUBA Hiag SA;Planchettes 1; 1032 Romanel-s-Lausanne; CH',
      'Reference no. QRR: 80 53810 00000 08169 59497 21396'
    );
    expect(result).toBe('LEUBA Hiag SA');
  });

  it('should handle credit references', () => {
    const result = extractMerchantFromUBS(
      'Credit référence QR',
      'CH293000520428825201N',
      'Coûts: 2 Crédit référence QR (*e); No de transaction: 2025364PH0001518'
    );
    expect(result).toBe('CH293000520428825201N');
  });
});
