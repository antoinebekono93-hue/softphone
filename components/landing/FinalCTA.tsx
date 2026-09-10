import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-32 px-4 max-w-7xl mx-auto w-full text-center">
      <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-[var(--text-primary)]">
        Prêt à moderniser <br/> <span className="n8n-gradient-text">votre téléphonie ?</span>
      </h2>
      <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium">
        Déployable en 2 minutes. Sans engagement.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10">
        <Link href="/register" className="inline-flex text-lg font-semibold n8n-gradient-bg text-white px-10 py-5 rounded-full shadow-lg shadow-rose-500/30 hover:scale-105 transition-all items-center gap-2">
          Commencer l'essai gratuit de 14 jours <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
        <Link href="/pricing" className="inline-flex text-lg font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] px-10 py-5 rounded-full transition-all items-center gap-2">
          Voir les tarifs
        </Link>
        <Link href="/register" className="inline-flex text-lg font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-5 rounded-full transition-colors items-center gap-2">
          Parler à un expert
        </Link>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        Essai gratuit 14 jours · Aucune carte bancaire requise · Sans engagement
      </p>
    </section>
  );
}