export default function GodModeOverviewPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Overview</h1>
        <p className="text-[var(--text-secondary)]">Global metrics and real-time telecom status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel border-none rounded-2xl p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Total Users</span>
           <span className="text-4xl font-bold text-[var(--text-primary)]">0</span>
           <span className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
             +0% from last month
           </span>
        </div>

        <div className="glass-panel border-none rounded-2xl p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Active Numbers</span>
           <span className="text-4xl font-bold text-[var(--text-primary)]">0</span>
           <span className="text-sm text-[var(--text-secondary)] mt-2">Provisioned via Telnyx</span>
        </div>

        <div className="glass-panel border-none rounded-2xl p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">MRR (Stripe)</span>
           <span className="text-4xl font-bold text-[var(--text-primary)]">$0</span>
           <span className="text-sm text-[var(--text-secondary)] mt-2">Monthly Recurring Revenue</span>
        </div>
      </div>

      <div className="glass-panel border-none rounded-2xl p-8">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            System Diagnostics
         </h2>
         <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-hover)]">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                     <p className="font-medium">Database (Supabase)</p>
                     <p className="text-xs text-[var(--text-secondary)]">Connection operational</p>
                  </div>
               </div>
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">Connected</span>
            </div>

            <div className="flex items-center justify-between p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-hover)]">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                     <p className="font-medium">Telnyx SIP Gateway</p>
                     <p className="text-xs text-[var(--text-secondary)]">Missing API Keys in .env.local</p>
                  </div>
               </div>
               <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full">Pending Auth</span>
            </div>
         </div>
      </div>
    </div>
  );
}
