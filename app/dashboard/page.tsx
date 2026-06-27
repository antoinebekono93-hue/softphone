import { auth } from "@/auth";
import { DashboardClient } from "./DashboardClient";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Overview | Antigravity",
};

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userName = session?.user?.name || "Administrateur";

  try {
    const org = await prisma.organization.findFirst();
    
    if (!org) {
       return <DashboardClient userName={userName} initialStats={null} initialLogs={[]} />;
    }

    const callCount = await prisma.callLog.count({ where: { organizationId: org.id }});
    const missedCalls = await prisma.callLog.count({ where: { organizationId: org.id, status: 'NO_ANSWER' }});
    const activeNumbers = await prisma.phoneNumber.count({ where: { organizationId: org.id }});
    const smsCount = await prisma.smsMessage.count({ where: { organizationId: org.id }});
    
    const recentLogs = await prisma.callLog.findMany({
       where: { organizationId: org.id },
       orderBy: { startedAt: 'desc' },
       take: 10
    });

    const stats = {
      callCount,
      missedCalls,
      activeNumbers,
      minutesUsed: org.minutesUsedThisMonth,
      walletBalance: org.walletBalance,
      planStatus: org.planStatus,
      smsCount
    };

    return <DashboardClient userName={userName} initialStats={stats} initialLogs={recentLogs} />;
  } catch (error) {
    console.error("DB connection error on dashboard:", error);
    return <DashboardClient userName={userName} initialStats={null} initialLogs={[]} />;
  }
}
