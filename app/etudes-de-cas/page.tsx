import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, CaseFilters } from "@/components/marketing";
import type { CaseStudy } from "@/components/marketing";
import { FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Études de cas | Antigravity",
  description:
    "Comment les équipes automatisent leurs appels, qualifient leurs prospects et libèrent des heures avec Antigravity. 10 000+ entreprises nous font confiance en France et en Afrique.",
};

const featuredStudy: CaseStudy = {
  company: "Saint-Gobain Distribution",
  sector: "Industrie",
  solution: "IA Vocale",
  size: "+10 000 employés",
  country: "France",
  summary:
    "Les équipes d'agences passaient 40% de leur temps à relancer des appels entrants sans réponse. Antigravity a automatiquement attribué un numéro sous chaque chef de secteur.",
  stats: [
    { value: "−42%", label: "d'appels manqués en 3 mois" },
    { value: "18k", label: "appels traités /jour" },
    { value: "2,1x", label: "de commandes confirmées" },
  ],
  quote: "Nos agences répondent maintenant à tous les appels, même quand tout le monde est en tournée.",
  author: "Directeur des opérations commerciales",
  initials: "SD",
};

const studies: CaseStudy[] = [
  {
    company: "Clinique Vivalto Santé",
    sector: "Santé",
    solution: "Répondeur IA",
    size: "500 employés",
    country: "France",
    summary:
      "Standard saturé chaque matin. Le répondeur IA prend les rendez-vous de manière autonome et réduit la charge du secrétariat de 60%.",
    stats: [
      { value: "−60%", label: "de charge du standard" },
      { value: "3 400", label: "rendez-vous automatiques/mois" },
      { value: "9,4/10", label: "satisfaction patients" },
    ],
    quote: "Les patients appellent à 22h, l'IA répond. Le matin, tout est déjà organisé.",
    author: "Responsable du secrétariat médical",
    initials: "CV",
  },
  {
    company: "Cabinet Legrand & Associés",
    sector: "Juridique",
    solution: "IA Vocale",
    size: "25 employés",
    country: "France",
    summary:
      "Des appels professionnels en attente depuis des semaines. Le cabinet utilise l'IA pour qualifier les consultations en toute confidentialité et réduire les abandons.",
    stats: [
      { value: "+68%", label: "de consultations réservées" },
      { value: "0", label: "appel abandonné" },
      { value: "3 h", label: "économisées par avocat /semaine" },
    ],
    quote: "Nous retrouvons des heures perdues et une image de disponible, vraiment.",
    author: "Associée fondatrice",
    initials: "LA",
  },
  {
    company: "Maison de la Décoration",
    sector: "Commerce",
    solution: "Répondeur IA",
    size: "40 employés",
    country: "France",
    summary:
      "Une enseigne e-commerce de décoration dont le téléphone sous-traité était injoignable aux heures de pointe. Le répondeur IA traite commandes et retours sans file d'attente.",
    stats: [
      { value: "+31%", label: "de ventes assistées par téléphone" },
      { value: "1,4 min", label: "temps moyen avant prise en charge" },
      { value: "−52%", label: "de réclamations retours" },
    ],
    quote: "Le téléphone est redevenu un canal commercial, pas une corvée.",
    author: "Directrice e-commerce",
    initials: "MD",
  },
  {
    company: "Korrus Immobilier",
    sector: "Immobilier",
    solution: "Répondeur IA",
    size: "120 employés",
    country: "France",
    summary:
      "Les prospects appellent le week-end, quand personne ne décroche. L'IA qualifie, fixe les visites et rappelle automatiquement les non-joignables.",
    stats: [
      { value: "+2,6x", label: "de visites programmées" },
      { value: "58%", label: "de leads qualifiés la nuit" },
      { value: "24h", label: "de réponse au lieu de 2 jours" },
    ],
    quote: "Nos commerciaux trouvent le matin un pipeline déjà qualifié.",
    author: "Directrice des agences",
    initials: "KI",
  },
  {
    company: "Hôtels Côte Vermeille",
    sector: "Hôtellerie",
    solution: "Répondeur IA",
    size: "300 employés",
    country: "France",
    summary:
      "Réceptionnistes débordés, réservations perdues à l'enregistrement des appels. Antigravity prend les réservations 24/7 et synchronise le PMS.",
    stats: [
      { value: "+19%", label: "de réservations directes" },
      { value: "90%", label: "des appels traités en autonomie" },
      { value: "€12k", label: "de commissions économisées /mois" },
    ],
    quote: "Nous vendons des chambres même quand la réception dort.",
    author: "Directeur des opérations",
    initials: "HC",
  },
  {
    company: "Crédit Agricole Île-de-France",
    sector: "Finance",
    solution: "Softphone & Communications",
    size: "+5 000 employés",
    country: "France",
    summary:
      "Déploiement d'une téléphonie IA pour les conseillers : rapports de congés, relances clients et qualification des appels en agence, sans aucun coût à la minute.",
    stats: [
      { value: "65%", label: "d'appels routés en automatique" },
      { value: "−38%", label: "de coût télécom par agence" },
      { value: "4 500", label: "conseillers équipés" },
    ],
    quote: "La téléphonie est devenue un actif, plus un coût de ligne.",
    author: "Directrice du digital relationnel",
    initials: "CA",
  },
  {
    company: "Transports GregLine",
    sector: "Logistique",
    solution: "IA Vocale",
    size: "800 employés",
    country: "France",
    summary:
      "Un dépôt où 40% des appels tombaient sur répondeur. L'IA confirme les livraisons, signale les retards et analyse les notes pour prioriser les remises.",
    stats: [
      { value: "−93%", label: "d'appels non suivis" },
      { value: "+22%", label: "de livraisons dans les délais" },
      { value: "6,5 min", label: "d'économie par appel" },
    ],
    quote: "Notre flotte appelle, l'IA capte, et les conducteurs restent sur la route.",
    author: "Responsable logistique",
    initials: "TG",
  },
  {
    company: "Avenir Santé Pharma",
    sector: "Pharmacie",
    solution: "Répondeur IA",
    size: "60 employés",
    country: "France",
    summary:
      "Une pharmacie de quartier submergée par les appels de renouvellement d'ordonnances. L'IA prépare les commandes et réduit l'attente en officine.",
    stats: [
      { value: "−47%", label: "d'appels entrant au comptoir" },
      { value: "3 min", label: "de préparation avant retrait" },
      { value: "+14%", label: "de panier moyen au drive" },
    ],
    quote: "L'équipe se concentre sur le conseil, pas sur le décroché.",
    author: "Pharmacienne titulaire",
    initials: "AP",
  },
  {
    company: "Auto Nexo Distribution",
    sector: "Automobile",
    solution: "IA Vocale",
    size: "450 employés",
    country: "France",
    summary:
      "Un réseau de concessions qui a automatisé la prise de rendez-vous atelier et la qualification des leads voitures neuves, connecté à son CRM national.",
    stats: [
      { value: "+2x", label: "de demandes d'essais" },
      { value: "78%", label: "de rendez-vous atelier en autonomie" },
      { value: "€2M", label: "de chiffre d'affaires mensuel récupéré" },
    ],
    quote: "Chaque lead au volant est désormais suivi, de l'appel à l'achat.",
    author: "Directeur digital réseau",
    initials: "AN",
  },
];

