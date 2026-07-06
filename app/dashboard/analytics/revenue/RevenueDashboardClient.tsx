"use client";

import { formatCurrency } from "@/lib/utils";
import { Contact } from "@prisma/client";
import { AlertTriangle, TrendingUp, ShoppingCart, UserX } from "lucide-react";
import Link from "next/link";

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
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">CA Total Généré</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Revenus CRM & Campagnes</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Paniers Récupérés (IA)</h3>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(recoveredValue)}</div>
            <p className="text-xs text-muted-foreground">vs {formatCurrency(abandonedValue)} perdus</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Lifetime Value (LTV)</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(totalLTV)}</div>
            <p className="text-xs text-muted-foreground">Valeur projetée à vie</p>
          </div>
        </div>

        <div className="rounded-xl border bg-red-500/10 text-card-foreground shadow border-red-500/20">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-red-500">Risque de Churn Global</h3>
            <UserX className="h-4 w-4 text-red-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-500">{highRiskContacts.length} Clients</div>
            <p className="text-xs text-red-400">À recontacter d'urgence</p>
          </div>
        </div>
      </div>

      {/* Liste d'Alerte Churn */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Radar d'Attrition (Churn)
          </h3>
          <p className="text-sm text-muted-foreground">
            L'IA a détecté une anomalie dans le comportement d'achat de ces clients.
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {highRiskContacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun client à risque détecté pour le moment.</p>
            ) : (
              highRiskContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{contact.name || contact.phone}</p>
                      {contact.isVip && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-purple-500 text-white hover:bg-purple-600">VIP</span>}
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${contact.churnRiskScore > 70 ? "bg-red-500 text-white hover:bg-red-600" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                        Risque {contact.churnRiskScore}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dernier achat: {contact.lastPurchaseAt ? new Date(contact.lastPurchaseAt).toLocaleDateString() : 'Inconnu'} • CA: {formatCurrency(contact.totalSpent)}
                    </p>
                  </div>
                  <Link href={`/dashboard/whatsapp-inbox?phone=${contact.phone}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      Message WhatsApp
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
