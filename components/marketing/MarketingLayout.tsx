import Link from "next/link";
import MarketingHeader from "./MarketingHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-rose-500/30 font-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up { animation: none; opacity: 1; }
        }
      `}} />

      <MarketingHeader />

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-[var(--border-subtle)] pt-16 pb-8 px-6 max-w-7xl mx-auto w-full bg-[var(--bg-base)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-violet-500"></div>
              <span className="font-bold text-[var(--text-primary)]">Antigravity</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              Tous les systèmes opérationnels
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Produit</h4>
            <Link href="/receptionniste-ia" className="hover:text-[var(--text-primary)] transition-colors">Répondeur IA</Link>
            <Link href="/ia" className="hover:text-[var(--text-primary)] transition-colors">IA Vocale</Link>
            <Link href="/integrations" className="hover:text-[var(--text-primary)] transition-colors">Intégrations</Link>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Ressources</h4>
            <Link href="/etudes-de-cas" className="hover:text-[var(--text-primary)] transition-colors">Études de cas</Link>
            <Link href="/secteurs" className="hover:text-[var(--text-primary)] transition-colors">Solutions par secteur</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Centre d&apos;Aide</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Entreprise</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">À Propos</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">CGV</Link>
          </div>
        </div>
        <div className="text-center text-xs font-bold text-[var(--text-secondary)] pt-8 border-t border-[var(--border-subtle)]">
          © {new Date().getFullYear()} Antigravity Inc. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}