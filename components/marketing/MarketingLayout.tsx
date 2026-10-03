import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up { animation: none; opacity: 1; }
        }
      `}} />

      <MarketingHeader />

      <main className="flex-1 pt-16">{children}</main>

      <MarketingFooter />
    </div>
  );
}