import Link from "next/link";

const caseStudies = [
  {
    company: "AXA",
    quote: "Antigravity a transformé la coordination de nos équipes commerciales à travers toute la France.",
    metric: "42%",
    metricLabel: "Augmentation de la satisfaction client",
    products: ["Phone", "IA Vocale"],
    color: "from-sky-500/20 to-transparent"
  },
  {
    company: "Bouygues",
    quote: "La nullité de la mise en place nous a permis de déployer sur plus de 100 agences en seulement 3 semaines.",
    metric: "30%",
    metricLabel: "Réduction des coûts de téléphonie",
    products: ["Phone", "Support Client", "IA Vocale"],
    color: "from-rose-500/20 to-transparent"
  },
  {
    company: "Vinci",
    quote: "Nos équipes terrain sont enfin joignables partout en France avec un seul et même numéro.",
    metric: "500+",
    metricLabel: "Employés connectés",
    products: ["Phone", "Support Client"],
    color: "from-emerald-500/20 to-transparent"
  },
  {
    company: "Decathlon",
    quote: "Le Répondeur IA 24/7 a révolutionné notre service client, même lorsque le magasin est fermé.",
    metric: "60%",
    metricLabel: "Résolution au premier contact",
    products: ["IA Vocale", "Intégrations"],
    color: "from-violet-500/20 to-transparent"
  }
];

const productColors: Record<string, string> = {
  "Phone": "text-orange-500 border-orange-500/30 bg-orange-500/10",
  "IA Vocale": "text-violet-500 border-violet-500/30 bg-violet-500/10",
  "Support Client": "text-rose-500 border-rose-500/30 bg-rose-500/10",
  "Intégrations": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
};

export default function CaseStudies() {
  return (
    <section className="py-24 px-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Adopté par des entreprises <span className="text-gradient">de toutes tailles</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">
            Découvrez comment nos clients transforment leurs communications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caseStudies.map((cs, i) => (
            <div key={i} className="rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${cs.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">{cs.company}</h3>
                </div>

                <blockquote className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed">
                  "{cs.quote}"
                </blockquote>

                <div className="flex items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="text-5xl font-extrabold n8n-gradient-text">{cs.metric}</div>
                    <div className="text-sm font-medium text-[var(--text-secondary)] mt-2">{cs.metricLabel}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cs.products.map((product, j) => (
                    <span key={j} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${productColors[product] || productColors["Intégrations"]}`}>
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] hover:text-rose-500 transition-colors">
            Voir toutes les études de cas
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
