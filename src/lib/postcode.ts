export interface CountryRule {
  code: string;
  pattern: RegExp;
  example: string;
}

export const COUNTRIES: CountryRule[] = [
  { code: 'PL', pattern: /^\d{2}-\d{3}$/, example: '00-001' },
  { code: 'UA', pattern: /^\d{5}$/, example: '01001' },
  { code: 'DE', pattern: /^\d{5}$/, example: '10115' },
  { code: 'CZ', pattern: /^\d{3} ?\d{2}$/, example: '110 00' },
  { code: 'SK', pattern: /^\d{3} ?\d{2}$/, example: '811 01' },
  { code: 'GB', pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, example: 'SW1A 1AA' },
];

export function ruleFor(country: string): CountryRule {
  return COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];
}

export function isValidPostcode(postcode: string, country: string): boolean {
  return ruleFor(country).pattern.test(postcode.trim());
}

/** Polish convenience: "00001" -> "00-001" while typing. */
export function formatPostcode(raw: string, country: string): string {
  const v = raw.trim();
  if (country === 'PL') {
    const digits = v.replace(/\D/g, '').slice(0, 5);
    return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
  }
  return v;
}
