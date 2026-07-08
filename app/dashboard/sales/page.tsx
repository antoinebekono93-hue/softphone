import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ReceiptEuro, CheckCircle2, Clock } from 'lucide-react';

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const orgId = session.user.organizationId;

  // Fetch Quotes
  const quotes = await prisma.quote.findMany({
    where: { organizationId: orgId },
    include: { contact: true },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch Invoices
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    include: { contact: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventes & Finance</h1>
        <p className="text-muted-foreground text-lg">Retrouvez les Devis et Factures générés par vos Agents IA.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Colonne Devis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Devis (Quotes)
            </CardTitle>
            <CardDescription>Générés lors des appels ou échanges WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucun devis généré.
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map(quote => (
                  <div key={quote.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50/50">
                    <div>
                      <p className="font-medium">{quote.contact.name} <span className="text-muted-foreground font-normal">({quote.contact.phone})</span></p>
                      <p className="text-sm text-muted-foreground">{quote.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{quote.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{quote.amount} €</p>
                      <Badge variant="outline" className={quote.status === 'SENT' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-600'}>
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Colonne Factures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptEuro className="w-5 h-5" /> Factures (Invoices)
            </CardTitle>
            <CardDescription>Historique de facturation.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune facture générée.
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50/50">
                    <div>
                      <p className="font-medium">{invoice.contact.name} <span className="text-muted-foreground font-normal">({invoice.contact.phone})</span></p>
                      <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{invoice.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{invoice.amount} €</p>
                      <Badge variant="outline" className={invoice.status === 'SENT' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-600'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
