export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--apple-bg-primary)] text-[var(--apple-text-primary)] flex flex-col">
      <header className="w-full p-6 flex justify-between items-center border-b border-[var(--apple-border)]">
        <div className="text-xl font-bold tracking-tight">Antigravity</div>
        <div className="text-sm text-[var(--apple-text-secondary)]">Setup Assistant</div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
