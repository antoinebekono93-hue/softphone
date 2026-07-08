import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Megaphone, CheckCircle2, PauseCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      _count: { select: { recipients: true } },
      recipients: {
        select: { status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'RUNNING': return <Megaphone className="w-5 h-5 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'PAUSED': return <PauseCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campagnes Sortantes</h1>
          <p className="text-muted-foreground text-lg">Lancez des appels en masse avec votre IA.</p>
        </div>
        <Link href="/dashboard/campaigns/create">
          <Button size="lg" className="gap-2">
            <PlusCircle className="w-5 h-5" /> Nouvelle Campagne
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-gray-200">
            <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune campagne</h3>
            <p className="text-muted-foreground mb-4">Commencez à prospecter en créant votre première campagne.</p>
          </div>
        )}
        
        {campaigns.map(c => {
          const total = c._count.recipients;
          const answered = c.recipients.filter((contact: any) => contact.status === 'ANSWERED').length;
          const progress = total > 0 ? Math.round((c.recipients.filter((contact: any) => contact.status !== 'PENDING').length / total) * 100) : 0;
          
          return (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{c.name}</CardTitle>
                  {getStatusIcon(c.status)}
                </div>
                <CardDescription>Créée le {c.createdAt.toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-muted-foreground mb-1">Contacts</div>
                      <div className="text-2xl font-semibold">{total}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-green-600 mb-1">Décrochés</div>
                      <div className="text-2xl font-semibold text-green-700">{answered}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
