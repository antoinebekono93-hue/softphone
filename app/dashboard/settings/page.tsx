import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TelnyxSettingsClient } from "./TelnyxSettingsClient";

export const metadata = {
  title: "Settings | Antigravity",
};

export default async function SettingsPage() {
  const session = await auth();
  
  let org = null;
  if (session?.user?.organizationId) {
    org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  } else {
    org = await prisma.organization.findFirst();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage your account and organization preferences.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-medium mb-4">My Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
              <input type="text" defaultValue={session?.user?.name || ""} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
              <input type="email" defaultValue={session?.user?.email || ""} readOnly className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-secondary)] cursor-not-allowed opacity-70" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors">Save Changes</button>
          </div>
        </div>

        {/* Organization Section */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-medium mb-4">Organization Details</h2>
          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Organization Name</label>
            <input type="text" defaultValue={session?.user?.organizationName || ""} className="w-full max-w-md bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          
          <div className="border-t border-[var(--border-subtle)] pt-6">
            <h3 className="text-lg font-medium mb-4">API Keys & Webhooks</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Integrate Antigravity with your internal tools using our REST API.</p>
            <div className="flex gap-4 items-center">
              <button className="px-5 py-2.5 glass-panel hover:bg-[var(--bg-surface-hover)] rounded-lg text-sm transition-colors">Generate API Key</button>
              <button className="px-5 py-2.5 glass-panel hover:bg-[var(--bg-surface-hover)] rounded-lg text-sm transition-colors">Configure Webhooks</button>
            </div>
          </div>
        </div>

        {/* Telnyx WebRTC Settings */}
        <TelnyxSettingsClient 
          initialApiKey={org?.telnyxApiKey || ""}
          initialConnectionId={org?.telnyxConnectionId || ""}
        />

        {/* Danger Zone */}
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6">
          <h2 className="text-xl font-medium text-rose-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Irreversible actions regarding your account and organization.</p>
          <div className="flex justify-between items-center p-4 border border-rose-500/10 rounded-xl bg-rose-500/5">
            <div>
              <div className="font-medium text-[var(--text-primary)]">Delete Organization</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">Permanently delete your organization, all phone numbers, and call logs.</div>
            </div>
            <button className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors">Delete Organization</button>
          </div>
        </div>
      </div>
    </div>
  );
}
