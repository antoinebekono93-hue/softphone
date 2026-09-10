"use client";

import { useState } from "react";
import Link from "next/link";

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
  features: string[];
  recommended: boolean;
};

const ANNUAL_DISCOUNT = 0.8;

const formatter = new Intl.NumberFormat("fr-FR");

export { ANNUAL_DISCOUNT };

export function PricingClient({ plans }: { plans: PricingPlanCard[] }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const isAnnual = billing === "annual";

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-14">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            billing === "monthly"
              ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling(isAnnual ? "monthly" : "annual")}
          aria-label="Basculer entre facturation mensuelle et annuelle"
          className="w-14 h-8 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] relative transition-colors shrink-0"
          role="switch"
          aria-checked={isAnnual}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full n8n-gradient-bg transition-all duration-200 ${isAnnual ? "left-7" : "left-1"}`}
          ></span>
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
            billing === "annual"
              ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Annuel
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            −20%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const price = isAnnual ? Math.round(plan.monthlyPrice * ANNUAL_DISCOUNT) : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`rounded-[28px] p-7 relative flex flex-col transition-all hover:-translate-y-0.5 ${
                plan.recommended
                  ? "glass-panel-premium border-rose-500/40 shadow-[0_0_48px_rgba(255,87,87,0.12)]"
                  : "glass-panel-premium"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 n8n-gradient-bg text-[11px] font-bold uppercase tracking-wider rounded-full text-white shadow-lg shadow-rose-500/30">
                  Recommandé
                </div>
              )}

              <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-1">{plan.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-5 min-h-[40px]">
                {plan.name === "Basic"
                  ? "Pour démarrer en toute simplicité."
                  : plan.name === "Standard"
                    ? "Le choix des équipes en croissance."
                    : plan.name === "Premium"
                      ? "Capacités internationales et analytiques avancées."
                      : plan.name === "Appels Illimités"
                        ? "Téléphonie app-to-app sans limite, au prix fixe."
                        : "Sans engagement, adaptable à tout moment."}
              </p>

              <div className="mb-1">
                <span className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">${price}</span>
                <span className="text-sm text-[var(--text-secondary)] font-medium"> /mois</span>
              </div>
              {isAnnual ? (
                <div className="text-xs font-bold text-emerald-400 mb-5 h-4">
                  Facturé {formatter.format(price * 12)}$/an
                </div>
              ) : (
                <div className="text-xs font-bold text-[var(--text-secondary)] mb-5 h-4">
                  Économisez {Math.round(plan.monthlyPrice * 0.2)}$ avec l&apos;annuel
                </div>
              )}

              <Link
                href="/register"
                className={`w-full py-3 rounded-full text-center text-sm font-bold transition-all mb-6 ${
                  plan.recommended
                    ? "n8n-gradient-bg text-white shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-95"
                    : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                Commencer
              </Link>

              <ul className="space-y-2.5 flex-1">
                {plan.features.length > 0 &&
                  plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                      {feature}
                    </li>
                  ))}
                <li className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  {plan.unlimitedCalls
                    ? "Appels app-to-app illimités"
                    : `${formatter.format(plan.includedMinutes)} min. PSTN incluses`}
                </li>
                {plan.internationalEnabled && (
                  <li className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    Appels internationaux
                  </li>
                )}
                {plan.hasRecording && (
                  <li className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    Enregistrement d&apos;appels
                  </li>
                )}
                {plan.hasCallRouting && (
                  <li className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    Routage intelligent IA
                  </li>
                )}
                {plan.hasAdvancedAnalytics && (
                  <li className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    Analytiques avancées
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-[var(--text-secondary)] font-medium mt-8">
        Appels PSTN hors forfait facturés à la consommation (prépayé wallet). Sans engagement, annulable à tout moment.
      </p>
    </div>
  );
}