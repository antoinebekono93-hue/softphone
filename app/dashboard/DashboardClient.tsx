"use client";

import { useState } from "react";
import { Activity, Phone, Clock, PhoneMissed, PhoneForwarded, Plus, MessageSquare, Zap } from "lucide-react";

export function DashboardClient({
  userName,
  initialStats,
  initialLogs
}: {
  userName: string;
  initialStats: any;
  initialLogs: any[];
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'shortcuts'>('overview');

  const stats = initialStats ? [
    { label: "Total Calls (This Month)", value: initialStats.callCount.toString(), trend: "+12%", isPositive: true, icon: <Phone className="w-5 h-5" /> },
    { label: "Minutes Used", value: initialStats.minutesUsed.toLocaleString(), trend: "+5%", isPositive: true, icon: <Clock className="w-5 h-5" /> },
    { label: "SMS Sent/Received", value: initialStats.smsCount.toString(), trend: "+8%", isPositive: true, icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Missed Calls", value: initialStats.missedCalls.toString(), trend: "-2%", isPositive: false, icon: <PhoneMissed className="w-5 h-5" /> },
    { label: "Active Phone Numbers", value: initialStats.activeNumbers.toString(), trend: "0%", isPositive: true, icon: <PhoneForwarded className="w-5 h-5" /> },
    { label: "Wallet Balance", value: `$${initialStats.walletBalance.toFixed(2)}`, trend: "Top up", isPositive: true, icon: <Zap className="w-5 h-5" /> },
  ] : [
    { label: "Total Calls (This Month)", value: "0", trend: "0%", isPositive: true, icon: <Phone className="w-5 h-5" /> },
    { label: "Minutes Used", value: "0", trend: "0%", isPositive: true, icon: <Clock className="w-5 h-5" /> },
    { label: "SMS Sent/Received", value: "0", trend: "0%", isPositive: true, icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Missed Calls", value: "0", trend: "0%", isPositive: false, icon: <PhoneMissed className="w-5 h-5" /> },
    { label: "Active Phone Numbers", value: "0", trend: "0%", isPositive: true, icon: <PhoneForwarded className="w-5 h-5" /> },
    { label: "Wallet Balance", value: "$0.00", trend: "Top up", isPositive: true, icon: <Zap className="w-5 h-5" /> },
  ];

  const logsToRender = initialLogs && initialLogs.length > 0 ? initialLogs : [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Welcome back, <span className="text-gradient">{userName}</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Here's what's happening in your organization today.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-[var(--bg-surface-hover)] p-1 rounded-xl mb-8 w-max border border-[var(--border-subtle)]">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-[var(--bg-surface-solid)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Vue d'ensemble
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'activity' ? 'bg-[var(--bg-surface-solid)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Activité Récente
        </button>
        <button 
          onClick={() => setActiveTab('shortcuts')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'shortcuts' ? 'bg-[var(--bg-surface-solid)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Raccourcis
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Plan & Wallet Banner */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[var(--bg-surface-hover)] to-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex items-center justify-between">
             <div>
               <h2 className="text-lg font-bold text-white mb-1">Plan Status: <span className="text-cyan-400 capitalize">{initialStats?.planStatus || 'FREE'}</span></h2>
               <p className="text-sm text-[var(--text-secondary)]">Your trial ends in 14 days. Add funds to your wallet to continue using services.</p>
             </div>
             <button className="apple-btn px-6 py-2 bg-white text-black hover:bg-gray-100">
               Top Up Wallet
             </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
                {i === 0 && <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none"></div>}
                <div className="flex items-start justify-between mb-2 relative z-10">
                  <div className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider leading-tight">{stat.label}</div>
                  <div className="p-2 bg-[var(--bg-surface-hover)] rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm">
                    {stat.icon}
                  </div>
                </div>
                <div className="flex items-end justify-between relative z-10">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                  <div className={`text-xs font-bold ${stat.trend === '0%' ? 'text-[var(--text-secondary)]' : (stat.isPositive ? 'text-emerald-500' : 'text-rose-500')}`}>
                    {stat.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Area */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" /> Volume d'appels & SMS (7 derniers jours)
            </h3>
            <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-hover)]">
              <span className="text-[var(--text-secondary)] text-sm">Graphique Analytics (Chart.js / Recharts)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Activity */}
      {activeTab === 'activity' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel flex flex-col overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-500" /> Journal d'Activité Récente
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {logsToRender.length === 0 ? (
                  <div className="text-center p-8 text-[var(--text-secondary)]">Aucune activité récente.</div>
                ) : (
                  logsToRender.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                      <div className="flex items-start gap-4">
                         <div className={`w-10 h-10 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0`}>
                            <Phone className={`w-4 h-4 ${log.status === 'NO_ANSWER' ? 'text-rose-500' : 'text-cyan-500'}`} />
                         </div>
                         <div>
                           <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
                             {log.direction === 'OUTBOUND' ? `Appel sortant vers ${log.toNumber}` : `Appel entrant de ${log.fromNumber}`}
                           </div>
                           <div className="text-xs text-[var(--text-secondary)]">{new Date(log.startedAt).toLocaleString()} • Durée: {log.duration}s</div>
                         </div>
                      </div>
                      <div>
                         <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${log.status === 'NO_ANSWER' ? 'badge-glass-red' : 'badge-glass-green'}`}>
                           {log.status === 'COMPLETED' ? 'Répondu' : log.status}
                         </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Shortcuts */}
      {activeTab === 'shortcuts' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all">
                 <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-[var(--text-primary)] mb-1">Lancer un appel</h3>
                 <p className="text-xs text-[var(--text-secondary)]">Ouvrir le softphone immédiatement</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
                 <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-[var(--text-primary)] mb-1">Nouvelle Campagne SMS</h3>
                 <p className="text-xs text-[var(--text-secondary)]">Créer et envoyer un message groupé</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-[var(--text-primary)] mb-1">Acheter un Numéro</h3>
                 <p className="text-xs text-[var(--text-secondary)]">Rechercher des numéros locaux</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
