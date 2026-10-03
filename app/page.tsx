import Link from "next/link";
import type { Metadata } from "next";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { siteConfig } from "@/lib/site-config";
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

export const metadata: Metadata = {
  title: "Téléphonie professionnelle et agents vocaux IA",
  description:
    "Numéros professionnels, softphone web et mobile, appels internes, routage, SMS et WhatsApp, agents vocaux IA et analytiques : une plateforme de communication B2B.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: `${siteConfig.brand} — Téléphonie professionnelle et agents vocaux IA`,
    description:
      "Numéros professionnels, softphone cloud, routage d'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover, .animate-marquee-reverse:hover {
          animation-play-state: paused;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* 1. Header */}
      <MarketingHeader />

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
           <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-[var(--text-primary)]">S&apos;intègre avec votre <span className="text-gradient">écosystème actuel.</span></h2>
<div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-2xl font-bold text-[var(--text-primary)]">Telnyx</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">WhatsApp Business</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">Meta</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">OpenAI</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">Cloudflare TURN</div>
          </div>
          <p className="mt-6 text-xs font-medium text-[var(--text-secondary)] max-w-2xl mx-auto">
            Ces éditeurs fournissent les briques techniques utilisées par la plateforme. Leur mention n&apos;implique
            aucun partenariat commercial ni relation client.
          </p>
          <Link
            href="/integrations"
            className="inline-block mt-10 text-sm font-bold text-[var(--text-primary)] underline underline-offset-4"
          >
            Voir les intégrations disponibles
          </Link>
        </div>
      </section>

      {/* 13. Final CTA */}
      <FinalCTA />

      {/* 14. Footer */}
      <MarketingFooter />
    </div>
  );
}
