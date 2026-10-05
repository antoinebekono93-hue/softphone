function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

/**
 * Canonical public origin of the site.
 * `NEXT_PUBLIC_SITE_URL` is authoritative; the deployed Vercel origin is the
 * temporary fallback so canonicals, sitemap and OpenGraph never point at
 * localhost. Swap it once the final Buster Call domain is configured.
 */
const PUBLIC_ORIGIN =
  readEnv("NEXT_PUBLIC_SITE_URL") ||
  readEnv("NEXT_PUBLIC_APP_URL") ||
  "https://softphone-xi.vercel.app";

/**
 * Brand. "Buster Call" is the official and only public-facing product name.
 * Do not reintroduce "Antigravity", "Softphone Xi" or "Softphone-Xi".
 * The generic word "softphone" remains allowed as a descriptive/SEO term.
 */
const BRAND = "Buster Call";

/**
 * Publisher identity — confirmed by the business.
 *
 * MERCO is the operator; it is written plainly, with no legal form suffix
 * (no SARL / SAS / LTD / Inc. / LLC) because no legal form was provided.
 *
 * `companyRegistry` (RCCM) and `taxId` (NIU) are intentionally EMPTY: those
 * numbers have not been provided and must never be guessed. They are simply
 * omitted from the public pages while empty.
 */
const legalEntity = readEnv("NEXT_PUBLIC_LEGAL_ENTITY") || "MERCO";
const tradeName = readEnv("NEXT_PUBLIC_TRADE_NAME") || BRAND;
const country = readEnv("NEXT_PUBLIC_COMPANY_COUNTRY") || "Cameroun";
const city = readEnv("NEXT_PUBLIC_COMPANY_CITY") || "Bafoussam";
const companyAddress = readEnv("NEXT_PUBLIC_COMPANY_ADDRESS") || "Kamkop 1";
const companyRegistry = readEnv("NEXT_PUBLIC_COMPANY_REGISTRY");
const taxId = readEnv("NEXT_PUBLIC_TAX_ID") || readEnv("NEXT_PUBLIC_VAT_ID");
const supportPhone = readEnv("NEXT_PUBLIC_SUPPORT_PHONE") || "+237 698 105 696";
const supportEmail =
  readEnv("NEXT_PUBLIC_SUPPORT_EMAIL") || "antoinebekono93@gmail.com";

/**
 * Dedicated contact addresses. The support address is deliberately NOT reused
 * here: no commercial, billing or legal mailbox exists yet, so those channels
 * stay disabled instead of silently routing to the support inbox.
 */
const salesEmail = readEnv("NEXT_PUBLIC_SALES_EMAIL");
const billingEmail = readEnv("NEXT_PUBLIC_PAYMENT_EMAIL");
const legalEmail = readEnv("NEXT_PUBLIC_LEGAL_EMAIL");

const addressLines = [companyAddress, city, country].filter(Boolean);
const addressSuffix =
  addressLines.length > 0 ? `, basée à ${addressLines.join(", ")}` : "";

export const siteConfig = {
  url: PUBLIC_ORIGIN,
  brand: BRAND,
  product: BRAND,
  legalEntity,
  tradeName,
  country,
  city,
  companyAddress,
  addressLines,
  addressLine: addressLines.join(", "),
  companyRegistry,
  taxId,
  supportPhone,
  supportEmail,
  salesEmail,
  billingEmail,
  legalEmail,
  /**
   * Single sentence used across the public legal pages, built from the fields
   * above so it can never drift from the rest of the identity block.
   */
  publisherStatement: `${tradeName} est une marque exploitée par ${legalEntity}${addressSuffix}.`,
  legalEffectiveDate: readEnv("NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE") || "2026-10-05",
} as const;

export const legalIdentityFields = [
  { key: "LEGAL_NAME", label: "Opérateur", value: siteConfig.legalEntity },
  { key: "TRADE_NAME", label: "Marque", value: siteConfig.tradeName },
  { key: "BUSINESS_ADDRESS", label: "Adresse", value: siteConfig.companyAddress },
  { key: "CITY", label: "Ville", value: siteConfig.city },
  { key: "COUNTRY", label: "Pays", value: siteConfig.country },
  { key: "COMPANY_REGISTRY", label: "RCCM", value: siteConfig.companyRegistry },
  { key: "TAX_ID", label: "NIU / identifiant fiscal", value: siteConfig.taxId },
  { key: "SUPPORT_EMAIL", label: "E-mail support", value: siteConfig.supportEmail },
  { key: "SUPPORT_PHONE", label: "Téléphone", value: siteConfig.supportPhone },
] as const;

/**
 * Internal-only list. Never rendered publicly: the public pages omit a field
 * when it is empty, instead of showing a placeholder such as "RCCM à venir".
 */
export const missingLegalIdentityFields = legalIdentityFields.filter(
  (field) => field.value.length === 0
);

export type SupportChannel = {
  id: "product" | "sales" | "payment" | "legal";
  title: string;
  scope: string;
  email: string;
  responseTime: string;
  phone?: string;
};

const allChannels: SupportChannel[] = [
  {
    id: "product",
    title: "Support produit",
    scope:
      "Buster Call, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.",
    email: supportEmail,
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
    phone: supportPhone,
  },
  {
    id: "sales",
    title: "Support commercial",
    scope:
      "Choix d'un plan, volume de minutes, numéros supplémentaires, démonstration, questions avant achat.",
    email: salesEmail,
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "payment",
    title: "Support paiement et facturation",
    scope:
      "Abonnement, renouvellement, moyen de paiement, facture, avoir, remboursement, litige de facturation.",
    email: billingEmail,
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "legal",
    title: "Questions juridiques et données personnelles",
    scope:
      "Conditions générales, politique de confidentialité, politique de remboursement, usage acceptable, RGPD.",
    email: legalEmail,
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
];

export const supportChannels: SupportChannel[] = allChannels.filter(
  (channel) => channel.email.length > 0 || (channel.phone?.length ?? 0) > 0
);

export const hasSupportChannels = supportChannels.length > 0;

export const pricingCurrency = "USD";

export const legalLinks = [
  { href: "/terms", label: "Conditions générales" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/refund-policy", label: "Remboursements" },
  { href: "/acceptable-use", label: "Usage acceptable" },
] as const;

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: pricingCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
