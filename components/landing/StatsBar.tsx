const stats = [
  { value: "10 000+", label: "Entreprises clientes", suffix: "" },
  { value: "50+", label: "Pays supportés", suffix: "" },
  { value: "99,99%", label: "Disponibilité", suffix: "" },
  { value: "2M+", label: "Appels traités / jour", suffix: "" }
];

export default function StatsBar() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          La plateforme de communication IA de confiance
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Fiabilité et échelle au service de votre entreprise.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="animate-counter rounded-[32px] glass-panel-premium p-8 text-center">
            <div className="text-4xl md:text-5xl font-extrabold n8n-gradient-text mb-2">{stat.value}</div>
            <div className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Live counter banner */}
      <div className="rounded-[32px] border border-emerald-500/30 bg-emerald-500/5 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-[var(--text-primary)]">En direct</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">52 451</span> appels la dernière heure
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">211 713 421</span> minutes les dernières 24h
          </div>
        </div>
      </div>
    </section>
  );
}
