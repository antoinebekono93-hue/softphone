import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MessageSquare, PhoneCall, Clock, CheckCircle2, AlertCircle, Bot, Zap, Coins } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';

export const metadata = {
  title: 'Centre de Commandement Analytique | Antigravity',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  const orgId = session.user.organizationId;

  // --- 1. DATA EXTRACTION ---
  
  // Date ranges
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Fetch AI Employees
  const aiEmployees = await prisma.aIEmployee.findMany({
    where: { organizationId: orgId }
  });

  // Fetch all interactions in last 30 days
  const calls = await prisma.callLog.findMany({
    where: { organizationId: orgId, startedAt: { gte: thirtyDaysAgo } }
  });

  const messages = await prisma.smsMessage.findMany({
    where: { organizationId: orgId, sentAt: { gte: thirtyDaysAgo } }
  });

  // Fetch all contacts to calculate resolution rate
  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId }
  });

  // --- 2. GLOBAL KPIs ---

  const totalCalls = calls.length;
  const totalMessages = messages.length;
  const totalInteractions = totalCalls + totalMessages;

  // Resolution Rate (Contacts managed by Bot and NOT escalated)
  const botContacts = contacts.filter(c => c.botMode || c.escalationStatus === 'RESOLVED');
  const nonEscalatedBotContacts = botContacts.filter(c => c.escalationStatus !== 'REQUESTED');
  const resolutionRate = botContacts.length > 0 
    ? Math.round((nonEscalatedBotContacts.length / botContacts.length) * 100) 
    : 0;

  // Time Saved & ROI
  // Assumption: 1 call handled by AI = 4 mins saved. 1 message session = 2 mins saved.
  // We count unique message contacts instead of individual messages for "sessions".
  const uniqueMessageContacts = new Set(messages.map(m => m.contactId)).size;
  
  const timeSavedMinutes = (totalCalls * 4) + (uniqueMessageContacts * 2);
  const timeSavedHours = (timeSavedMinutes / 60).toFixed(1);

  // ROI: Avg Human Cost = 25€/h.
  const humanCostSaved = timeSavedMinutes > 0 ? (timeSavedMinutes / 60) * 25 : 0;
  // Cost: Telnyx/Twilio cost approx 0.05€ per call/msg
  const aiCost = totalInteractions * 0.05;
  const netRoi = (humanCostSaved - aiCost).toFixed(0);

  // --- 3. CHART DATA ---
  // Aggregate per day for the last 30 days
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const dayCalls = calls.filter(c => c.startedAt >= dayStart && c.startedAt <= dayEnd).length;
    const dayMessages = messages.filter(m => m.sentAt >= dayStart && m.sentAt <= dayEnd).length;

    chartData.push({
      date: dateStr,
      calls: dayCalls,
      messages: dayMessages
    });
  }

  // --- 4. AGENT LEADERBOARD ---
  // We associate calls with phone numbers to map back to AI Employees
  const employeeStats = aiEmployees.map(emp => {
    const empCalls = calls.filter(c => c.phoneNumberId === emp.voicePhoneNumberId);
    
    // For text, it's harder to map if they share a number, but we assume the agent was active.
    // We'll focus on calls for QA score.
    const callsWithQA = empCalls.filter(c => c.qaScore !== null);
    const avgQaScore = callsWithQA.length > 0 
      ? (callsWithQA.reduce((acc, c) => acc + (c.qaScore || 0), 0) / callsWithQA.length).toFixed(1)
      : "-";

    return {
      id: emp.id,
      name: emp.name,
      role: emp.jobTitle,
      interactions: empCalls.length, // Only counting calls mapped to their specific number for now
      avgQaScore
    };
  }).sort((a, b) => b.interactions - a.interactions);

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <Zap className="text-cyan-500" /> Centre de Commandement Analytique
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-lg">Mesurez l'impact et la performance de votre flotte d'Agents IA sur les 30 derniers jours.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare className="w-16 h-16" /></div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">Volume d'Interactions</p>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{totalInteractions}</div>
          <div className="mt-4 flex gap-4 text-sm font-semibold">
            <span className="text-cyan-500">{totalMessages} SMS/WA</span>
            <span className="text-violet-500">{totalCalls} Appels</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="w-16 h-16 text-emerald-500" /></div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">Résolution Autonome</p>
          <div className="text-4xl font-black text-emerald-500 tracking-tight">{resolutionRate}%</div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Des conversations gérées sans intervention humaine.</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-16 h-16 text-amber-500" /></div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">Temps Humain Sauvé</p>
          <div className="text-4xl font-black text-amber-500 tracking-tight">{timeSavedHours}h</div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Heures de travail automatisées par l'IA.</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Coins className="w-16 h-16 text-cyan-500" /></div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">Économies (ROI)</p>
          <div className="text-4xl font-black text-cyan-400 tracking-tight">+{netRoi}€</div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Valeur nette générée (Coût Salarial estimé - Coût API).</p>
        </div>
      </div>

      {/* CHARTS */}
      <AnalyticsCharts data={chartData} />

      {/* AGENT LEADERBOARD */}
      <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bot className="text-cyan-500" /> Performances par Agent IA (Appels)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] bg-[var(--bg-base)]">
                <th className="p-4 font-semibold">Agent IA</th>
                <th className="p-4 font-semibold">Rôle</th>
                <th className="p-4 font-semibold">Appels Traités (30j)</th>
                <th className="p-4 font-semibold">Score Qualité Moyen</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">
                    Aucun agent déployé ou aucune donnée d'appel.
                  </td>
                </tr>
              ) : (
                employeeStats.map(emp => (
                  <tr key={emp.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)]">{emp.name}</div>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">{emp.role}</td>
                    <td className="p-4 font-mono font-semibold text-[var(--text-primary)]">{emp.interactions}</td>
                    <td className="p-4">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/10 text-green-500">
                        {emp.avgQaScore} / 10
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
