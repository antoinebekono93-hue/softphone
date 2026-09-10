import Link from "next/link";

export default function ResourceCards({ items }: { items: { title: string; description: string; label: string; href: string }[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="group rounded-[24px] glass-panel-premium p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-rose-400">{item.label}</div>
          <div className="text-lg font-bold text-[var(--text-primary)] group-hover:text-rose-400 transition-colors">
            {item.title}
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{item.description}</p>
          <div className="mt-auto text-sm font-bold text-rose-400 flex items-center gap-1">
            En savoir plus
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </Link>
      ))}
    </div>
  );
}