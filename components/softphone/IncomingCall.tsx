"use client";

import { formatPhoneNumber } from "@/lib/utils";

interface IncomingCallProps {
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCall({ callerNumber, onAccept, onReject }: IncomingCallProps) {
  // Simulate fetching CRM data for this caller
  const crmData = {
    name: "Alice Smith",
    company: "Acme Corp",
    status: "Premium Customer",
    recentActivity: "Opened Ticket #1029 (Billing) 2 hours ago",
    lastPurchase: "$1,200 (Annual Plan)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-3xl rounded-3xl glass-panel bg-[var(--bg-surface-solid)] p-0 flex animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
        
        {/* Left Side: Call Actions */}
        <div className="flex-1 p-10 flex flex-col items-center relative border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="text-cyan-500 font-medium text-sm tracking-widest uppercase mb-10 animate-pulse">
            Incoming Call
          </div>

          <div className="relative mb-10">
            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.4)] relative z-10">
              <span className="text-4xl font-bold text-white">AS</span>
            </div>
          </div>

          <div className="text-4xl font-light text-[var(--text-primary)] mb-2 text-center">
            {crmData.name}
          </div>
          <div className="text-[var(--text-secondary)] mb-10 text-lg">{formatPhoneNumber(callerNumber)}</div>

          <div className="flex w-full justify-center gap-10 relative z-10">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] transition-all active:scale-95"
                aria-label="Decline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                  <line x1="23" y1="1" x2="1" y2="23"></line>
                </svg>
              </button>
              <span className="text-sm font-medium text-[var(--text-secondary)]">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95"
                aria-label="Accept"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
              <span className="text-sm font-medium text-[var(--text-secondary)]">Accept</span>
            </div>
          </div>
        </div>

        {/* Right Side: CRM Insights */}
        <div className="w-80 p-8 flex flex-col bg-[var(--bg-surface-hover)] relative z-10">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-8 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF7A59]"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Live Insights
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-semibold">Company</div>
              <div className="text-sm text-[var(--text-primary)] font-medium flex items-center gap-2">
                <div className="w-6 h-6 bg-[var(--bg-surface-solid)] rounded border border-[var(--border-subtle)] flex items-center justify-center text-xs">AC</div>
                {crmData.company}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-semibold">Account Status</div>
              <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full border border-emerald-500/20 font-bold tracking-wide">
                {crmData.status}
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">Heads Up!</div>
              <div className="text-sm text-amber-500 font-medium bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 shadow-sm flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {crmData.recentActivity}
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-semibold">Last Purchase</div>
              <div className="text-sm text-[var(--text-primary)] font-medium">{crmData.lastPurchase}</div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] text-center">
            Data synced from HubSpot CRM
          </div>
        </div>
      </div>
    </div>
  );
}
