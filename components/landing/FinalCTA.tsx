import Link from "next/link";
import type { CSSProperties } from "react";
import { WordReveal } from "./motion";

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

export default function FinalCTA() {
  return (
    <section className="landing-section landing-final-cta landing-container max-w-7xl mx-auto w-full text-center relative overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      <h2 className="landing-final-heading font-extrabold tracking-tight mb-8 text-[var(--text-primary)]">
        <WordReveal text="Prêt à moderniser" delay={0.05} />
        {" "}
        <span className="n8n-gradient-text">
          <WordReveal text="votre téléphonie ?" delay={0.25} />
        </span>
      </h2>

      <p
        className="reveal landing-body text-[var(--text-secondary)] mb-6 font-medium"
        style={{ "--reveal-delay": "0.55s" } as CssVars}
      >
        Déployable en 2 minutes. Sans engagement.
      </p>

      <div className="landing-actions mb-6">
        {[
          <Link key="1" href="/register" className="landing-button inline-flex font-semibold n8n-gradient-bg text-white  rounded-full shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all items-center gap-2">
            Créer un compte <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>,
          <Link key="2" href="/pricing" className="landing-button inline-flex font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]  rounded-full transition-all items-center gap-2">
            Voir les tarifs
          </Link>,
          <Link key="3" href="/register" className="landing-button inline-flex font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]  rounded-full transition-colors items-center gap-2">
            Parler à un expert
          </Link>,
        ].map((node, i) => (
          <div key={i} className="reveal landing-action" style={{ "--reveal-delay": `${0.7 + i * 0.1}s` } as CssVars}>
            {node}
          </div>
        ))}
      </div>

      <p
        className="reveal text-sm font-medium text-[var(--text-secondary)]"
        style={{ "--reveal-delay": "1s" } as CssVars}
      >
        Compte sans engagement · Abonnement mensuel renouvelé automatiquement, annulable à tout moment
        · Tarifs publics
      </p>
    </section>
  );
}
