import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarketingLayout, PageHero, SectionHeading, FAQAccordion } from "@/components/marketing";
import { PricingClient } from "@/components/pricing/PricingClient";
import type { PricingPlanCard } from "@/components/pricing/PricingClient";
import { FinalCTA } from "@/components/landing";
import { formatPrice, siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Abonnements mensuels pour la téléphonie professionnelle, le softphone cloud et les agents vocaux IA. Prix affichés Hors Taxes, sans engagement, renouvelés automatiquement et annulables à tout moment.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/pricing",
    title: `Tarifs | ${siteConfig.brand}`,
    description:
      "Abonnements mensuels sans engagement pour la téléphonie professionnelle, le softphone cloud et les agents vocaux IA. Annulable à tout moment.",
  },
};

const INTERNAL_PLAN_PATTERN =
  /\b(test|testing|internal|interne|dev|develop|sandbox|scratch|temp|tmp|demo|draft|wip|god|migration|legacy|old|free|freemium|essai)\b/i;

const NUMBER_POLICY: Record<string, string> = {
  "Appels Illimités": "1 numéro professionnel inclus",
};

const ADD_ONS = [
  {
    title: "Répondeur IA 24/7",
    description:
      "Agent vocal qui répond aux appels manqués, qualifie la demande et prend rendez-vous, de jour comme de nuit.",
    features: ["Prise d'appel instantanée", "Qualification de la demande", "Intégration calendrier et CRM"],
  },
  {
    title: "Booster SMS",
    description:
      "Campagnes, notifications et réponses automatiques par SMS, reliées à vos agents vocaux.",
    features: ["200 SMS inclus par mois", "Réponses automatisées", "Suivi des conversations"],
  },
  {
    title: "Analytiques avancées",
    description:
      "Sujets des appels, sentiment, taux de transformation et tableaux de bord temps réel.",
    features: ["Analyse de sentiment", "Rapports exportables", "Alertes en temps réel"],
    includedIn: "Premium",
  },
  {
    title: "Routage intelligent",
    description:
      "Acheminement automatique des appels vers le bon agent, au bon moment, selon l'intention détectée.",
    features: ["Routage par compétence", "Files d'attente intelligentes", "Équilibrage de charge"],
    includedIn: "Premium",
  },
];

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne la facturation ?",
    answer:
      "Chaque offre est un abonnement mensuel, facturé au début de la période et renouvelé automatiquement à chaque échéance. Vous pouvez désactiver ce renouvellement à tout moment depuis votre espace : aucun nouveau prélèvement n'est alors effectué.",
  },
  {
    question: "Suis-je engagé sur une durée ?",
    answer:
      "Non. Il n'y a ni engagement de durée ni frais de résiliation. L'annulation prend effet à la fin de la période en cours.",
  },
  {
    question: "Que couvrent exactement les appels illimités ?",
    answer:
      "Les appels illimités concernent le trafic entre utilisateurs de la plateforme (app-to-app), sans coût additionnel par appel. Les appels vers le réseau téléphonique public ne sont jamais couverts par ce poste : ils sont soumis au forfait de minutes ou au solde prépayé.",
  },
  {
    question: "Qu'est-ce qui est facturé en plus de l'abonnement ?",
    answer:
      "Les minutes PSTN consommées au-delà du forfait, les SMS et messages WhatsApp, les numéros supplémentaires et les modules complémentaires sont facturés en sus, au tarif en vigueur au moment de la consommation. Chaque consommation est visible dans votre espace.",
  },
  {
    question: "Puis-je changer de plan ?",
    answer:
      "Oui, depuis votre espace. Le changement de plan est appliqué immédiatement et la différence est calculée au prorata de la période en cours.",
  },
  {
    question: "Puis-je annuler et être remboursé ?",
    answer:
      "L'abonnement étant sans engagement, vous pouvez annuler à tout moment. Le temps restant d'une période déjà payée n'est pas remboursé au prorata. Les cas ouvrant droit à remboursement, les délais et la procédure sont détaillés dans notre politique de remboursement.",
  },
];

function YesValue() {
  return (
    <div className="flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Inclus"
        className="text-emerald-400"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    </div>
  );
}

function NoValue() {
  return (
    <div className="flex items-center justify-center text-[var(--text-secondary)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Non inclus"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </div>
  );
}

function ValueCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-bold text-[var(--text-primary)] text-center">{children}</div>
  );
}

