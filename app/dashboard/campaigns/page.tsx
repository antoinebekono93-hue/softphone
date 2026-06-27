import { auth } from "@/lib/auth";

export const metadata = {
  title: "Trust & Campaigns | Antigravity",
};

export default async function CampaignsPage() {
  const session = await auth();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trust & Campaigns</h1>
          <p className="text-[var(--text-secondary)]">Manage your business identity, carrier compliance, and SMS marketing campaigns.</p>
        </div>
        <button className="btn-primary-gradient px-5 py-2">
          New SMS Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* A2P 10DLC Compliance Card */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[emerald-500]/5 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[emerald-500]/10 text-[emerald-500] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">A2P 10DLC Compliance</h2>
                <p className="text-sm text-[var(--text-secondary)]">Carrier Registration Status</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[emerald-500]/10 border border-[emerald-500]/20 text-[emerald-500] text-xs font-bold uppercase tracking-wider rounded-md">
              Verified
            </span>
          </div>

          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-6">
            Your brand is fully verified with major US and Canadian carriers. Your SMS delivery rates are optimized, and you are protected from carrier spam filtering.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Trust Score</div>
              <div className="text-2xl font-bold text-[emerald-500]">98/100</div>
            </div>
            <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Daily SMS Limit</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">100,000</div>
            </div>
          </div>
        </div>

        {/* Deliverability Stats */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-[var(--text-primary)]">Deliverability (Last 30 Days)</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">Delivered</span>
                <span className="font-medium text-[emerald-500]">99.2%</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                <div className="h-full bg-[emerald-500] rounded-full" style={{ width: '99.2%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">Filtered (Spam)</span>
                <span className="font-medium text-amber-500">0.5%</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '0.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">Opt-out Rate</span>
                <span className="font-medium text-rose-500">0.3%</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '0.3%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <h2 className="text-xl font-bold mb-4">Recent SMS Campaigns</h2>
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium">
              <th className="p-4 pl-6">Campaign Name</th>
              <th className="p-4">Sent On</th>
              <th className="p-4">Recipients</th>
              <th className="p-4">Engagement</th>
              <th className="p-4 pr-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
              <td className="p-4 pl-6 font-medium text-[var(--text-primary)]">Q3 Enterprise Promo</td>
              <td className="p-4 text-sm text-[var(--text-secondary)]">Oct 12, 2026</td>
              <td className="p-4 text-sm font-mono text-[var(--text-primary)]">2,450</td>
              <td className="p-4">
                <div className="text-sm font-medium text-[emerald-500]">32% Click Rate</div>
              </td>
              <td className="p-4 pr-6 text-right">
                <span className="px-2 py-1 bg-gray-500/10 border border-gray-500/20 text-[var(--text-secondary)] text-xs rounded-md">COMPLETED</span>
              </td>
            </tr>
            <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
              <td className="p-4 pl-6 font-medium text-[var(--text-primary)]">Webinar Reminder</td>
              <td className="p-4 text-sm text-[var(--text-secondary)]">Oct 10, 2026</td>
              <td className="p-4 text-sm font-mono text-[var(--text-primary)]">850</td>
              <td className="p-4">
                <div className="text-sm font-medium text-[emerald-500]">45% Reply Rate</div>
              </td>
              <td className="p-4 pr-6 text-right">
                <span className="px-2 py-1 bg-gray-500/10 border border-gray-500/20 text-[var(--text-secondary)] text-xs rounded-md">COMPLETED</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
