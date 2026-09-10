export default function PageHero({
  badge,
  title,
  subtitle,
  children,
  accent = "rose",
}: {
  badge?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  accent?: "rose" | "cyan" | "amber" | "violet" | "emerald" | "blue";
}) {
  const gradients: Record<string, { a: string; b: string }> = {
    rose: { a: "bg-rose-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-orange-500/20 blur-[100px] w-[400px] h-[300px]" },
    cyan: { a: "bg-cyan-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-blue-500/20 blur-[100px] w-[400px] h-[300px]" },
    amber: { a: "bg-amber-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-orange-500/15 blur-[100px] w-[400px] h-[300px]" },
    violet: { a: "bg-violet-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-purple-500/15 blur-[100px] w-[400px] h-[300px]" },
    emerald: { a: "bg-emerald-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-teal-500/15 blur-[100px] w-[400px] h-[300px]" },
    blue: { a: "bg-blue-500/20 blur-[120px] w-[800px] h-[400px]", b: "bg-indigo-500/15 blur-[100px] w-[400px] h-[300px]" },
  };
  const g = gradients[accent];

  return (
    <section className="flex flex-col items-center text-center px-4 pt-20 pb-16 relative">
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none -z-10 ${g.a}`}></div>
      <div className={`absolute top-20 left-1/2 -translate-x-1/2 rounded-full pointer-events-none -z-10 ${g.b}`}></div>

      {badge && (
        <div className="opacity-0 animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 mb-8 shadow-sm">
          {badge}
        </div>
      )}

      <h1 className="opacity-0 animate-fade-up [animation-delay:100ms] text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1] text-[var(--text-primary)]">
        {title}
      </h1>

      {subtitle && (
        <p className="opacity-0 animate-fade-up [animation-delay:200ms] text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}

      {children && (
        <div className="opacity-0 animate-fade-up [animation-delay:300ms] flex flex-col sm:flex-row gap-4 items-center justify-center">
          {children}
        </div>
      )}
    </section>
  );
}