import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EmbeddedSignupButton } from "@/components/whatsapp/EmbeddedSignupButton";
import { Card } from "@/components/ui/card";
import { WalletSection } from "./WalletSection";

export const metadata = {
  title: "Settings | Buster Call",
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

  // Login methods: Google is considered connected when an OAuth account link
  // exists for this user. No tokens are read or displayed (auth only).
  let googleConnected = false;
  let hasPassword = false;
  if (session?.user?.id && !dbError) {
    try {
      const [googleAccounts, userRecord] = await Promise.all([
        prisma.account.findMany({
          where: { userId: session.user.id, provider: "google" },
          select: { id: true },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { passwordHash: true },
        }),
      ]);
      googleConnected = googleAccounts.length > 0;
      hasPassword = Boolean(userRecord?.passwordHash);
    } catch (e) {
      console.error("Failed to fetch login methods for settings:", e);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
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
        {/* Wallet & Billing Section */}
        <WalletSection 
          balance={org?.walletBalance?.toNumber() ?? 0}
          planName={session?.user?.plan}
          planStatus={session?.user?.planStatus}
        />

        {/* Profile Section */}
        <Card className="p-6">
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
            <button className="px-5 py-2.5 bg-[var(--bg-surface-solid)] text-[var(--text-primary)] font-medium rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors">Save Changes</button>
          </div>
        </Card>

        {/* Login Methods Section */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-1">Login methods</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">How you can sign in to your Buster Call account.</p>
          <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <svg aria-hidden="true" viewBox="0 0 18 18" className="h-5 w-5 shrink-0">
                  <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7027-1.5673 2.6836-3.874 2.6836-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.806-.54-1.8364-.8591-3.0477-.8591-2.3441 0-4.3282 1.5831-5.0359 3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
                  <path fill="#FBBC05" d="M3.9641 11.4132c-.1805-.54-.2836-1.1168-.2836-1.7132s.1031-1.1732.2836-1.7132V5.6545H.9573C.3477 6.8718 0 8.2586 0 9.7s.3477 2.8282.9573 4.0455l3.0068-2.3323z" />
                  <path fill="#EA4335" d="M9 3.5955c1.3214 0 2.5077.4541 3.4405 1.3459l2.5813-2.5813C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 5.6545l3.0068 2.3323C4.6718 5.8591 6.6559 3.5955 9 3.5955z" />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </div>
              <span className={`text-sm font-medium ${googleConnected ? "text-emerald-500" : "text-[var(--text-secondary)]"}`}>
                {googleConnected ? "Connected" : "Not connected"}
              </span>
            </div>
            {hasPassword && (
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium">Email &amp; password</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Not connected</span>
              </div>
            )}
          </div>
          {!googleConnected && (
            <p className="mt-4 text-xs text-[var(--text-secondary)]">
              Pour associer Google à ce compte, connectez-vous d'abord avec le même e-mail via Google. La connexion explicite depuis les paramètres arrivera dans une prochaine mise à jour.
            </p>
          )}
        </Card>

        {/* Organization Section */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-4">Organization Details</h2>
          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Organization Name</label>
            <input type="text" defaultValue={session?.user?.organizationName || ""} className="w-full max-w-md bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          
          <div className="border-t border-[var(--border-subtle)] pt-6 mt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
               WhatsApp Business Integration
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Connect your WhatsApp Business account directly to reply to customers from our inbox.</p>
            <EmbeddedSignupButton appId={process.env.NEXT_PUBLIC_META_APP_ID || "YOUR_META_APP_ID"} />
          </div>
        </Card>

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
