import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requiresBillingRedirect } from "@/lib/account-session";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopNavbar } from "./TopNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // INVARIANT D — the billing gate is enforced here, not in the middleware.
  // `auth()` runs the JWT callback, which re-reads the user and its organization
  // from the database on every call, so an upgrade/downgrade is honoured on the
  // next request instead of the next login. The middleware only forwards the
  // pathname (`x-pathname`) because `getToken` decodes a stale cookie.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (session?.user?.id && requiresBillingRedirect(pathname, session.user.planStatus)) {
    redirect("/dashboard/billing");
  }

  let walletBalance = 0;
  if (session?.user?.organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { walletBalance: true }
      });
      walletBalance = org?.walletBalance?.toNumber() || 0;
    } catch (e) {
      console.warn("Could not fetch wallet balance from DB. Returning 0.00 mock.", e);
      walletBalance = 0;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)] overflow-hidden text-[var(--text-primary)] font-sans">
      <TopNavbar 
        organizationName={session?.user?.organizationName}
        walletBalance={walletBalance}
      />
      
      <div className="flex flex-1 overflow-hidden pt-16">
        <DashboardSidebar 
          organizationName={session?.user?.organizationName}
          planName={session?.user?.plan}
          planStatus={session?.user?.planStatus}
          userEmail={session?.user?.email}
          isSuperAdmin={session?.user?.isSuperAdmin}
        />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
