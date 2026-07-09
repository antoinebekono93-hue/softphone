import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WebhookForm from "./WebhookForm";

export const metadata = {
  title: "Integrations | Antigravity",
};

export default async function IntegrationsPage() {
  const session = await auth();
  
  let org = null;
  if (session?.user?.organizationId) {
    org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { webhookUrl: true, webhookSecret: true }
    });
  }

  const integrations = [
    { id: "slack", name: "Slack", description: "Send call logs, voicemail transcripts, and SMS to Slack channels.", icon: "slack", status: "Connected", color: "bg-[#4A154B]" },
    { id: "hubspot", name: "HubSpot", description: "Automatically log calls and SMS to your HubSpot CRM contacts.", icon: "hubspot", status: "Connect", color: "bg-[#FF7A59]" },
    { id: "salesforce", name: "Salesforce", description: "Deep integration with Salesforce for enterprise call logging.", icon: "salesforce", status: "Connect", color: "bg-[#00A1E0]" },
    { id: "zapier", name: "Zapier", description: "Connect Antigravity to 5000+ apps with Zapier workflows.", icon: "zapier", status: "Connect", color: "bg-[#FF4A00]" },
    { id: "gong", name: "Gong", description: "Send call recordings to Gong for revenue intelligence analysis.", icon: "gong", status: "Connect", color: "bg-[#5D3FD3]" },
    { id: "zendesk", name: "Zendesk", description: "Create tickets automatically for missed calls and voicemails.", icon: "zendesk", status: "Connect", color: "bg-[#03363D]" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-[var(--text-secondary)]">Connect Antigravity with your favorite tools to automate your workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((app) => (
          <div key={app.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-primary)] font-bold text-xl ${app.color}`}>
                {app.name[0]}
              </div>
              <button className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
                app.status === 'Connected' 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
                  : 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}>
                {app.status}
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{app.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] flex-1">{app.description}</p>
            
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <a href="#" className="text-sm text-[cyan-500] hover:underline font-medium">Learn more</a>
            </div>
          </div>
        ))}
      </div>
      
      {/* SECTION WEBHOOK GÉNÉRIQUE */}
      <WebhookForm initialUrl={org?.webhookUrl || null} initialSecret={org?.webhookSecret || null} />
    </div>
  );
}
