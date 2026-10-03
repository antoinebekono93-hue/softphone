export const siteConfig = {
  url:
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
    (process.env.NEXT_PUBLIC_APP_URL || "").trim() ||
    "http://localhost:3000",
  brand: "Antigravity",
  product: "Antigravity",
  legalEntity: (process.env.NEXT_PUBLIC_LEGAL_ENTITY || "").trim(),
  companyAddress: (process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "").trim(),
  companyRegistry: (process.env.NEXT_PUBLIC_COMPANY_REGISTRY || "").trim(),
  legalEffectiveDate:
    (process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE || "").trim() || "2026-01-01",
} as const;

export type SupportChannel = {
  id: "product" | "sales" | "payment" | "legal";
  title: string;
  scope: string;
  email: string;
  responseTime: string;
};

const allChannels: SupportChannel[] = [
  {
    id: "product",
    title: "Support produit",
    scope:
      "Softphone, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.",
    email: (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "").trim(),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "sales",
    title: "Support commercial",
    scope:
      "Choix d'un plan, volume de minutes, numéros supplémentaires, démonstration, questions avant achat.",
    email: (process.env.NEXT_PUBLIC_SALES_EMAIL || "").trim(),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "payment",
    title: "Support paiement et facturation",
    scope:
      "Abonnement, renouvellement, moyen de paiement, facture, avoir, remboursement, litige de facturation.",
    email: (process.env.NEXT_PUBLIC_PAYMENT_EMAIL || "").trim(),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
  {
    id: "legal",
    title: "Questions juridiques et données personnelles",
    scope:
      "Conditions générales, politique de confidentialité, politique de remboursement, usage acceptable, RGPD.",
    email: (process.env.NEXT_PUBLIC_LEGAL_EMAIL || "").trim(),
    responseTime: "Délai de réponse indicatif communiqué sur cette page.",
  },
];

export const supportChannels: SupportChannel[] = allChannels.filter(
  (channel) => channel.email.length > 0
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
