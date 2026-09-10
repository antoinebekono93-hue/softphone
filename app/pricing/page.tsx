import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarketingLayout, PageHero, SectionHeading, FAQAccordion } from "@/components/marketing";
import { PricingClient, ANNUAL_DISCOUNT } from "@/components/pricing/PricingClient";
import { TrustBar, FinalCTA } from "@/components/landing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tarifs | Antigravity",
  description:
    "Plans simples et transparents pour votre téléphonie IA : de 9$/mois pour démarrer à un prix premium avec appels internationaux illimités entre apps. Sans engagement.",
};

const addOns = [
  {
    title: "Répondeur IA 24/7",
    price: "39$",
    period: "/mois",
    description: "Votre réceptionniste IA répond aux appels manqués, qualifie les prospects et prend des rendez-vous, jour et nuit.",
    badge: "Nouveau",
    features: ["Prise d'appel instantanée", "Qualification des prospects", "Synchro calendrier & CRM"],
  },
  {
    title: "Booster SMS",
    price: "25$",
    period: "/mois",
    description: "Campagnes, notifications et réponses automatiques par SMS, reliées à vos agents IA.",
    badge: "Populaire",
    features: ["200 SMS inclus/mois", "Réponses IA automatiques", "Suivi conversationnel"],
  },
  {
    title: "Analytiques avancées",
    price: "19$",
    period: "/mois",
    description: "Sentiment des appels, sujets, taux de conversion et tableaux de bord temps réel.",
    badge: "Inclus dans Premium",
    features: ["Sentiment IA", "Rapports exportables", "Alertes en temps réel"],
  },
  {
    title: "Routage intelligent",
    price: "15$",
    period: "/mois",
    description: "Acheminement automatique des appels vers le bon agent, au bon moment, selon l'intention.",
    badge: "Inclus dans Premium",
    features: ["Routage par compétence", "Files d'attente intelligentes", "Équilibrage de charge"],
  },
];

const faqItems = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui. Vous pouvez passer au plan supérieur ou inférieur à tout moment depuis votre tableau de bord. Le changement est appliqué immédiatement et la différence est proratisée automatiquement.",
  },
  {
    question: "Qu'est-ce qui est inclus dans les « appels illimités » ?",
    answer:
      "Les appels illimités couvrent le trafic app-to-app (votre softphone Antigravity vers d'autres utilisateurs Antigravity). Les appels vers le réseau téléphonique (PSTN) restent facturés à la consommation via votre wallet prépayé, pour éviter les abus et garantir la qualité.",
  },
  {
    question: "Les minutes hors forfait sont-elles bloquées ?",
    answer:
      "Non. Elles sont pré-autorisées et débitées sur votre wallet prépayé au tarif de la destination. Vous êtes averti avant tout dépassement et pouvez recharger en quelques clics.",
  },
  {
    question: "Y a-t-il des frais cachés ou un engagement de durée ?",
    answer:
      "Aucun. Tous nos plans sont sans engagement minimal et annulables à tout moment. Le tarif annuel applique simplement un -20% sur le prix mensuel, facturé en une fois.",
  },
  {
    question: "Le répondeur IA fonctionne-t-il avec tous les plans ?",
    answer:
      "Oui, le répondeur IA 24/7 est un module complémentaire compatible avec tous les plans. Il s'appuie sur vos agents IA existants et peut être activé en quelques minutes.",
  },
];

function YesValue() {
  return (
    <div className="flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
    </div>
  );
}

function NoValue() {
  return (
    <div className="flex items-center justify-center text-[var(--text-secondary)]">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </div>
  );
}

