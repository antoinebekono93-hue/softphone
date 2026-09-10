import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, IntegrationSearch } from "@/components/marketing";
import type { Integration } from "@/components/marketing";
import { FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Intégrations | Antigravity",
  description:
    "Connectez Antigravity à vos outils du quotidien : CRM, helpdesk, calendriers, IA et webhooks. 50+ intégrations natives et une API complète.",
};

const integrations: Integration[] = [
  { name: "HubSpot", category: "CRM", description: "Synchronisation des appels, leads et rendez-vous directement dans votre pipeline CRM.", icon: "H", status: "native" },
  { name: "Salesforce", category: "CRM", description: "Journal d'appels, fiches client et activités IA poussées en temps réel.", icon: "SF", status: "native" },
  { name: "Pipedrive", category: "CRM", description: "Créez et mettez à jour des deals à partir de chaque appel qualifié.", icon: "P", status: "native" },
  { name: "Zoho CRM", category: "CRM", description: "Associez vos agents IA aux leads Zoho et automatisez le suivi.", icon: "Z", status: "api" },
  { name: "Slack", category: "Productivité", description: "Notifications d'appel, résumés IA et alertes leads dans vos canaux.", icon: "S", status: "native" },
  { name: "Notion", category: "Productivité", description: "Exportez les notes d'appels et les comptes rendus vers votre base de connaissances.", icon: "N", status: "native" },
  { name: "Google Calendar", category: "Productivité", description: "Prise de rendez-vous IA avec détection automatique des créneaux libres.", icon: "GC", status: "native" },
  { name: "Outlook", category: "Productivité", description: "Synchronisation bidirectionnelle de votre agenda et des rendez-vous confirmés.", icon: "O", status: "native" },
  { name: "Trello", category: "Productivité", description: "Créez des cartes à partir d'un appel manqué ou d'un prospect qualifié.", icon: "T", status: "api" },
  { name: "OpenAI", category: "IA", description: "Agents vocaux entraînés sur GPT-4o pour des conversations personnalisées.", icon: "AI", status: "recommandee" },
  { name: "ElevenLabs", category: "IA", description: "Synthèse vocale ultraréaliste et clonage de voix depuis le laboratoire vocal.", icon: "EL", status: "recommandee" },
  { name: "Anthropic", category: "IA", description: "Raisonnement Claude pour la qualification complexe et l'analyse de sentiment.", icon: "A", status: "api" },
  { name: "Make", category: "IA", description: "Scénarios sans code qui déclenchent des actions à chaque événement d'appel.", icon: "M", status: "native" },
  { name: "Telnyx", category: "Téléphonie", description: "Réseau télécom de référence : numéros, qualificatifs et routage PSTN.", icon: "T", status: "recommandee" },
  { name: "Webhooks sortants", category: "Téléphonie", description: "Push en temps réel de chaque appel, transcription et compte-rendu vers votre stack.", icon: "{}", status: "native" },
  { name: "Zendesk", category: "Helpdesk", description: "Créez, mettez à jour et résolvez des tickets depuis les appels entrants.", icon: "Z", status: "native" },
  { name: "Intercom", category: "Helpdesk", description: "Unifiez le parcours support : appel IA puis conversation en appli.", icon: "I", status: "native" },
  { name: "Brevo", category: "Marketing", description: "Enrichissez vos campagnes avec les données d'appels et de qualification.", icon: "B", status: "api" },
  { name: "Mailchimp", category: "Marketing", description: "Audience enrichie des numéros qui ont réellement appelé.", icon: "MC", status: "api" },
];

const apiUseCases = [
  { title: "Callbacks & webhooks", description: "Recevez un POST à chaque événement : appel reçu, terminé, transcription, lead qualifié." },
  { title: "Langage", description: "REST + SDKs JavaScript/TypeScript, Python, avec keys API typées." },
  { title: "RAG privé", description: "Injectez n'importe quelle source : PDFs, Notion, base interne, pour les réponses." },
  { title: "Comptabilisation", description: "Facturation usage minute et enregistrements horodatés pour vos clients." },
];

export default function IntegrationsPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="50+ intégrations · API & webhooks"
        accent="violet"
        title={
          <>
            Votre téléphonie IA, <span className="n8n-gradient-text">connectée à votre stack</span>
          </>
        }
        subtitle="CRM, helpdesk, calendriers, IA : Antigravity synchronise vos appels avec les outils que votre équipe utilise déjà. Sans friction, sans codage."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Essayer gratuitement
        </Link>
        <Link href="#api" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Découvrir l'API
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
              <div className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-4">API & Webhooks</div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
                Intégrez Antigravity à n&apos;importe quel système
              </h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-8">
                Pas d&apos;intégration prête à l&apos;emploi pour votre outil métier ? Notre API documentée et nos webhooks couvrent tous les cas. Vos agents deviennent programmables.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="n8n-gradient-bg text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
                  Obtenir mes clés API
                </Link>
                <Link href="#" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
                  Documentation technique
                </Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {apiUseCases.map((u) => (
                <div key={u.title} className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-5 flex flex-col gap-2">
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">{u.title}</div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{u.description}</p>
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
          subtitle="Demandez une intégration ou construisez-la vous-même en quelques minutes."
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform text-center">
            Demander une intégration
          </Link>
          <Link href="/etudes-de-cas" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors text-center">
            Voir les cas clients connectés
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}