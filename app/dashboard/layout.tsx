import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  let walletBalance = 0;
  if (session?.user?.organizationId) {
    // In production, you would fetch this from DB.
    // For now, if Prisma is not connected, we mock it to prevent crashes before setup.
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { walletBalance: true }
      });
      walletBalance = org?.walletBalance || 0;
    } catch (e) {
      console.warn("Could not fetch wallet balance from DB. Returning 0.00 mock.", e);
      walletBalance = 0;
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden text-[var(--text-primary)] font-sans">
      <DashboardSidebar 
        organizationName={session?.user?.organizationName}
        planName={session?.user?.plan}
        planStatus={session?.user?.planStatus}
        userEmail={session?.user?.email}
        walletBalance={walletBalance}
        isSuperAdmin={session?.user?.isSuperAdmin}
      />

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto bg-transparent pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
