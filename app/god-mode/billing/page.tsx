"use client";

import { useState } from "react";
import { CreditCard, DollarSign, Download, ArrowUpRight, ShieldCheck, History, Activity } from "lucide-react";

export default function GodModeBillingPage() {
  const [autoRecharge, setAutoRecharge] = useState(true);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <CreditCard className="text-cyan-500" />
             Gestion du Portefeuille (Billing & Wallet)
          </h1>
          <p className="text-[var(--text-secondary)]">Centre nerveux de facturation et de recharge à l'usage (Pay-As-You-Go).</p>
        </div>
        <button className="btn-primary-gradient px-4 py-2 text-sm shadow-md">
           Forcer une Recharge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Solde en temps réel */}
         <div className="lg:col-span-1 glass-panel p-8 rounded-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-4">
               <DollarSign className="w-5 h-5 text-cyan-500" />
               <h2 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-sm">Solde en temps réel</h2>
            </div>
            <div className="text-5xl font-extrabold text-[var(--text-primary)] mb-2">
               $4,250<span className="text-xl text-[var(--text-secondary)]">.00</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-500 mb-8">
               <Activity className="w-4 h-4" /> Décharge saine (env. $42/jour)
            </div>

            <div className="mt-auto p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">Auto-Recharge</span>
                  <button 
                     onClick={() => setAutoRecharge(!autoRecharge)}
                     className={`w-10 h-5 rounded-full transition-colors relative ${autoRecharge ? 'bg-cyan-500' : 'bg-gray-600'}`}
                  >
                     <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${autoRecharge ? 'translate-x-5' : ''}`}></div>
                  </button>
               </div>
               <p className="text-xs text-[var(--text-secondary)]">
                  Recharge de $500 lorsque le solde atteint $50.
               </p>
            </div>
         </div>

         {/* Allocation basée sur le budget */}
         <div className="lg:col-span-2 glass-panel p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <ShieldCheck className="text-emerald-500" />
               Allocation basée sur le budget
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
               Sécurisez les marges en forçant le système à bloquer les envois/appels dès qu'un budget prédéfini est atteint (décharge basée sur le coût réel).
            </p>

            <div className="space-y-4">
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl">
                     <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Budget SMS/MMS Quotidien</h3>
                     <div className="text-2xl font-bold text-cyan-500 mb-2">$150.00</div>
                     <div className="w-full bg-[var(--bg-surface-solid)] rounded-full h-1.5 mb-2">
                        <div className="bg-cyan-500 h-1.5 rounded-full w-[45%]"></div>
                     </div>
                     <p className="text-xs text-[var(--text-secondary)]">45% consommé aujourd'hui</p>
                  </div>
                  <div className="flex-1 p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl">
                     <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Budget Appels (Voice) Quotidien</h3>
                     <div className="text-2xl font-bold text-violet-500 mb-2">$50.00</div>
                     <div className="w-full bg-[var(--bg-surface-solid)] rounded-full h-1.5 mb-2">
                        <div className="bg-violet-500 h-1.5 rounded-full w-[82%]"></div>
                     </div>
                     <p className="text-xs text-rose-500 font-medium">82% consommé - Proche limite</p>
                  </div>
               </div>

               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-[var(--text-primary)]">Stratégie de blocage (Soft Limit vs Hard Limit)</h3>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Hard Limit : Coupe instantanément les appels en cours si le budget est dépassé.</p>
                  </div>
                  <select className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2">
                     <option>Soft Limit (Recommandé)</option>
                     <option>Hard Limit (Strict)</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      {/* Historique de recharge & Factures */}
      <div className="glass-panel p-8 rounded-2xl">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
               <History className="text-violet-500" />
               Historique des Transactions
            </h2>
            <select className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1">
               <option>Ce mois</option>
               <option>Le mois dernier</option>
               <option>Tout l'historique</option>
            </select>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                     <th className="pb-3 font-semibold">Date</th>
                     <th className="pb-3 font-semibold">Description</th>
                     <th className="pb-3 font-semibold">Montant</th>
                     <th className="pb-3 font-semibold">Statut</th>
                     <th className="pb-3 font-semibold text-right">Facture</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 text-[var(--text-secondary)]">24 Juin 2026</td>
                     <td className="py-4 font-medium text-[var(--text-primary)]">Auto-Recharge (Stripe)</td>
                     <td className="py-4 font-mono text-emerald-500 font-bold\">+$500.00</td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">Réussi</span></td>
                     <td className="py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-cyan-500 transition-colors">
                           <Download className="w-4 h-4" /> PDF
                        </button>
                     </td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 text-[var(--text-secondary)]">15 Juin 2026</td>
                     <td className="py-4 font-medium text-[var(--text-primary)]">Abonnement Forfait Mensuel</td>
                     <td className="py-4 font-mono text-[var(--text-primary)]">-$120.00</td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">Réussi</span></td>
                     <td className="py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-cyan-500 transition-colors">
                           <Download className="w-4 h-4" /> PDF
                        </button>
                     </td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 text-[var(--text-secondary)]">02 Juin 2026</td>
                     <td className="py-4 font-medium text-[var(--text-primary)]">Recharge Manuelle (Stripe)</td>
                     <td className="py-4 font-mono text-emerald-500 font-bold\">+$1,000.00</td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">Réussi</span></td>
                     <td className="py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-cyan-500 transition-colors">
                           <Download className="w-4 h-4" /> PDF
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
