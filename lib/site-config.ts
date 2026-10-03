function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

export const siteConfig = {
  url:
    readEnv("NEXT_PUBLIC_SITE_URL") ||
    readEnv("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3000",
  brand: "Antigravity",
  product: "Antigravity",
  /**
   * Single source of truth for the publisher identity.
   * Every value is empty until the business provides it: nothing is invented.
   */
  legalEntity: readEnv("NEXT_PUBLIC_LEGAL_ENTITY"),
  tradeName: readEnv("NEXT_PUBLIC_TRADE_NAME"),
  country: readEnv("NEXT_PUBLIC_COMPANY_COUNTRY"),
  companyAddress: readEnv("NEXT_PUBLIC_COMPANY_ADDRESS"),
  companyRegistry: readEnv("NEXT_PUBLIC_COMPANY_REGISTRY"),
  vatId: readEnv("NEXT_PUBLIC_VAT_ID"),
  supportPhone: readEnv("NEXT_PUBLIC_SUPPORT_PHONE"),
  legalEffectiveDate: readEnv("NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE") || "2026-01-01",
} as const;

export const legalIdentityFields = [
  { key: "LEGAL_NAME", label: "Raison sociale", value: siteConfig.legalEntity },
  { key: "TRADE_NAME", label: "Nom commercial", value: siteConfig.tradeName },
  { key: "COUNTRY", label: "Pays d'établissement", value: siteConfig.country },
  { key: "BUSINESS_ADDRESS", label: "Adresse du siège", value: siteConfig.companyAddress },
  { key: "COMPANY_REGISTRY", label: "Immatriculation", value: siteConfig.companyRegistry },
  { key: "VAT_TAX_ID", label: "Numéro de TVA", value: siteConfig.vatId },
  { key: "SUPPORT_PHONE", label: "Téléphone du support", value: siteConfig.supportPhone },
] as const;

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
      "Softphone, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.",
    email: readEnv("NEXT_PUBLIC_SUPPORT_EMAIL"),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
    phone: readEnv("NEXT_PUBLIC_SUPPORT_PHONE"),
  },
  {
    id: "sales",
    title: "Support commercial",
    scope:
      "Choix d'un plan, volume de minutes, numéros supplémentaires, démonstration, questions avant achat.",
    email: readEnv("NEXT_PUBLIC_SALES_EMAIL"),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "payment",
    title: "Support paiement et facturation",
    scope:
      "Abonnement, renouvellement, moyen de paiement, facture, avoir, remboursement, litige de facturation.",
    email: readEnv("NEXT_PUBLIC_PAYMENT_EMAIL"),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "legal",
    title: "Questions juridiques et données personnelles",
    scope:
      "Conditions générales, politique de confidentialité, politique de remboursement, usage acceptable, RGPD.",
    email: readEnv("NEXT_PUBLIC_LEGAL_EMAIL"),
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
