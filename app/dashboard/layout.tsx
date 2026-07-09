import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopNavbar } from "./TopNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  let walletBalance = 0;
  if (session?.user?.organizationId) {
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
    <div className="dashboard-theme flex flex-col h-screen bg-[var(--bg-base)] overflow-hidden text-[var(--text-primary)] font-sans">
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
