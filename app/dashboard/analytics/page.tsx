import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneCall, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const orgId = session.user.organizationId;

  // Récupération des logs d'appels récents
  const calls = await prisma.callLog.findMany({
    where: { organizationId: orgId },
    orderBy: { startedAt: 'desc' },
    take: 50
  });

  // Calcul des KPIs
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((acc, call) => acc + (call.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  
  const callsWithQA = calls.filter(c => c.qaScore !== null);
  const avgQaScore = callsWithQA.length > 0 
    ? (callsWithQA.reduce((acc, c) => acc + (c.qaScore || 0), 0) / callsWithQA.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supervision & QA</h1>
        <p className="text-muted-foreground text-lg">Analysez les performances de vos Agents IA en temps réel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appels (50 derniers)</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration} s</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Qualité (QA)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgQaScore} / 10</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Échec</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalCalls > 0 ? Math.round((calls.filter(c => c.status === "FAILED").length / totalCalls) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal des Appels</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">Aucun appel enregistré pour le moment.</div>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Direction</th>
                    <th className="px-4 py-3 text-left font-medium">Numéro</th>
                    <th className="px-4 py-3 text-left font-medium">Durée</th>
                    <th className="px-4 py-3 text-left font-medium">Score QA</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-b hover:bg-gray-50/50">
                      <td className="px-4 py-3">{call.startedAt.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${call.direction === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {call.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{call.direction === 'INBOUND' ? call.fromNumber : call.toNumber}</td>
                      <td className="px-4 py-3">{call.duration}s</td>
                      <td className="px-4 py-3">
                        {call.qaScore ? (
                          <span className={`font-semibold ${call.qaScore >= 8 ? 'text-green-600' : call.qaScore >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {call.qaScore}/10
                          </span>
                        ) : (
                          <span className="text-gray-400">En cours...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/calls/${call.id}`} className="text-blue-600 hover:underline">
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
