"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/site-config";

export type PricingPlanCard = {
  id: string;
  name: string;
  monthlyPrice: number;
  includedMinutes: number;
  includedSms: number;
  unlimitedCalls: boolean;
  internationalEnabled: boolean;
  hasRecording: boolean;
  hasTransfer: boolean;
  hasAdvancedAnalytics: boolean;
  hasCallRouting: boolean;
  numbersPolicy: string;
  features: string[];
  recommended: boolean;
};

const numberFormatter = new Intl.NumberFormat("fr-FR");

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-emerald-400 shrink-0 mt-1"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function DerivedFeatures({ plan }: { plan: PricingPlanCard }) {
  const derived: string[] = [];

  if (plan.unlimitedCalls) {
    derived.push("Appels internes app-to-app illimités");
  }

  derived.push(
    plan.includedMinutes > 0
      ? `${numberFormatter.format(plan.includedMinutes)} min PSTN incluses`
      : "Aucune minute PSTN incluse"
  );

  derived.push(
    plan.includedSms > 0
      ? `${numberFormatter.format(plan.includedSms)} SMS inclus`
      : "Aucun SMS inclus"
  );

  if (plan.internationalEnabled) {
    derived.push("Appels internationaux inclus");
  }
  if (plan.hasRecording) {
    derived.push("Enregistrement des appels");
  }
  if (plan.hasTransfer) {
    derived.push("Transfert d'appels");
  }
  if (plan.hasCallRouting) {
    derived.push("Routage intelligent des appels");
  }
  if (plan.hasAdvancedAnalytics) {
    derived.push("Analytiques avancées");
  }

  derived.push("Softphone web et mobile (PWA)");

  return derived;
}

export function PricingClient({ plans }: { plans: PricingPlanCard[] }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const derived = DerivedFeatures({ plan });
          const extra = plan.features.filter((feature) => !derived.includes(feature));

          return (
            <div
              key={plan.id}
              className={`rounded-[var(--radius-panel)] p-6 sm:p-7 relative flex flex-col border ${
                plan.recommended
                  ? "glass-panel-premium border-cyan-500/40"
                  : "glass-panel-premium"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 n8n-gradient-bg text-[11px] font-bold uppercase tracking-wider rounded-full text-white">
                  Recommandé
                </div>
              )}

              <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-5 min-h-[40px]">
                {plan.numbersPolicy}
              </p>

              <div className="mb-1">
                <span className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {formatPrice(plan.monthlyPrice)}
                </span>
                <span className="text-sm text-[var(--text-secondary)] font-medium"> / mois</span>
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-5">
                Prix de base Hors Taxes, facturé mensuellement
              </p>

              <Link
                href="/register"
                className={`w-full py-3 rounded-full text-center text-sm font-bold transition-all mb-4 ${
                  plan.recommended
                    ? "n8n-gradient-bg text-white shadow-lg shadow-cyan-500/25"
                    : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                Commencer
              </Link>

              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-3 py-2.5 mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Renouvellement
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Renouvellement automatique chaque mois jusqu&apos;à annulation. Annulable à tout
                  moment, sans frais, depuis votre espace.
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {[...derived, ...extra].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium"
                  >
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          Ce qui est compris, et ce qui est facturé en plus
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          <li>
            Le prix affiché est un abonnement logiciel mensuel renouvelé automatiquement. Il couvre
            l&apos;accès à la plateforme et les volumes inclus dans l&apos;offre.
          </li>
          <li>
            Les consommations au-delà de ces volumes (minutes PSTN, SMS, messages WhatsApp), les
            numéros supplémentaires et les modules complémentaires sont facturés en sus, au tarif en
            vigueur au moment de la consommation.
          </li>
          <li>
            Les appels internes entre utilisateurs de la plateforme sont inclus dans l&apos;abonnement
            lorsqu&apos;aucune limite d&apos;usage loyal ne s&apos;y applique. Les appels vers le réseau
            téléphonique public restent soumis au forfait de minutes ou au solde prépayé.
          </li>
        </ul>
      </div>
    </div>
  );
}
