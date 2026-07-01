"use client";

import { useState, useTransition } from "react";
import { CreditCard, DollarSign, Activity, History, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { adjustTenantBalance } from "./actions";

export function BillingDashboardClient({ 
  initialWallets, 
  initialTransactions 
}: { 
  initialWallets: any[], 
  initialTransactions: any[] 
}) {
  const [wallets, setWallets] = useState(initialWallets);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isPending, startTransition] = useTransition();

  // Adjustment form state
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("CREDIT"); // CREDIT or DEBIT
  const [adjustmentDescription, setAdjustmentDescription] = useState("");

  const totalSystemBalance = wallets.reduce((acc, w) => acc + w.walletBalance, 0);

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !adjustmentAmount || !adjustmentDescription) {
      alert("Please fill all fields");
      return;
    }

    let finalAmount = parseFloat(adjustmentAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert("Amount must be a positive number");
      return;
    }

    if (adjustmentType === "DEBIT") {
      finalAmount = -finalAmount; // Make it negative
    }

    startTransition(async () => {
      const res = await adjustTenantBalance(selectedOrgId, finalAmount, adjustmentDescription);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Balance successfully updated!");
        // We could refresh the data here by calling router.refresh() 
        // or just let the revalidatePath from server action do its job.
        window.location.reload(); 
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <CreditCard className="text-cyan-500" />
             Master Ledger (Profit Engine)
          </h1>
          <p className="text-[var(--text-secondary)]">Manage tenant wallets, add credit, and track all billing transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Global Total Balance Liability */}
         <div className="lg:col-span-1 glass-panel p-8 rounded-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-4">
               <DollarSign className="w-5 h-5 text-cyan-500" />
               <h2 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-sm">Total User Funds (Liability)</h2>
            </div>
            <div className="text-5xl font-extrabold text-[var(--text-primary)] mb-2">
               ${totalSystemBalance.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8">
               <Activity className="w-4 h-4" /> Across {wallets.length} active tenants
            </div>
         </div>

         {/* Manual Adjustment Form */}
         <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Manual Balance Adjustment</h2>
            <form onSubmit={handleAdjustBalance} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select Tenant</label>
                   <select 
                     value={selectedOrgId} 
                     onChange={(e) => setSelectedOrgId(e.target.value)}
                     className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white"
                   >
                     <option value="">-- Choose Tenant --</option>
                     {wallets.map(w => (
                       <option key={w.id} value={w.id}>{w.name} (Bal: ${w.walletBalance.toFixed(2)})</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Amount ($)</label>
                     <input 
                       type="number" step="0.01" min="0.01"
                       value={adjustmentAmount}
                       onChange={(e) => setAdjustmentAmount(e.target.value)}
                       className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white"
                       placeholder="50.00"
                     />
                   </div>
                   <div className="flex-1">
                     <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type</label>
                     <select 
                       value={adjustmentType} 
                       onChange={(e) => setAdjustmentType(e.target.value)}
                       className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white"
                     >
                       <option value="CREDIT">Add (Credit)</option>
                       <option value="DEBIT">Remove (Debit)</option>
                     </select>
                   </div>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description (Will be visible in Invoice)</label>
                 <input 
                   type="text" 
                   value={adjustmentDescription}
                   onChange={(e) => setAdjustmentDescription(e.target.value)}
                   className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white"
                   placeholder="Manual top-up for Demo"
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={isPending}
                 className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
               >
                 {isPending ? "Processing..." : "Process Adjustment"}
               </button>
            </form>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tenant Wallets Table */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Tenant Wallets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                     <th className="px-4 py-3 font-medium">Organization</th>
                     <th className="px-4 py-3 font-medium text-right">Wallet Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {wallets.map(w => (
                   <tr key={w.id} className="hover:bg-[var(--bg-surface-hover)]">
                     <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{w.name}</td>
                     <td className={`px-4 py-3 text-right font-mono font-bold ${w.walletBalance < 10 ? 'text-rose-500' : 'text-emerald-400'}`}>
                       ${w.walletBalance.toFixed(2)}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* Global Transaction History */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="text-violet-500 w-5 h-5" />
            Global Ledger (50 latest)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                     <th className="px-4 py-3 font-medium">Tenant</th>
                     <th className="px-4 py-3 font-medium">Desc</th>
                     <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {transactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-[var(--bg-surface-hover)]">
                     <td className="px-4 py-3 text-[var(--text-secondary)] truncate max-w-[120px]">{tx.organization.name}</td>
                     <td className="px-4 py-3 text-[var(--text-secondary)] text-xs truncate max-w-[150px]">{tx.description}</td>
                     <td className="px-4 py-3 text-right">
                       <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {tx.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                         ${Math.abs(tx.amount).toFixed(2)}
                       </span>
                     </td>
                   </tr>
                 ))}
                 {transactions.length === 0 && (
                   <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No transactions yet.</td></tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
