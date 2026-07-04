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

  let contactsCount = 0;
  let org = null;
  let callsToday = 0;
  let smsToday = 0;

  try {
    const results = await Promise.all([
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.organization.findUnique({ where: { id: orgId }, select: { walletBalance: true } }),
      prisma.callLog.count({ where: { organizationId: orgId, startedAt: { gte: today } } }),
      prisma.smsMessage.count({ where: { organizationId: orgId, sentAt: { gte: today } } })
    ]);
    contactsCount = results[0];
    org = results[1];
    callsToday = results[2];
    smsToday = results[3];
  } catch (error) {
    console.error("Dashboard DB Error:", error);
  }

  // Fetch chart data (last 7 days)
  const chartData = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let allCalls: any[] = [];
  let allMessages: any[] = [];
  try {
    const results = await Promise.all([
      prisma.callLog.findMany({
        where: { organizationId: orgId, startedAt: { gte: sevenDaysAgo } },
        select: { startedAt: true }
      }),
      prisma.smsMessage.findMany({
        where: { organizationId: orgId, sentAt: { gte: sevenDaysAgo } },
        select: { sentAt: true }
      })
    ]);
    allCalls = results[0];
    allMessages = results[1];
  } catch (error) {
    console.error("Dashboard DB Error:", error);
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    
    const calls = allCalls.filter(c => c.startedAt >= d && c.startedAt < nextD).length;
    const messages = allMessages.filter(m => m.sentAt >= d && m.sentAt < nextD).length;
    
    chartData.push({
      date: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      calls,
      messages
    });
  }

  // Fetch recent activity
  let recentCalls: any[] = [];
  let recentMessages: any[] = [];
  try {
    recentCalls = await prisma.callLog.findMany({
      where: { organizationId: orgId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { contact: true }
    });
    
    recentMessages = await prisma.smsMessage.findMany({
      where: { organizationId: orgId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      include: { contact: true }
    });
  } catch (error) {
    console.error("Dashboard DB Error:", error);
  }

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
        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Appels aujourd'hui</p>
            <div className="badge-glass-green">+12%</div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{callsToday}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Contacts totaux</p>
            <div className="badge-glass-green">+5%</div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{contactsCount}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Solde Wallet</p>
            <div className="badge-glass-gray">Stable</div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--text-primary)]">${org?.walletBalance?.toFixed(2) || "0.00"}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Statut système</p>
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-500">Opérationnel</p>
          </div>
        </div>
      </div>

      <DashboardCharts data={chartData} activities={activities} />
    </div>
  );
}
