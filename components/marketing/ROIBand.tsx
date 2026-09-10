export default function ROIBand({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="relative overflow-hidden glass-panel-premium rounded-[40px] px-6 py-16 md:px-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight n8n-gradient-text">{stat.value}</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}