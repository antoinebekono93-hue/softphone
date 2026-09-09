const awards = [
  { icon: "★", title: "Leader Magic Quadrant", subtitle: "Gartner · 12e année consécutive", color: "text-yellow-500" },
  { icon: "📈", title: "Momentum Leader", subtitle: "G2 · Hiver 2026", color: "text-rose-500" },
  { icon: "🏆", title: "Meilleurs Résultats", subtitle: "G2 · 2026", color: "text-orange-500" },
  { icon: "❤️", title: "Adoption Utilisateurs", subtitle: "G2 · Meilleure note", color: "text-emerald-500" },
  { icon: "🛠️", title: "Installation la plus simple", subtitle: "G2 · 2026", color: "text-violet-500" },
  { icon: "✓", title: "Buyer's Choice", subtitle: "TrustRadius · 2026", color: "text-cyan-500" }
];

export default function AwardsSection() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Une plateforme <span className="text-gradient">primée</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Reconnue par les analystes et les utilisateurs du secteur.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {awards.map((award, i) => (
          <div key={i} className="rounded-[32px] glass-panel-premium p-8 text-center group hover:-translate-y-1 transition-transform">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-[var(--bg-surface-hover)] ${award.color}`}>
              {award.icon}
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{award.title}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{award.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
