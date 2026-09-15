export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col"
      style={{
        background:
          "radial-gradient(60rem 60rem at 50% -20%, color-mix(in oklch, var(--accent-primary) 9%, transparent), transparent 60%), radial-gradient(45rem 45rem at 110% 110%, color-mix(in oklch, var(--accent-violet) 7%, transparent), transparent 60%), var(--bg-base)",
      }}
    >
      <header className="w-full p-6 flex justify-between items-center border-b border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-[0_0_15px_rgba(0,212,255,0.3)]"></div>
          <div className="text-xl font-bold tracking-tight">Antigravity</div>
        </div>
        <div className="text-sm text-[var(--text-secondary)] font-medium">Setup Assistant</div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
