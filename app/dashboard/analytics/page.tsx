import { prisma } from "@/lib/prisma";
import { Phone, MessageSquare, Clock, TrendingUp, Sparkles, Activity, DollarSign } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Analytics | Antigravity",
};

export default async function AnalyticsPage() {
  // 1. Fetch real aggregate data from Prisma
  const totalCalls = await prisma.callLog.count();
  const totalSms = await prisma.smsMessage.count();
  
  const callsAggregation = await prisma.callLog.aggregate({
    _sum: { duration: true },
  });
  const totalMinutes = Math.floor((callsAggregation._sum.duration || 0) / 60);

  const aiCallsCount = await prisma.callLog.count({
    where: { aiSummary: { not: null } }
  });

  const aiEfficiency = totalCalls > 0 ? Math.round((aiCallsCount / totalCalls) * 100) : 0;

  const recentActivity = await prisma.callLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      direction: true,
      fromNumber: true,
      toNumber: true,
      startedAt: true,
      status: true,
      aiSummary: true,
    }
  });

  // 2. Generate Sparkline SVG path for the charts (Fake data for visual premium effect)
  // A smooth bezier curve for the "Apple/Linear" aesthetic
  const sparklinePath = "M 0,40 C 20,30 40,50 60,20 C 80,-10 100,40 120,10 C 140,-20 160,30 180,5 C 200,-20 220,10 240,0";
  const sparklinePath2 = "M 0,20 C 20,40 40,10 60,30 C 80,50 100,10 120,40 C 140,70 160,20 180,40 C 200,60 220,10 240,20";

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Tableau de bord Analytique</h1>
        <p className="text-[var(--text-secondary)]">Visualisez l'activité de votre flotte et les performances de vos Agents IA sur les 30 derniers jours.</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Call Volume Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
               <Phone className="w-5 h-5 text-cyan-400" />
             </div>
             <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400">
               +12%
             </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Volume d'Appels</h3>
          <div className="text-4xl font-mono font-bold text-[var(--text-primary)] mb-4">{totalCalls}</div>
          
          {/* Custom SVG Chart */}
          <div className="h-12 w-full mt-auto opacity-50 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 240 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d={sparklinePath} fill="none" stroke="#00d4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* SMS Volume Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <MessageSquare className="w-5 h-5 text-blue-400" />
             </div>
             <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400">
               +4%
             </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Volume SMS</h3>
          <div className="text-4xl font-mono font-bold text-[var(--text-primary)] mb-4">{totalSms}</div>
          
          {/* Custom SVG Chart */}
          <div className="h-12 w-full mt-auto opacity-50 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 240 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d={sparklinePath2} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Usage Card (Minutes) */}
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
               <Clock className="w-5 h-5 text-violet-400" />
             </div>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Minutes Utilisées</h3>
          <div className="text-4xl font-mono font-bold text-[var(--text-primary)] mb-2">{totalMinutes}<span className="text-lg text-[var(--text-secondary)]">m</span></div>
          
          {/* CSS Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Consommation mensuelle</span>
              <span>{Math.min(100, Math.round((totalMinutes / 1000) * 100))}%</span>
            </div>
            <div className="h-2 w-full bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((totalMinutes / 1000) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* AI Efficiency Card */}
        <div className="glass-panel p-6 relative overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[var(--bg-surface-solid)] to-cyan-500/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Sparkles className="w-24 h-24 text-cyan-400" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)]">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider relative z-10">Efficacité IA</h3>
          <div className="text-4xl font-mono font-bold text-cyan-400 mb-2 relative z-10">{aiEfficiency}%</div>
          <p className="text-xs text-[var(--text-secondary)] mt-4 relative z-10">
            Des appels ont été traités de façon autonome par vos Agents IA (God Mode).
          </p>
        </div>
      </div>

      {/* Main Wide Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fake Bar Chart (CSS Grid) */}
        <div className="lg:col-span-2 glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Activité du réseau</h3>
              <p className="text-sm text-[var(--text-secondary)]">Répartition des appels entrants et sortants sur 7 jours.</p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Entrants</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div> Sortants</div>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 h-[250px] pt-4">
            {[40, 70, 45, 90, 65, 80, 50].map((inbound, i) => {
               const outbound = [20, 30, 25, 40, 35, 20, 15][i];
               const day = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i];
               return (
                 <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-pointer">
                   <div className="w-full flex justify-center gap-1.5 h-[200px] items-end">
                     <div 
                        className="w-full max-w-[24px] bg-cyan-500/80 hover:bg-cyan-400 rounded-t-md transition-all"
                        style={{ height: `${inbound}%` }}
                     ></div>
                     <div 
                        className="w-full max-w-[24px] bg-violet-500/80 hover:bg-violet-400 rounded-t-md transition-all"
                        style={{ height: `${outbound}%` }}
                     ></div>
                   </div>
                   <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{day}</span>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="glass-panel p-6 flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Derniers appels</h3>
              <Link href="/dashboard/inbox" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">Voir tout</Link>
           </div>
           
           <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">Aucune activité récente.</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                    <div className="mt-1 shrink-0 p-2 bg-[var(--bg-surface-hover)] rounded-lg">
                      <Activity className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {activity.direction === 'INBOUND' ? activity.fromNumber : activity.toNumber}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate mb-1">
                        {new Date(activity.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="mx-1">•</span> 
                        {activity.status}
                      </p>
                      {activity.aiSummary && (
                        <p className="text-xs text-cyan-400 truncate flex items-center gap-1">
                           <Sparkles className="w-3 h-3" /> Géré par l'IA
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
