import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, FAQAccordion, ROIBand } from "@/components/marketing";
import { TrustBar, ComplianceBadges, FinalCTA } from "@/components/landing";

export const metadata = {
  title: "IA Vocale Antigravity | Téléphonie intelligente",
  description:
    "Une plateforme IA qui écoute, comprend et agit sur chaque appel : agents vocaux, mémoire RAG, synthèse vocale, routage intelligent et analytiques. 10 000+ entreprises l'utilisent déjà.",
};

const flywheelSteps = [
  { title: "Appel entrant", description: "Votre numéro sonne, l'IA décroche en 0,5s et identifie le client.", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" },
  { title: "Compréhension", description: "Transcription temps réel, sentiment et intention extraits à chaque phrase.", icon: "M11 3.055A9 9 0 1 0 20.945 13H11V3.055zM20.488 9H15V3.512A9.025 9.025 0 0 1 20.488 9z" },
  { title: "Décision", description: "L'IA applique vos règles : répond, qualifie, transfère ou planifie.", icon: "M10 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm4-8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3.54 7.46a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8.54 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM20 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { title: "Action", description: "CRM mis à jour, rendez-vous calendrier, relance SMS envoyée.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

const aiProducts = [
  { title: "Agents IA", description: "Créez des agents vocaux avec personnalité, ton et scénarios métier.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", href: "/dashboard/ai-agents" },
  { title: "Laboratoire vocal", description: "Écoutez, comparez et ajustez les voix de vos agents temps réel.", icon: "M9 18V5l12-2v13M9 9l12-2", href: "/dashboard/voice-lab" },
  { title: "Mémoire RAG", description: "Rattachez vos documents et créez une base de connaissances répondante.", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z", href: "/dashboard/rag-memory" },
  { title: "Text-to-Speech", description: "Synthèse vocale multilingue ultraréaliste, voices clonables.", icon: "M18.364 5.636a9 9 0 0 1 0 12.728M21.485 2.515a14.5 14.5 0 0 1 0 18.97M12 2.481l-3.5 3.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4.5l3.5 3.5V2.48z", href: "/dashboard/tts" },
  { title: "Routage & IVR", description: "Menus vocaux et routage intelligent par intention et compétence.", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", href: "/dashboard/ivr" },
  { title: "Analytiques", description: "Sentiment, sujets, taux de conversion : la téléphonie mesurable.", icon: "M3 3v18h18M18 17V9M13 17V5M8 17v-3", href: "/dashboard/analytics" },
];

const channels = [
  { title: "Voix", description: "Le cœur du système : appels entrants et sortants gérés par l'IA.", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" },
  { title: "WhatsApp", description: "Le même agent répond sur WhatsApp, avec historique partagé.", icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" },
  { title: "SMS", description: "Confirmations, relances et notifications administrées par l'IA.", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { title: "Instagram", description: "Commentaires filtrés et messages privés traités par vos agents.", icon: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27z" },
];

const faqItems = [
  {
    question: "Antigravity remplace-t-il mon téléphone actuel ?",
    answer:
      "Oui. Vous conservez votre numéro (portabilité gratuite) et vous basculez vers la softphone Antigravity et ses numéros. Aucun matériel à installer : tout fonctionne dans le navigateur ou l'application.",
  },
  {
    question: "Quels autres canaux les agents IA gèrent-ils ?",
    answer:
      "Voix, WhatsApp, SMS et Instagram. Un même agent garde la mémoire de la conversation quel que soit le canal : votre client n'a jamais à se répéter.",
  },
  {
    question: "Comment l'IA apprend-elle mon métier ?",
    answer:
      "Vous chargez vos documents (tarifs, FAQ, CGV) dans la mémoire RAG, définissez des scénarios et le ton. L'IA s'améliore à chaque appel : chaque transcription enrichit la base sans jamais être utilisée hors de votre organisation.",
  },
  {
    question: "Puis-je écouter les conversations ?",
    answer:
      "Oui. Chaque appel dispose d'une transcription et d'un enregistrement (selon plan), avec résumé automatique, sentiment et tags. Tout est consultable dans le dashboard et exportable.",
  },
  {
    question: "La plateforme est-elle internationale ?",
    answer:
      "Oui. Numéros français, africains, européens et internationaux (plan Premium). La synthèse vocale gère 30+ langues et l'IA bascule automatiquement sur la langue de votre client.",
  },
];

export default function AISummaryPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Plateforme IA Vocale"
        accent="blue"
        title={
          <>
            La téléphonie qui <span className="n8n-gradient-text">écoute, comprend et agit</span>
          </>
        }
        subtitle="Antigravity transforme chaque appel en donnée actionnable : transcription, sentiment, qualification, CRM, rendez-vous. Tout est automatisé, tout est mesuré."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Essayer l'IA vocale
        </Link>
        <Link href="/receptionniste-ia" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Le répondeur IA, pas à pas
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        <TrustBar />
      </div>

      {/* Flywheel */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Une boucle qui s'auto-améliore"
          subtitle="Chaque appel alimente le suivant : l'IA décroche en 0,5 seconde, traite, mesure et s'améliore à chaque échange, avec vos données."
        />
        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0"></div>
          {flywheelSteps.map((step) => (
            <div key={step.title} className="rounded-[24px] glass-panel-premium p-6 flex flex-col gap-4 relative">
              <div className="w-12 h-12 rounded-2xl n8n-gradient-bg flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,87,87,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={step.icon} /></svg>
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Produits IA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Une plateforme, six briques"
          subtitle="Composez votre téléphonie IA : agents, voix, mémoire, routage et analytiques fonctionnent ensemble ou séparément."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiProducts.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group rounded-[24px] glass-panel-premium p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex items-center justify-center text-rose-400 group-hover:text-rose-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={product.icon} /></svg>
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-rose-400 transition-colors">{product.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{product.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Canaux */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Un agent, tous vos canaux"
          subtitle="La conversation continue où votre client est : au téléphone ou en message."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map((c) => (
            <div key={c.title} className="rounded-[24px] glass-panel-premium p-6 flex flex-col gap-4 border-t-2 border-t-rose-500/40">
              <div className="w-11 h-11 rounded-xl n8n-gradient-bg flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{c.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROI */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <ROIBand
          stats={[
            { value: "10 000+", label: "entreprises sur la plateforme" },
            { value: "3,4 M", label: "d'appels traités par mois" },
            { value: "30+", label: "langues parlées par l'IA" },
            { value: "99,99%", label: "uptime garanti" },
          ]}
        />
      </section>

      {/* Sécurité */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <ComplianceBadges />
        <p className="text-center text-sm text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mt-8">
          Vos conversations sont isolées dans votre organisation : elles ne servent jamais à entraîner des modèles partagés. Données personnelles anonymisées, enregistrements chiffrés, connexions sécurisées TLS de bout en bout.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Questions fréquentes" subtitle="Le fonctionnement de la plateforme en toute transparence." />
        <FAQAccordion items={faqItems} />
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}