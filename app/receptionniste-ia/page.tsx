import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, FAQAccordion, ROIBand, InteractiveTabs } from "@/components/marketing";
import { TrustBar, ComplianceBadges, FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Réceptionniste IA 24/7 | Antigravity",
  description:
    "Ne manquez plus jamais un appel. Votre réceptionniste IA répond en 0,5 seconde, qualifie les prospects, prend les rendez-vous et protège votre marque — 24h/24, 7j/7.",
};

const benefits = [
  {
    title: "Répond en 0,5 seconde",
    description: "Aucun appel perdu, aucun « rappelez-nous ». Votre IA décroche dès la première sonnerie, même à 2h du matin.",
    icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  },
  {
    title: "Qualifie chaque appelant",
    description: "L'IA identifie le besoin, l'urgence et le budget, puis route vers le bon agent avec un résumé complet.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Prend les rendez-vous",
    description: "Suggestions de créneaux, confirmation par SMS et synchronisation automatique avec votre calendrier.",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  {
    title: "Parle votre langue",
    description: "Français, anglais et plus de 30 langues, avec le ton de votre marque et vos phrases-personnalité.",
    icon: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  },
];

const showcase = [
  {
    title: "Avec réceptionniste IA",
    points: [
      "Réponse immédiate, 24h/24",
      "Le prospect est qualifié et résumé avant de vous parler",
      "Rendez-vous confirmés par SMS automatiquement",
      "Chaque échange analysé pour améliorer votre pipeline",
    ],
    accent: "from-rose-500 to-orange-500",
  },
  {
    title: "Sans réceptionniste IA",
    points: [
      "Appels manqués hors horaires ou pendant les pics",
      "Importantes infos perdues entre clients et agents",
      "Relances manuelles, créneaux à disputer",
      "Aucune visibilité sur ce qui a été réellement dit",
    ],
    accent: "from-slate-600 to-slate-500",
  },
];

const useCases = [
  {
    id: "manques",
    label: "Appels manqués",
    content: (
      <div className="rounded-[24px] glass-panel-premium p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-[var(--text-primary)]">Zéro appel perdu</h3>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
            En moyenne, une PME manque 28% de ses appels entrants pendant les pics d&apos;activité. Votre réceptionniste IA répond à tous, enregistre le motif, puis vous rappelle — ou fait suivre le dossier à un agent disponible.
          </p>
          <ul className="space-y-3">
            {["Décrochage instantané 24/7", "Message et motif capturés", "Rappel automatique ou transfert"].map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">28%</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">d&apos;appels manqués en moyenne sans IA</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">0</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">appel manqué avec le répondeur IA</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "rendezvous",
    label: "Prise de rendez-vous",
    content: (
      <div className="rounded-[24px] glass-panel-premium p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-[var(--text-primary)]">Votre agenda se remplit tout seul</h3>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
            L&apos;IA consulte vos disponibilités, propose des créneaux, confirme par SMS et ajoute l&apos;événement au calendrier. Vos commerciaux ne passent plus leur temps à caller.
          </p>
          <ul className="space-y-3">
            {["Suggestions de créneaux en temps réel", "Confirmation par SMS", "Synchro Google Calendar / Outlook"].map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">+32%</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">de rendez-vous confirmés, 4x plus vite</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">13 min</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">gagnées par rendez-vous pour vos agents</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "support",
    label: "Support client",
    content: (
      <div className="rounded-[24px] glass-panel-premium p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-[var(--text-primary)]">Suivi des tickets à toutes heures</h3>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
            Statut de commande, question de facturation, incident technique : votre réceptionniste IA répond avec la mémoire de vos documents et remonte les cas sensibles à un humain.
          </p>
          <ul className="space-y-3">
            {["Réponses depuis votre base RAG", "Escalade automatique vers un agent", "Résolution sans attente ni menu vocal"].map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">−47%</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">de charge répétitive pour le support</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">24/7</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">disponibilité, sans pause</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "qualification",
    label: "Qualification des leads",
    content: (
      <div className="rounded-[24px] glass-panel-premium p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-[var(--text-primary)]">Des leads prêts à acheter</h3>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
            L&apos;IA pose les bonnes questions, qualifie le besoin, le budget et l&apos;urgence, puis transmet une fiche complète à votre équipe. Elle rappelle même automatiquement les non-joignables.
          </p>
          <ul className="space-y-3">
            {["Fiche lead pré-remplie avant le transfert", "Score de qualification basé sur vos critères", "Relances automatiques des non-joignables"].map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">+41%</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">de leads qualifiés transmis aux ventes</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">2,3x</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2">plus de rappels réussis</div>
          </div>
        </div>
      </div>
    ),
  },
];

const setupSteps = [
  {
    step: "01",
    title: "Connectez votre numéro",
    description: "Importez votre numéro existant ou activez un nouveau numéro en quelques minutes, sans matériel.",
  },
  {
    step: "02",
    title: "Entraînez l'IA sur votre marque",
    description: "Chargez vos documents, définissez le ton, la langue et les scénarios de réponse. Zéro code.",
  },
  {
    step: "03",
    title: "Activez et analysez",
    description: "Testez en ligne réelle, suivez les scores de satisfaction et ajustez en continu vos tableaux de bord.",
  },
];

const deepFeatures = [
  { title: "Synthèse vocale ultraréaliste", description: "Voix naturelle, intonations et accents pour des échanges fluides et professionnels." },
  { title: "Mémoire de conversation", description: "Chaque client est identifié au numéro : historique, préférences et contexte disponibles." },
  { title: "Rétention de mémoire (RAG)", description: "Réponses basées sur vos documents internes (tarifs, FAQ, CGV) avec sources." },
  { title: "Vocabulaire métier", description: "Termes sectoriels, noms de produits et expressions propres à votre activité." },
  { title: "Text-to-Speech / ElevenLabs", description: "Clonage vocal et voix multilingues au choix depuis le laboratoire vocal." },
  { title: "Transfert assisté", description: "Résumé synthétique transmis à l'agent humain avant connexion du client." },
  { title: "Anonymisation des données", description: "Données personnelles détectées et masquées dans les transcriptions et extractions." },
  { title: "Multilingue 30+ langues", description: "La même IA répond dans la langue de votre client, automatiquement." },
];

const testimonials = [
  {
    quote:
      "Nous ne manquons plus un appel depuis 6 mois. Le répondeur IA qualifie nos prospects la nuit et nos commerciaux les rappellent le matin avec une fiche déjà complète.",
    author: "Directrice commerciale",
    company: "Cabinet immobilier · Lyon",
    initials: "CI",
  },
  {
    quote:
      "La prise de rendez-vous automatique a libéré deux jours par mois à notre standard. Et les patients apprécient de pouvoir appeler à 22h.",
    author: "Responsable accueil",
    company: "Centre médical · Bordeaux",
    initials: "CM",
  },
];

const faqItems = [
  {
    question: "Combien de temps faut-il pour configurer le répondeur IA ?",
    answer:
      "Comptez 15 minutes pour connecter votre numéro et activer l'IA. La personnalisation (documents, ton, scénarios) se fait ensuite en continu depuis le dashboard, sans aucune compétence technique.",
  },
  {
    question: "L'IA peut-elle transférer à un agent humain ?",
    answer:
      "Oui. L'IA qualifie la demande puis transfère à l'agent le plus pertinent avec un résumé complet de la conversation, afin que le client n'ait rien à répéter.",
  },
  {
    question: "Est-ce que mes clients remarquent qu'ils parlent à une IA ?",
    answer:
      "Notre synthèse vocale est suffisamment naturelle pour des échanges fluides. Vous restez transparent si vous le souhaitez : l'IA se présente clairement et peut passer la main à un humain à la demande.",
  },
  {
    question: "Que se passe-t-il si l'appel dépasse un cas standard ?",
    answer:
      "L'IA est entraînée à remonter automatiquement les situations sensibles (urgence, réclamation, incident) vers un agent humain, en priorité.",
  },
  {
    question: "Mes données d'appels sont-elles utilisées pour entraîner des modèles ?",
    answer:
      "Non. Vos conversations restent isolées dans votre organisation. Les données personnelles sont anonymisées dans les transcriptions et nous ne réutilisons jamais vos contenus pour entraîner les modèles.",
  },
];

export default function AIReceptionistPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Répondeur IA 24/7 · Module complémentaire"
        accent="rose"
        title={
          <>
            Fini les appels manqués : <span className="n8n-gradient-text">votre réceptionniste IA répond en 0,5 seconde</span>
          </>
        }
        subtitle="Il décroche à votre place, qualifie, prend les rendez-vous et protège votre marque — jour et nuit, en 30+ langues."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Activer le répondeur IA
        </Link>
        <Link href="/pricing" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Voir les tarifs
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        <TrustBar />
      </div>

      {/* 4 bénéfices */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Un réceptionniste infatigable, disponible dès la première sonnerie"
          subtitle="Conçu pour ne jamais laisser un appelant sans réponse, tout en faisant gagner du temps à vos équipes."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-[24px] glass-panel-premium p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl n8n-gradient-bg flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,87,87,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{b.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROI */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <ROIBand
          stats={[
            { value: "99,99%", label: "uptime garanti de la plateforme" },
            { value: "0,5s", label: "pour répondre à chaque appel" },
            { value: "24/7", label: "disponibilité, sans congé" },
            { value: "30+", label: "langues parlées automatiquement" },
          ]}
        />
      </section>

      {/* Bénéfices alternés : avant/après */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Le même 9h-18h, mais sans aucun appel perdu" />
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {showcase.map((col) => (
            <div key={col.title} className="rounded-[24px] p-8 border border-[var(--border-subtle)]" style={{ background: col.accent === "from-rose-500 to-orange-500" ? "rgba(255,79,79,0.06)" : "var(--bg-surface-hover)" }}>
              <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-6">{col.title}</h3>
              <ul className="space-y-4">
                {col.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm font-medium text-[var(--text-secondary)]">
                    <span className="w-6 h-6 rounded-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] text-xs mt-0.5">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs par cas d'usage */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Un cas pour chaque situation"
          subtitle="Qu'il s'agisse d'appels manqués, de rendez-vous ou de support, le répondeur IA s'adapte."
        />
        <InteractiveTabs tabs={useCases} />
      </section>

      {/* Étapes de mise en place */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Opérationnel en 15 minutes" subtitle="Trois étapes, zéro code, zéro matériel." />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {setupSteps.map((s) => (
            <div key={s.step} className="rounded-[24px] glass-panel-premium p-8 relative">
              <div className="text-4xl font-extrabold n8n-gradient-text mb-4">{s.step}</div>
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-3">{s.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Sous le capot, une IA de production" subtitle="Des fonctionnalités conçues pour les entreprises, pas les démos." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deepFeatures.map((f) => (
            <div key={f.title} className="rounded-[20px] glass-panel-premium p-6 flex flex-col gap-3 border-t-2 border-t-rose-500/40">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{f.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Ils ne manquent plus un appel" />
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-[24px] glass-panel-premium p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-[var(--text-primary)] font-medium leading-relaxed">« {t.quote} »</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full n8n-gradient-bg flex items-center justify-center text-white font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">{t.author}</div>
                  <div className="text-xs font-bold text-[var(--text-secondary)]">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sécurité */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <ComplianceBadges />
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Questions fréquentes" />
        <FAQAccordion items={faqItems} />
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}