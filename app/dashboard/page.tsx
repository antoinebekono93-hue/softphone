import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Phone, Users, Wallet, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "./DashboardCharts";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;

  // Fetch Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [contactsCount, org, callsToday, smsToday] = await Promise.all([
    prisma.contact.count({ where: { organizationId: orgId } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { walletBalance: true } }),
    prisma.callLog.count({ where: { organizationId: orgId, startedAt: { gte: today } } }),
    prisma.smsMessage.count({ where: { organizationId: orgId, sentAt: { gte: today } } })
  ]);

  // Fetch chart data (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    
    const [calls, messages] = await Promise.all([
      prisma.callLog.count({ where: { organizationId: orgId, startedAt: { gte: d, lt: nextD } } }),
      prisma.smsMessage.count({ where: { organizationId: orgId, sentAt: { gte: d, lt: nextD } } })
    ]);
    
    chartData.push({
      date: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      calls,
      messages
    });
  }

  // Fetch recent activity
  const recentCalls = await prisma.callLog.findMany({
    where: { organizationId: orgId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { contact: true }
  });
  
  const recentMessages = await prisma.smsMessage.findMany({
    where: { organizationId: orgId },
    orderBy: { sentAt: 'desc' },
    take: 5,
    include: { contact: true }
  });

  const activities = [...recentCalls, ...recentMessages]
    .sort((a: any, b: any) => {
      const timeA = a.startedAt ? a.startedAt.getTime() : a.sentAt.getTime();
      const timeB = b.startedAt ? b.startedAt.getTime() : b.sentAt.getTime();
      return timeB - timeA;
    })
    .slice(0, 10)
    .map((item: any) => {
      const isCall = 'duration' in item;
      let type: 'CALL' | 'SMS' | 'WHATSAPP' | 'AI_CALL' = 'CALL';
      
      if (isCall) {
        type = item.aiSummary ? 'AI_CALL' : 'CALL';
      } else {
        type = item.type === 'WHATSAPP' ? 'WHATSAPP' : 'SMS';
      }

      const itemTime = isCall ? item.startedAt : item.sentAt;

      return {
        id: item.id,
        type,
        title: isCall ? `Appel ${item.direction === 'OUTBOUND' ? 'sortant' : 'entrant'} ${item.contact ? 'avec ' + item.contact.name : ''}` : `Message ${item.direction === 'OUTBOUND' ? 'envoyé' : 'reçu'} ${item.contact ? 'de ' + item.contact.name : ''}`,
        time: new Date(itemTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        description: isCall ? item.aiSummary : item.body
      };
    });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Bonjour, {session.user.name?.split(' ')[0] || "Admin"} 👋
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">Voici l'aperçu de votre espace de travail Antigravity en temps réel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-[var(--accent-cyan)] flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Appels aujourd'hui</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{callsToday}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-[var(--accent-violet)] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Contacts totaux</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{contactsCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Solde Wallet</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">${org?.walletBalance?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Statut système</p>
              <p className="text-lg font-bold text-emerald-500">Opérationnel</p>
            </div>
          </div>
        </div>
      </div>

      <DashboardCharts data={chartData} activities={activities} />
    </div>
  );
}
