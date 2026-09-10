export type CaseStudy = {
  company: string;
  sector: string;
  solution: string;
  size: string;
  country: string;
  summary: string;
  stats: { value: string; label: string }[];
  quote: string;
  author: string;
  initials: string;
};

export default function CaseCard({ study }: { study: CaseStudy }) {
  return (
    <article className="group rounded-[24px] glass-panel-premium overflow-hidden transition-transform hover:-translate-y-1">
      <div className="px-6 pt-6 flex items-center justify-between gap-2">
        <div className="w-10 h-10 rounded-xl n8n-gradient-bg flex items-center justify-center text-white font-extrabold text-sm">
          {study.initials}
        </div>
        <div className="text-xs font-bold text-[var(--text-secondary)]">{study.sector}</div>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
            {study.solution}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-secondary)]">
            {study.size}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">{study.company}</h3>
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{study.summary}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {study.stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-3 text-center">
              <div className="text-lg font-extrabold n8n-gradient-text">{stat.value}</div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
        <blockquote className="text-sm italic text-[var(--text-secondary)] font-medium leading-relaxed border-l-2 border-rose-500/50 pl-4">
          « {study.quote} »
        </blockquote>
        <div className="text-xs font-bold text-[var(--text-primary)]">{study.author}</div>
      </div>
    </article>
  );
}