import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EsimClient } from "./EsimClient";
import { getMySimCards } from "./actions";
import { prisma } from "@/lib/prisma";

export default async function DashboardEsimPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  // Fetch their balance and settings to pass to client
  const [org, settings, simCardsRes] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.user.organizationId }, select: { walletBalance: true } }),
    prisma.systemSettings.findUnique({ where: { id: 'default' }, select: { eSimRate: true } }),
    getMySimCards()
  ]);

  const esimPrice = Number(settings?.eSimRate || 5.00);
  const walletBalance = Number(org?.walletBalance || 0);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Connectivité eSIM</h2>
        <p className="text-sm text-[var(--text-secondary)]">Gérez vos forfaits mobiles et installez vos profils virtuels.</p>
      </div>

      <EsimClient 
        initialSimCards={simCardsRes.success ? (simCardsRes.data || []) : []} 
        esimPrice={esimPrice}
        walletBalance={walletBalance}
      />
    </div>
  );
}