const filtersHint = "Filtrez par secteur ou par solution pour trouver l'inspiration.";

export default function CaseStudiesPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Études de cas clients"
        accent="cyan"
        title={
          <>
            Des équipes qui ont <span className="n8n-gradient-text">arrêté de perdre des appels</span>
          </>
        }
        subtitle="10 000+ entreprises nous font confiance en France et en Afrique. Voici comment elles automatisent leur téléphonie, sans casser leur organisation."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Essayer gratuitement
        </Link>
        <Link href="/pricing" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Voir les tarifs
        </Link>
      </PageHero>

      {/* Featured study */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-[32px] glass-panel-premium overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-3 p-8 md:p-12 flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  {featuredStudy.solution}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-secondary)]">
                  {featuredStudy.size}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-secondary)]">
                  {featuredStudy.sector}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {featuredStudy.company}
              </h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-lg">{featuredStudy.summary}</p>
              <div className="grid grid-cols-3 gap-4">
                {featuredStudy.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-4 text-center">
                    <div className="text-2xl md:text-3xl font-extrabold n8n-gradient-text">{s.value}</div>
                    <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
              <blockquote className="border-l-2 border-rose-500/50 pl-4 italic text-[var(--text-secondary)] font-medium">
                « {featuredStudy.quote} »
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full n8n-gradient-bg flex items-center justify-center text-white font-bold text-sm">
                  {featuredStudy.initials}
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{featuredStudy.author}</div>
              </div>
            </div>
            <div className="lg:col-span-2 relative min-h-[320px] flex items-center justify-center">
              <div className="absolute inset-0 n8n-gradient-bg opacity-20"></div>
              <div className="relative p-10 text-center flex flex-col gap-4">
                <div className="text-6xl font-extrabold n8n-gradient-text">18 000</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">appels traités chaque jour par l'IA sur ce réseau national</div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Déploiement : 6 semaines · 94 agences
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid filtrable */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading title="Explorer les résultats" subtitle={filtersHint} />
        <CaseFilters cases={studies} />
      </section>

      {/* Stats band */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="relative overflow-hidden glass-panel-premium rounded-[40px] px-6 py-16 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10 000+", label: "entreprises ayant déjà traité un appel IA" },
              { value: "3,4 M", label: "d'appels traités par mois" },
              { value: "−47%", label: "d'appels manqués en moyenne" },
              { value: "99,99%", label: "de disponibilité garantie" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-3">
                <div className="text-4xl md:text-5xl font-extrabold tracking-tight n8n-gradient-text">{s.value}</div>
                <div className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignage complet */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-[32px] glass-panel-premium p-8 md:p-12 max-w-4xl mx-auto text-center flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <p className="text-lg md:text-xl text-[var(--text-primary)] font-medium leading-relaxed">
            « En 7 semaines, le répondeur IA répondait à tous les appels de nos agences. Nous avons récupéré des dizaines de milliers d'euros de commandes qui partaient ailleurs faute de réponse. »
          </p>
          <div className="text-sm font-bold text-[var(--text-primary)]">Directeur des systèmes d'information</div>
          <div className="text-xs font-bold text-[var(--text-secondary)]">Groupe multiservice · 1 400 employés</div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}