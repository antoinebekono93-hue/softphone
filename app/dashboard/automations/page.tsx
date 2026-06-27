import { auth } from "@/auth";

export const metadata = {
  title: "Automations | Antigravity",
};

export default async function AutomationsPage() {
  const session = await auth();

  const rules = [
    { 
      id: 1, 
      name: "Missed Call Text-Back", 
      trigger: "When a call is missed from a new number", 
      action: "Send SMS: 'Hi, sorry we missed your call! How can we help you today?'", 
      status: true,
      stats: "Saved 42 leads this month"
    },
    { 
      id: 2, 
      name: "Voicemail Transcription to Slack", 
      trigger: "When a new voicemail is received", 
      action: "Send AI transcription to #sales-inquiries", 
      status: true,
      stats: "Processed 128 voicemails"
    },
    { 
      id: 3, 
      name: "Out of Office Auto-Reply", 
      trigger: "When a text is received outside business hours", 
      action: "Send SMS: 'We are currently closed. We will reply tomorrow morning.'", 
      status: false,
      stats: "Inactive"
    },
    { 
      id: 4, 
      name: "CRM Lead Creation", 
      trigger: "When a call is received from an unknown number", 
      action: "Create a new Contact in HubSpot", 
      status: true,
      stats: "Created 15 contacts"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Automations</h1>
          <p className="text-[var(--text-secondary)]">Create workflows to put your communication on autopilot.</p>
        </div>
        <button className="btn-primary-gradient px-5 py-2">
          Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:border-[cyan-500]/50 transition-colors relative">
            
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{rule.name}</h3>
              {/* Toggle Switch */}
              <div className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${rule.status ? 'bg-[emerald-500]' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${rule.status ? 'translate-x-5' : ''}`} />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[var(--text-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">When</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{rule.trigger}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[cyan-500]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[cyan-500] mb-1">Then</div>
                  <div className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface-hover)] p-2 rounded-lg border border-[var(--border-subtle)]">{rule.action}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">{rule.stats}</span>
              <button className="text-[cyan-500] hover:underline font-medium">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
