const resources = [
  {
    category: "Guide",
    title: "L'IA Vocale Agentic en 2026",
    description: "Téléchargez notre rapport exclusif sur les tendances de l'IA conversationnelle et comment les entreprises s'y adaptent.",
    cta: "Télécharger le rapport",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
    )
  },
  {
    category: "Webinaire",
    title: "Optimiser sa téléphonie avec l'IA",
    description: "Rejoignez notre session interactive avec nos experts produit pour découvrir comment automatiser vos conversations.",
    cta: "S'inscrire au webinaire",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v6l4 2-4 2v6"/></svg>
    )
  },
  {
    category: "Blog",
    title: "5 raisons de passer au softphone IA",
    description: "De la réduction des coûts à l'amélioration de l'expérience client, découvrez pourquoi les entreprises migrent.",
    cta: "Lire l'article",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    )
  }
];

export default function ThoughtLeadership() {
  return (
    <section className="py-24 px-4 border-t border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Ressources <span className="text-gradient">et insights</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">
            Restez à la pointe de l'IA conversationnelle avec nos contenus exclusifs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((res, i) => (
            <button key={i} className="rounded-[32px] glass-panel-premium p-8 text-left group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {res.icon}
              </div>
              <div className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-2">{res.category}</div>
              <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{res.title}</h3>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-6 leading-relaxed">{res.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold n8n-gradient-text group-hover:gap-3 transition-all">
                {res.cta}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
