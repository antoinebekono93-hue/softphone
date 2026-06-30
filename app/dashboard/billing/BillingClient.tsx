"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

export default function BillingClient({ 
  initialBalance, 
  planName,
  planPrice
}: { 
  initialBalance: number; 
  planName: string;
  planPrice: number;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [customAmount, setCustomAmount] = useState<string>("20");

  const fetchWalletData = async () => {
    try {
      const res = await fetch("/api/billing/wallet");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleSimulatedTopup = async (amount: number) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/billing/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Rechargement échoué");
      
      toast.success(`Rechargement de $${amount} réussi !`);
      await fetchWalletData();
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur : " + error.message);
    } finally {
      setIsPending(false);
    }
  };

  const predefinedAmounts = [20, 50, 100];

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Wallet Balance Card */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4H6a2 2 0 01-2-2V6"/><path d="M20 12v4h-2a2 2 0 01-2-2v-2h4z"/></svg>
          Wallet Balance
        </h2>
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
          ${balance.toFixed(2)}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Used for out-of-plan minutes, SMS, and AI features.
        </p>

        <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Up Balance</h3>
          
          <div className="flex flex-wrap gap-2">
            {predefinedAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setCustomAmount(amount.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${parseInt(customAmount) === amount ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'}`}
              >
                +${amount}
              </button>
            ))}
            <div className="relative flex-1 min-w-[100px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
              <input 
                type="number" 
                min="5"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-3 pt-2">
            <button 
              onClick={() => handleSimulatedTopup(parseInt(customAmount))}
              disabled={isPending || !parseInt(customAmount) || parseInt(customAmount) < 5}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-emerald-400 hover:opacity-90 text-white transition-all disabled:opacity-50"
            >
              {isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Simuler le paiement (Test)"}
            </button>
          </div>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] flex flex-col">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Current Plan
        </h2>
        
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{planName}</div>
          <div className="text-4xl font-black text-[var(--text-secondary)]">
            ${planPrice}<span className="text-lg text-[var(--text-tertiary)]">/mo</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>
    </div>

    {/* Transactions History */}
    <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center justify-between">
        Historique des Transactions
        <button onClick={fetchWalletData} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
           <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${isLoadingHistory ? 'animate-spin' : ''}`} />
        </button>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-surface-hover)]">
            <tr>
              <th className="px-6 py-3 rounded-l-lg">Date</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3 text-right rounded-r-lg">Montant</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && !isLoadingHistory && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  Aucune transaction trouvée.
                </td>
              </tr>
            )}
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-6 py-4 text-[var(--text-secondary)]">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                  {tx.description}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {tx.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {tx.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
  );
}
