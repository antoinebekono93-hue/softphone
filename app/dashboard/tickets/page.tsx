import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default async function SupportTicketsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const orgId = session.user.organizationId;

  // Fetch Tickets
  const tickets = await prisma.ticket.findMany({
    where: { organizationId: orgId },
    include: { contact: true },
    orderBy: { createdAt: 'desc' }
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Élevée</Badge>;
      case 'NORMAL':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Normale</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="text-gray-600">Basse</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Nouveau</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500 hover:bg-blue-600">En cours</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Résolu</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Fermé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support & Helpdesk</h1>
        <p className="text-muted-foreground text-lg">Gérez les demandes d'assistance qualifiées et créées par vos Agents IA.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" /> Tickets d'Intervention
          </CardTitle>
          <CardDescription>Vos agents IA créent un ticket lorsqu'ils ne peuvent pas résoudre un problème technique ou qu'une action humaine est requise.</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Aucun ticket de support en cours. Vos agents gèrent tout !
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">{ticket.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <strong className="font-medium text-gray-700">Client:</strong> {ticket.contact.name} ({ticket.contact.phone})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex-shrink-0">
                    <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
                      Prendre en charge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
