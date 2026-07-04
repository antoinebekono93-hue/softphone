import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EmbeddedSignupButton } from "@/components/whatsapp/EmbeddedSignupButton";
import { TelnyxKeyForm } from "./TelnyxKeyForm";

export const metadata = {
  title: "Settings | Antigravity",
};

export default async function SettingsPage() {
  const session = await auth();
  
  let org = null;
  let dbError = false;
  try {
    if (session?.user?.organizationId) {
      org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
    } else {
      org = await prisma.organization.findFirst();
    }
  } catch (e) {
    console.error("Failed to fetch organization for settings:", e);
    dbError = true;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage your account and organization preferences.</p>
      </div>

      {dbError && (
        <div className="p-4 mb-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
          Connexion à la base de données momentanément indisponible. Les modifications risquent de ne pas être sauvegardées.
        </div>
      )}

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
            
            <TelnyxKeyForm defaultValue={org?.telnyxApiKey || ""} />

            <div className="flex gap-4 items-center">
              <button className="px-5 py-2.5 glass-panel hover:bg-[var(--bg-surface-hover)] rounded-lg text-sm transition-colors">Generate API Key</button>
              <button className="px-5 py-2.5 glass-panel hover:bg-[var(--bg-surface-hover)] rounded-lg text-sm transition-colors">Configure Webhooks</button>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-6 mt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
               WhatsApp Business Integration
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Connect your WhatsApp Business account directly to reply to customers from our inbox.</p>
            <EmbeddedSignupButton appId={process.env.NEXT_PUBLIC_META_APP_ID || "YOUR_META_APP_ID"} />
          </div>
        </div>

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
