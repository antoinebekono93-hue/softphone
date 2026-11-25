export interface DialCountry {
  code: string;
  iso: string;
  label: string;
  flag: string;
}

export const DEFAULT_DIAL_CODE = "+1";

export const DIAL_COUNTRIES: readonly DialCountry[] = [
  { code: "+1", iso: "US", label: "États-Unis / Canada", flag: "🇺🇸" },
  { code: "+33", iso: "FR", label: "France", flag: "🇫🇷" },
  { code: "+237", iso: "CM", label: "Cameroun", flag: "🇨🇲" },
  { code: "+44", iso: "GB", label: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+32", iso: "BE", label: "Belgique", flag: "🇧🇪" },
  { code: "+41", iso: "CH", label: "Suisse", flag: "🇨🇭" },
  { code: "+225", iso: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", iso: "SN", label: "Sénégal", flag: "🇸🇳" },
  { code: "+223", iso: "ML", label: "Mali", flag: "🇲🇱" },
  { code: "+212", iso: "MA", label: "Maroc", flag: "🇲🇦" },
  { code: "+216", iso: "TN", label: "Tunisie", flag: "🇹🇳" },
  { code: "+49", iso: "DE", label: "Allemagne", flag: "🇩🇪" },
  { code: "+34", iso: "ES", label: "Espagne", flag: "🇪🇸" },
  { code: "+39", iso: "IT", label: "Italie", flag: "🇮🇹" },
] as const;

export function countryByDialCode(code: string): DialCountry {
  return DIAL_COUNTRIES.find((country) => country.code === code) ?? DIAL_COUNTRIES[0];
}
