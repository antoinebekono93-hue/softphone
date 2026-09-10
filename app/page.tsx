import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  HeroSection,
  TrustBar,
  ProductTabs,
  ProductShowcase,
  StatsBar,
  CaseStudies,
  AwardsSection,
  IndustrySolutions,
  ComplianceBadges,
  ThoughtLeadership,
  FinalCTA,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-rose-500/30 font-sans overflow-x-hidden">
      {/* CSS personnalisé pour les animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* 1. Header (Minimalist Navigation) */}
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 mx-auto w-full z-50 bg-[var(--bg-base)]/70 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-md n8n-gradient-bg shadow-[0_0_15px_rgba(255,87,87,0.4)]"></div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Antigravity</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-[var(--text-secondary)]">
            <Link href="#solutions" className="hover:text-[var(--text-primary)] transition-colors">Solutions</Link>
            <Link href="#features" className="hover:text-[var(--text-primary)] transition-colors">Fonctionnalités</Link>
            <Link href="#integrations" className="hover:text-[var(--text-primary)] transition-colors">Intégrations</Link>
          </nav>
          <div className="flex gap-4 items-center flex-1 justify-end">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-medium n8n-gradient-bg text-white px-4 py-2 rounded-full transition-transform hover:scale-105 shadow-lg shadow-rose-500/20">
              Essai Gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero */}
      <HeroSection />

      {/* 3. Social Proof / Trust Marquee double rangée */}
      <TrustBar />

      {/* 4. Persona Tabs */}
      <ProductTabs />

      {/* 5. Features Bento Grid */}
      <ProductShowcase />

      {/* 6. Stats & Reliability */}
      <StatsBar />

      {/* 7. Case Studies */}
      <CaseStudies />

      {/* 8. Awards */}
      <AwardsSection />

      {/* 9. Industry Solutions */}
      <IndustrySolutions />

      {/* 10. Compliance */}
      <ComplianceBadges />

      {/* 11. Thought Leadership */}
      <ThoughtLeadership />

      {/* 12. Integrations Banner */}
      <section id="integrations" className="py-24 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-[var(--text-primary)]">S'intègre avec votre <span className="text-gradient">écosystème actuel.</span></h2>
           <div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-2xl font-bold text-[var(--text-primary)]">Telnyx</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">HubSpot</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Salesforce</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Zendesk</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Spike</div>
           </div>
        </div>
      </section>

      {/* 13. Final CTA */}
      <FinalCTA />

      {/* 14. Footer */}
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
            <Link href="#features" className="hover:text-[var(--text-primary)] transition-colors">Fonctionnalités</Link>
            <Link href="#integrations" className="hover:text-[var(--text-primary)] transition-colors">Intégrations</Link>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Ressources</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Documentation API</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Centre d'Aide</Link>
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