export default async function PricingPage() {
  const dbPlans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    include: { features: true },
    orderBy: { monthlyPrice: "asc" },
  });

  const plans: PricingPlanCard[] = dbPlans
    .filter((plan) => Number(plan.monthlyPrice) > 0)
    .filter((plan) => !INTERNAL_PLAN_PATTERN.test(plan.name))
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyPrice: Number(plan.monthlyPrice),
      includedMinutes: plan.includedMinutes,
      includedSms: plan.includedSms,
      unlimitedCalls: plan.unlimitedCalls,
      internationalEnabled: plan.internationalEnabled,
      hasRecording: plan.hasRecording,
      hasTransfer: plan.hasTransfer,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasCallRouting: plan.hasCallRouting,
      numbersPolicy:
        NUMBER_POLICY[plan.name] ?? "Numéro professionnel non inclus dans l'abonnement",
      features: plan.features.map((feature) => feature.name),
      recommended: plan.name === "Premium",
    }));

  type PlanRow = PricingPlanCard;

  const comparisonRows: { label: string; render: (plan: PlanRow) => React.ReactNode }[] = [
    {
      label: "Abonnement mensuel",
      render: (plan) => <ValueCell>{formatPrice(plan.monthlyPrice)}</ValueCell>,
    },
    {
      label: "Numéro professionnel",
      render: (plan) => (
        <ValueCell>
          {NUMBER_POLICY[plan.name] ? "1 inclus" : "Non inclus"}
        </ValueCell>
      ),
    },
    {
      label: "Appels internes app-to-app",
      render: (plan) => (plan.unlimitedCalls ? <YesValue /> : <NoValue />),
    },
    {
      label: "Minutes PSTN incluses",
      render: (plan) => (
        <ValueCell>
          {plan.includedMinutes > 0
            ? `${plan.includedMinutes.toLocaleString("fr-FR")} min`
            : "Aucune"}
        </ValueCell>
      ),
    },
    {
      label: "SMS inclus",
      render: (plan) => (
        <ValueCell>
          {plan.includedSms > 0 ? plan.includedSms.toLocaleString("fr-FR") : "Aucun"}
        </ValueCell>
      ),
    },
    {
      label: "Appels internationaux",
      render: (plan) => (plan.internationalEnabled ? <YesValue /> : <NoValue />),
    },
    {
      label: "Enregistrement des appels",
      render: (plan) => (plan.hasRecording ? <YesValue /> : <NoValue />),
    },
    {
      label: "Transfert d'appels",
      render: (plan) => (plan.hasTransfer ? <YesValue /> : <NoValue />),
    },
    {
      label: "Routage intelligent des appels",
      render: (plan) => (plan.hasCallRouting ? <YesValue /> : <NoValue />),
    },
    {
      label: "Analytiques avancées",
      render: (plan) => (plan.hasAdvancedAnalytics ? <YesValue /> : <NoValue />),
    },
  ];

  return (
    <MarketingLayout>
      <PageHero
        badge="Abonnements mensuels · Sans engagement"
        accent="blue"
        title={
          <>
            Des abonnements clairs, <span className="n8n-gradient-text">renouvelés chaque mois</span>
          </>
        }
        subtitle="Un prix de base mensuel pour l'accès à la plateforme et aux volumes inclus. Les consommations au-delà des forfaits sont facturées en plus, au tarif en vigueur. Sans engagement, annulable à tout moment."
      >
        <a
          href="#plans"
          className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25"
        >
          Voir les offres
        </a>
        <Link
          href="/receptionniste-ia"
          className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          Découvrir le répondeur IA
        </Link>
      </PageHero>

      <section id="plans" className="px-5 sm:px-6 max-w-7xl mx-auto w-full py-12 scroll-mt-24">
        <PricingClient plans={plans} />
      </section>

      <section className="px-5 sm:px-6 max-w-7xl mx-auto w-full py-12">
        <div className="rounded-[var(--radius-panel)] glass-panel-premium overflow-hidden">
          <div className="px-6 pt-8">
            <SectionHeading
              title="Comparer les offres"
              subtitle="Comparaison détaillée des limites et fonctionnalités incluses dans chaque abonnement."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <caption className="sr-only">
                Comparaison des fonctionnalités incluses dans chaque abonnement
              </caption>
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th scope="col" className="p-4 text-sm font-bold text-[var(--text-primary)]">
                    Fonctionnalité
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="p-4 text-sm font-extrabold text-center text-[var(--text-primary)]"
                    >
                      {plan.name}
                      {plan.recommended && (
                        <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 mt-1">
                          Recommandé
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[var(--border-subtle)] ${
                      index % 2 === 1 ? "bg-[var(--bg-surface)]" : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className="p-4 text-sm font-bold text-[var(--text-secondary)]"
                    >
                      {row.label}
                    </th>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-4">
                        {row.render(plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-6 text-xs leading-relaxed text-[var(--text-secondary)] font-medium">
            Les consommations hors forfait (minutes PSTN, SMS, messages) sont facturées au tarif de
            la destination. Des protections techniques d&apos;usage loyal s&apos;appliquent et ne
            constituent pas un quota commercial.
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-7xl mx-auto w-full py-12">
        <SectionHeading
          title="Modules complémentaires"
          subtitle="Des capacités additionnelles, activables séparément. Certaines sont déjà incluses dans l'offre Premium."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ADD_ONS.map((addon) => (
            <div
              key={addon.title}
              className="rounded-[var(--radius-panel)] glass-panel-premium p-6 flex flex-col gap-3"
            >
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {addon.title}
              </h3>
              {addon.includedIn ? (
                <div className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 self-start">
                  Inclus dans {addon.includedIn}
                </div>
              ) : null}
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                {addon.description}
              </p>
              <ul className="space-y-2 mt-auto">
                {addon.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-[var(--text-secondary)] font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="text-emerald-400 shrink-0 mt-0.5"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-4 w-full py-2.5 rounded-full text-center text-sm font-bold bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Demander un devis
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-[var(--text-secondary)]">
          Le tarif de chaque module complémentaire fait l&apos;objet d&apos;un devis établi selon votre
          volume. Aucun module n&apos;est ajouté à votre abonnement sans votre accord.
        </p>
      </section>

      <section className="px-5 sm:px-6 max-w-3xl mx-auto w-full py-12">
        <SectionHeading
          title="Questions fréquentes"
          subtitle="Abonnement, renouvellement, consommation et remboursement."
        />
        <FAQAccordion items={FAQ_ITEMS} />
        <p className="mt-8 text-sm text-[var(--text-secondary)]">
          Le détail complet des conditions de remboursement figure dans la{" "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            politique de remboursement
          </Link>
          , les conditions d&apos;utilisation du service dans les{" "}
          <Link href="/terms" className="underline underline-offset-4">
            conditions générales
          </Link>
          .
        </p>
      </section>

      <section className="px-5 sm:px-6 max-w-7xl mx-auto w-full pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}