function ValueCell({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-bold text-[var(--text-primary)] text-center">{children}</div>;
}

export default async function PricingPage() {
  const dbPlans = await prisma.pricingPlan.findMany({
    include: { features: true },
    orderBy: { monthlyPrice: "asc" },
  });

  const plans = dbPlans.map((p) => ({
    id: p.id,
    name: p.name,
    monthlyPrice: Number(p.monthlyPrice),
    includedMinutes: p.includedMinutes,
    includedSms: p.includedSms,
    unlimitedCalls: p.unlimitedCalls,
    internationalEnabled: p.internationalEnabled,
    hasRecording: p.hasRecording,
    hasTransfer: p.hasTransfer,
    hasAdvancedAnalytics: p.hasAdvancedAnalytics,
    hasCallRouting: p.hasCallRouting,
    features: p.features.map((f) => f.name),
    recommended: p.name === "Premium",
  }));

  type PlanRow = (typeof plans)[number];
  const comparisonRows: { label: string; render: (p: PlanRow) => React.ReactNode }[] = [
    { label: "Prix mensuel", render: (p) => <ValueCell>{p.monthlyPrice === 0 ? "—" : `$${p.monthlyPrice}`}</ValueCell> },
    { label: "Prix annuel (−20%)", render: (p) => <ValueCell>{p.monthlyPrice === 0 ? "—" : `$${Math.round(p.monthlyPrice * ANNUAL_DISCOUNT)}/mois`}</ValueCell> },
    { label: "Agents IA illimités", render: () => <YesValue /> },
                { label: "Minutes PSTN incluses", render: (p: (typeof plans)[number]) => <ValueCell>{p.unlimitedCalls && p.name !== "Premium" ? "App-to-app" : p.includedMinutes > 0 ? `${p.includedMinutes.toLocaleString("fr-FR")} min.` : "—"}</ValueCell> },
                { label: "SMS inclus", render: (p: (typeof plans)[number]) => <ValueCell>{p.includedSms > 0 ? `${p.includedSms.toLocaleString("fr-FR")}` : "—"}</ValueCell> },
                { label: "Appels illimités (app-to-app)", render: (p: (typeof plans)[number]) => (p.unlimitedCalls ? <YesValue /> : <NoValue />) },
                { label: "Appels internationaux", render: (p: (typeof plans)[number]) => (p.internationalEnabled ? <YesValue /> : <NoValue />) },
                { label: "Enregistrement d'appels", render: (p: (typeof plans)[number]) => (p.hasRecording ? <YesValue /> : <NoValue />) },
                { label: "Transfert d'appels", render: (p: (typeof plans)[number]) => (p.hasTransfer ? <YesValue /> : <NoValue />) },
                { label: "Routage intelligent IA", render: (p: (typeof plans)[number]) => (p.hasCallRouting ? <YesValue /> : <NoValue />) },
                { label: "Analytiques avancées", render: (p: (typeof plans)[number]) => (p.hasAdvancedAnalytics ? <YesValue /> : <NoValue />) },
  ];

  return (
    <MarketingLayout>
      <PageHero
        badge="Prix simples · Sans engagement"
        accent="amber"
        title={
          <>
            Une IA qui répond, <span className="n8n-gradient-text">à un prix clair</span>
          </>
        }
        subtitle="Des plans transparents, sans frais cachés. Changez de plan ou annulez à tout moment — vos agents IA gardent la mémoire de chaque client."
      >
        <Link href="#plans" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Voir les plans
        </Link>
        <Link href="/receptionniste-ia" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Découvrir le répondeur IA
        </Link>
      </PageHero>

      {/* Social proof */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <TrustBar />
      </div>

      {/* Plans */}
      <section id="plans" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <PricingClient plans={plans} />

        {/* Comparison table — desktop only */}
        <div className="mt-20 rounded-[32px] glass-panel-premium overflow-x-auto hidden lg:block">
          <div className="px-8 pt-8">
            <SectionHeading
              title="Comparer les plans"
              subtitle="Tous les plans incluent des agents IA illimités, un numéro dédié et la softphone Antigravity."
            />
          </div>
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="p-4 text-sm font-bold text-[var(--text-primary)]">Fonctionnalité</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-4 text-sm font-extrabold text-center text-[var(--text-primary)]">
                    {plan.name}
                    {plan.recommended && <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mt-1">Recommandé</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={row.label} className={`border-b border-[var(--border-subtle)] ${i % 2 === 1 ? "bg-[var(--bg-surface)]" : ""}`}>
                  <td className="p-4 text-sm font-bold text-[var(--text-secondary)]">{row.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-4">{row.render(plan)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-6 text-center text-xs text-[var(--text-secondary)] font-medium">
            Appels PSTN hors forfait facturés au tarif de la destination via wallet prépayé (pré-autorisation). Protections fair-use appliquées.
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Modules complémentaires"
          subtitle="Ajoutez des capacités à la carte, activables en un clic depuis votre tableau de bord."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {addOns.map((addon) => (
            <div key={addon.title} className="rounded-[24px] glass-panel-premium p-6 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">{addon.title}</h3>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">{addon.price}</span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">{addon.period}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 self-start">
                {addon.badge}
              </div>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{addon.description}</p>
              <ul className="space-y-2 mt-auto">
                {addon.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-4 w-full py-2.5 rounded-full text-center text-sm font-bold bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                Ajouter
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Questions fréquentes" subtitle="Tout ce qu'il faut savoir avant de vous lancer." />
        <FAQAccordion items={faqItems} />
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}
