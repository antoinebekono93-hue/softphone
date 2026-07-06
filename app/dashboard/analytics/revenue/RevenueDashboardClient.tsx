"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Contact } from "@prisma/client";
import { AlertTriangle, TrendingUp, ShoppingCart, UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  totalSpent: number;
  totalLTV: number;
  highRiskContacts: Contact[];
  abandonedValue: number;
  recoveredValue: number;
}

export function RevenueDashboardClient({ totalSpent, totalLTV, highRiskContacts, abandonedValue, recoveredValue }: Props) {
  
  return (
    <div className="space-y-6">
      
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total Généré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Revenus CRM & Campagnes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers Récupérés (IA)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(recoveredValue)}</div>
            <p className="text-xs text-muted-foreground">vs {formatCurrency(abandonedValue)} perdus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value (LTV)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLTV)}</div>
            <p className="text-xs text-muted-foreground">Valeur projetée à vie</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Risque de Churn Global</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{highRiskContacts.length} Clients</div>
            <p className="text-xs text-red-400">À recontacter d'urgence</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste d'Alerte Churn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Radar d'Attrition (Churn)
          </CardTitle>
          <CardDescription>
            L'IA a détecté une anomalie dans le comportement d'achat de ces clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {highRiskContacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun client à risque détecté pour le moment.</p>
            ) : (
              highRiskContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{contact.name || contact.phone}</p>
                      {contact.isVip && <Badge className="bg-purple-500 hover:bg-purple-600">VIP</Badge>}
                      <Badge variant={contact.churnRiskScore > 70 ? "destructive" : "secondary"}>
                        Risque {contact.churnRiskScore}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dernier achat: {contact.lastPurchaseAt ? new Date(contact.lastPurchaseAt).toLocaleDateString() : 'Inconnu'} • CA: {formatCurrency(contact.totalSpent)}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/whatsapp-inbox?phone=${contact.phone}`}>
                      Message WhatsApp
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
