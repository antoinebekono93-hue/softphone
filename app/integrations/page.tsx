import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, IntegrationSearch } from "@/components/marketing";
import type { Integration } from "@/components/marketing";
import { FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Intégrations | Antigravity",
  description:
    "Les intégrations réellement disponibles dans la plateforme : téléphonie PSTN, WhatsApp Business, Messenger et Instagram via Meta, IA vocale et webhooks sortants.",
};

const integrations: Integration[] = [
  {
    name: "Telnyx",
    category: "Téléphonie",
    description:
      "Couche opérateur de la plateforme : numéros, routage PSTN, SIP/WebRTC, SMS, WhatsApp et synthèse vocale.",
    icon: "T",
    status: "native",
  },
  {
    name: "WhatsApp Business",
    category: "Téléphonie",
    description:
      "Messagerie WhatsApp via l'API Telnyx : envoi, modèles de message, conversations et transfert vers un agent humain.",
    icon: "WA",
    status: "native",
  },
  {
    name: "Meta (Messenger, Instagram)",
    category: "Messagerie",
    description:
      "Connexion OAuth Meta et réception des messages Messenger et Instagram dans la boîte de réception unifiée.",
    icon: "M",
    status: "native",
  },
  {
    name: "OpenAI",
    category: "IA",
    description:
      "Moteurs d'IA vocale : conversation temps réel, transcription de la parole et modèles de langage pour les agents.",
    icon: "AI",
    status: "native",
  },
  {
    name: "Cloudflare TURN",
    category: "Infrastructure",
    description:
      "Serveurs TURN de relais réseau pour établir les appels WebRTC lorsque le réseau direct n'est pas possible.",
    icon: "CF",
    status: "native",
  },
  {
    name: "Webhooks sortants",
    category: "Infrastructure",
    description:
      "Recevez sur votre endpoint les événements de la plateforme (appels, transcriptions, tickets, messages) signés par secret.",
    icon: "{}",
    status: "native",
  },
  {
    name: "SMS",
    category: "Téléphonie",
    description:
      "Envoi et réception de SMS avec suivi des statuts, politiques d'envoi et historique dans la boîte de réception.",
    icon: "SMS",
    status: "native",
  },
];

const apiUseCases = [
  {
    title: "Événements d'appels",
    description: "Notification à votre endpoint lors d'un appel reçu, terminé ou transcrit.",
  },
  {
    title: "Signature des requêtes",
    description: "Chaque envoi sortant est authentifié par un secret propre à votre organisation.",
  },
  {
    title: "Sources de connaissance",
    description: "Importez des documents pour alimenter les réponses de vos agents vocaux.",
  },
  {
    title: "Mesure d'usage",
    description: "Historique horodaté des appels et des consommations par numéro.",
  },
];

export default function IntegrationsPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Intégrations disponibles · API & webhooks"
        accent="violet"
        title={
          <>
            Une téléphonie IA, <span className="n8n-gradient-text">connectée à vos outils</span>
          </>
        }
        subtitle="Voici les intégrations réellement présentes dans la plateforme aujourd'hui. Toute mention d'un éditeur signifie que ses API sont utilisées par Antigravity, et non que cette entreprise est notre cliente."
      >
        <Link
          href="/register"
          className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
        >
          Créer un compte
        </Link>
        <Link
          href="#api"
          className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          Découvrir les webhooks
        </Link>
      </PageHero>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <IntegrationSearch integrations={integrations} />
      </section>

      {/* API band */}
      <section id="api" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="rounded-[32px] glass-panel-premium p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">API & Webhooks</div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
                Reliez Antigravity à votre système
              </h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-8">
                Pour tout outil non listé ci-dessus, les webhooks sortants permettent de transmettre les événements de
                la plateforme vers votre propre stack, avec une authentification par secret.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="n8n-gradient-bg text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/contact"
                  className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Nous demander une intégration
                </Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {apiUseCases.map((u) => (
                <div
                  key={u.title}
                  className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-5 flex flex-col gap-2"
                >
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">{u.title}</div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {u.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Build your own */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Vous utilisez un outil en plus ?"
          subtitle="Dites-nous quel outil vous utilisez et nous évaluerons la connexion."
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform text-center"
          >
            Demander une intégration
          </Link>
          <Link
            href="/etudes-de-cas"
            className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors text-center"
          >
            Voir les scénarios d&apos;usage
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}