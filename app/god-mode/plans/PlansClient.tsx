"use client";

import { useState, useTransition } from "react";
import { createOrUpdatePlan, syncPlanToStripe, syncPlanToFlutterwave } from "./actions";

type Plan = any; // We'll just pass the Prisma Plan shape here

export function PlansClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    monthlyPrice: 0,
    includedMinutes: 0,
    includedSms: 0,
    features: [""],
  });

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        includedMinutes: plan.includedMinutes,
        includedSms: plan.includedSms,
        features: plan.features.length > 0 ? plan.features.map((f: any) => f.name) : [""],
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        monthlyPrice: 0,
        includedMinutes: 0,
        includedSms: 0,
        features: [""],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createOrUpdatePlan({
          id: editingPlan?.id,
          name: formData.name,
          monthlyPrice: Number(formData.monthlyPrice),
          includedMinutes: Number(formData.includedMinutes),
          includedSms: Number(formData.includedSms),
          features: formData.features.filter(f => f.trim() !== ""),
        });
        setIsModalOpen(false);
        // The page will revalidate and we'll see updates on next refresh or via server actions, 
        // but we should ideally refresh. For simplicity, we trigger router.refresh() if needed, 
        // but Next.js Server Actions with revalidatePath usually update the page automatically.
      } catch (err) {
        console.error(err);
        alert("Error saving plan");
      }
    });
  };

  const handleSyncToStripe = (planId: string) => {
    startTransition(async () => {
      try {
        await syncPlanToStripe(planId);
        alert("Synced to Stripe successfully!");
      } catch (err: any) {
        console.error(err);
        alert("Stripe Error: " + err.message);
      }
    });
  };

  const handleSyncToFlutterwave = (planId: string) => {
    startTransition(async () => {
      try {
        await syncPlanToFlutterwave(planId);
        alert("Synced to Flutterwave successfully!");
      } catch (err: any) {
        console.error(err);
        alert("Flutterwave Error: " + err.message);
      }
    });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dynamic Plans</h1>
          <p className="text-[var(--text-secondary)]">Create and manage your SaaS pricing tiers without code.</p>
        </div>
        <button onClick={() => openModal()} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-[var(--text-primary)] rounded-lg font-medium shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialPlans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] p-6 relative flex flex-col">
            <div className="absolute top-6 right-6">
               <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                 {plan.isActive ? "Active" : "Archived"}
               </span>
            </div>

            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <div className="text-3xl font-light mb-6">${plan.monthlyPrice}<span className="text-sm text-[var(--text-secondary)]">/mo</span></div>
            
            <div className="space-y-4 mb-8 flex-1">
              <div>
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Limits</div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]/80">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {plan.includedMinutes} Minutes included
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]/80 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {plan.includedSms} SMS included
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Features</div>
                <ul className="space-y-2">
                  {plan.features.map((feature: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-primary)]/70">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5"/></svg>
                      {feature.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
               <button onClick={() => openModal(plan)} disabled={isPending} className="py-2 text-xs font-medium bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-solid)] rounded-lg transition-colors border border-[var(--border-subtle)]">
                 Edit Plan
               </button>
               <button onClick={() => handleSyncToStripe(plan.id)} disabled={isPending || !!plan.stripePriceId} className={`py-2 text-xs font-medium rounded-lg transition-colors border border-[var(--border-subtle)] flex items-center justify-center gap-1 ${plan.stripePriceId ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 opacity-50 cursor-not-allowed' : 'bg-[var(--bg-surface-hover)] hover:bg-indigo-600'}`}>
                 {plan.stripePriceId ? 'Stripe ✓' : 'Stripe Sync'}
               </button>
               <button onClick={() => handleSyncToFlutterwave(plan.id)} disabled={isPending || !!plan.flutterwavePlanId} className={`py-2 text-xs font-medium rounded-lg transition-colors border border-[var(--border-subtle)] flex items-center justify-center gap-1 ${plan.flutterwavePlanId ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 opacity-50 cursor-not-allowed' : 'bg-[var(--bg-surface-hover)] hover:bg-orange-600'}`}>
                 {plan.flutterwavePlanId ? 'Flutter ✓' : 'Flutter Sync'}
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Plan Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Price ($/mo)</label>
                  <input required type="number" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Minutes</label>
                  <input required type="number" value={formData.includedMinutes} onChange={e => setFormData({...formData, includedMinutes: Number(e.target.value)})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">SMS</label>
                  <input required type="number" value={formData.includedSms} onChange={e => setFormData({...formData, includedSms: Number(e.target.value)})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Features (One per line)</label>
                <textarea rows={4} value={formData.features.join('\n')} onChange={e => setFormData({...formData, features: e.target.value.split('\n')})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-solid)]">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-2">
                  {isPending && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
