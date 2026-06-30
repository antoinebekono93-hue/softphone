import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  // Dans un vrai projet, on vérifierait si session.user.role === 'ADMIN'
  if (!session?.user) {
    redirect("/login");
  }

  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      walletBalance: true,
      _count: { select: { users: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const recentTransactions = await prisma.walletTransaction.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { organization: { select: { name: true } } }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Administration Système</h1>
        <p className="text-[var(--text-secondary)] mt-2">Vue d'ensemble des portefeuilles et transactions de toutes les organisations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Organizations List */}
        <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Organisations & Soldes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-surface-hover)]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Nom</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Solde Wallet</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="px-4 py-4 font-medium text-[var(--text-primary)]">{org.name}</td>
                    <td className="px-4 py-4 text-right font-bold text-cyan-400">${org.walletBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Transactions History */}
        <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Dernières Transactions Globales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-surface-hover)]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--text-primary)]">{tx.organization.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {tx.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
