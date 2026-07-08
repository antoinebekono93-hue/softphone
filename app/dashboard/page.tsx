import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Phone, Users, Wallet, Activity, Brain, AlertCircle, Clock, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;

  // Fetch Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let org = null;
  let callsToday = 0;
  let smsToday = 0;
  let openTickets: any[] = [];
  let aiEmployees: any[] = [];

  try {
    const results = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { walletBalance: true } }),
      prisma.callLog.count({ where: { organizationId: orgId, startedAt: { gte: today } } }),
      prisma.smsMessage.count({ where: { organizationId: orgId, sentAt: { gte: today } } }),
      prisma.ticket.findMany({
        where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { contact: true }
      }),
      prisma.aIEmployee.findMany({
        where: { organizationId: orgId }
      })
    ]);
    org = results[0];
    callsToday = results[1];
    smsToday = results[2];
    openTickets = results[3];
    aiEmployees = results[4];
  } catch (error) {
    console.error("Dashboard DB Error:", error);
  }

  // Calculate Employee Stats
  const employeeStats = await Promise.all(aiEmployees.map(async (emp) => {
    if (!emp.voicePhoneNumberId) return { ...emp, callsTaken: 0, totalMinutes: 0 };
    
    const logs = await prisma.callLog.findMany({
      where: { 
        organizationId: orgId, 
        phoneNumberId: emp.voicePhoneNumberId,
        startedAt: { gte: today }
      },
      select: { duration: true }
    });

    const callsTaken = logs.length;
    const totalMinutes = Math.ceil(logs.reduce((acc, log) => acc + (log.duration || 0), 0) / 60);

    return {
      ...emp,
      callsTaken,
      totalMinutes
    };
  }));

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

  // Estimate cost: 0.05 per min of call
  const totalCallDurationToday = await prisma.callLog.aggregate({
    where: { organizationId: orgId, startedAt: { gte: today } },
    _sum: { duration: true }
  });
  const minutesToday = Math.ceil((totalCallDurationToday._sum.duration || 0) / 60);
  const estimatedCost = (minutesToday * 0.05) + (smsToday * 0.01);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Console de Supervision
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">Vue en temps réel des performances de votre flotte d'agents IA et des escalades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Volume Global (Jour)</p>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 z-10">
            <p className="text-3xl font-extrabold text-[var(--text-primary)]">{callsToday + smsToday}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{callsToday} appels • {smsToday} SMS</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tickets Ouverts</p>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 z-10">
            <p className="text-3xl font-extrabold text-rose-500">{openTickets.length}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Nécessitent une intervention humaine</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Coût Estimé (Jour)</p>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Zap className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 z-10">
            <p className="text-3xl font-extrabold text-[var(--text-primary)]">${estimatedCost.toFixed(2)}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">OpenAI + Telnyx combinés</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Solde Wallet</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Wallet className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 z-10">
            <p className="text-3xl font-extrabold text-[var(--text-primary)]">${org?.walletBalance?.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Budget disponible</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* End of Day Report for Agents */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Performances des Agents IA (Aujourd'hui)
            </h2>
            <Link href="/dashboard/ai-team" className="text-sm text-purple-500 hover:underline">Gérer l'équipe</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Agent</th>
                  <th className="pb-3 font-semibold text-center">Rôle</th>
                  <th className="pb-3 font-semibold text-center">Requêtes Traitées</th>
                  <th className="pb-3 font-semibold text-right">Temps d'activité</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[var(--text-secondary)] italic">Aucun agent recruté pour le moment.</td>
                  </tr>
                ) : (
                  employeeStats.map((emp) => (
                    <tr key={emp.id} className="border-b border-[var(--border-subtle)]/50 last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="py-4 font-medium text-[var(--text-primary)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <Brain className="w-4 h-4" />
                        </div>
                        {emp.name}
                      </td>
                      <td className="py-4 text-sm text-[var(--text-secondary)] text-center">{emp.jobTitle}</td>
                      <td className="py-4 text-center">
                        <span className="bg-[var(--bg-elevated)] px-3 py-1 rounded-full text-sm font-bold border border-[var(--border-subtle)]">
                          {emp.callsTaken}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-medium text-[var(--text-primary)] text-right flex justify-end items-center gap-1">
                        <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                        {emp.totalMinutes} min
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Escalation Tickets */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Urgences & Escalades
            </h2>
            <Link href="/dashboard/tickets" className="text-sm text-[var(--text-secondary)] hover:text-rose-500 transition-colors">Voir tout</Link>
          </div>

          <div className="space-y-4 flex-1">
            {openTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-subtle)] rounded-2xl">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-[var(--text-primary)] font-bold">Zéro ticket ouvert</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Vos IA gèrent parfaitement la situation.</p>
              </div>
            ) : (
              openTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-[var(--bg-surface-hover)] border border-rose-500/20 rounded-xl hover:border-rose-500/50 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1 group-hover:text-rose-500 transition-colors line-clamp-1">{ticket.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{ticket.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <DashboardCharts data={chartData} activities={[]} />
    </div>
  );
}
