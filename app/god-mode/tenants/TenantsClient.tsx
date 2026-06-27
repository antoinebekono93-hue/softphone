"use client";

import { useState, useTransition } from "react";
import { updateTenant, impersonateTenant } from "./actions";

type Tenant = any;
type Plan = any;

export function TenantsClient({ initialTenants, plans }: { initialTenants: Tenant[], plans: Plan[] }) {
  const [tenants] = useState(initialTenants);
  const [isPending, startTransition] = useTransition();
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState({
    pricingPlanId: "",
    planStatus: "ACTIVE",
    walletBalance: 0,
  });

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      pricingPlanId: tenant.pricingPlanId || "",
      planStatus: tenant.planStatus || "ACTIVE",
      walletBalance: tenant.walletBalance || 0,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    startTransition(async () => {
      try {
        await updateTenant(editingTenant.id, {
          pricingPlanId: formData.pricingPlanId || null,
          planStatus: formData.planStatus,
          walletBalance: Number(formData.walletBalance),
        });
        setEditingTenant(null);
      } catch (err) {
        console.error(err);
        alert("Error updating tenant");
      }
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tenants (Organizations)</h1>
          <p className="text-[var(--text-secondary)]">Manage organizations, their limits, and subscriptions.</p>
        </div>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-[var(--text-primary)] rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          + New Tenant
        </button>
      </div>

      <div className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl relative">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Organization</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Plan & Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Usage (Min)</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Resources</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tenants.map((tenant: any) => (
              <tr key={tenant.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[var(--text-primary)] text-base">{tenant.name}</div>
                  <div className="text-[var(--text-secondary)] text-xs mt-1">Slug: {tenant.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-[var(--bg-surface-hover)] rounded text-xs font-medium text-[var(--text-primary)]">
                      {tenant.pricingPlan?.name || "No Plan"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tenant.planStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                      tenant.planStatus === 'PAST_DUE' ? 'bg-red-500/10 text-red-400' :
                      'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                    }`}>
                      {tenant.planStatus}
                    </span>
                  </div>
                  <div className="text-[var(--text-secondary)] text-xs">
                    Wallet: ${tenant.walletBalance.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Voice</span>
                        <span className="text-[var(--text-primary)] font-mono">{tenant.minutesUsedThisMonth} min</span>
                     </div>
                     <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-1.5 mt-1">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((tenant.minutesUsedThisMonth / (tenant.pricingPlan?.includedMinutes || 1000)) * 100, 100)}%` }}></div>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1" title="Users">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                       <span className="font-mono">{tenant._count.users}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Phone Numbers">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                       <span className="font-mono">{tenant._count.phoneNumbers}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3">
                  <button onClick={() => startTransition(() => impersonateTenant(tenant.id))} disabled={isPending} className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors text-sm font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Impersonate
                  </button>
                  <button onClick={() => openEdit(tenant)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edit Panel Overlay */}
        {editingTenant && (
          <div className="absolute inset-y-0 right-0 w-96 bg-[var(--bg-surface-solid)] border-l border-[var(--border-subtle)] shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit {editingTenant.name}</h2>
              <button onClick={() => setEditingTenant(null)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Pricing Plan</label>
                  <select value={formData.pricingPlanId} onChange={e => setFormData({...formData, pricingPlanId: e.target.value})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]">
                    <option value="">None (Free)</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.monthlyPrice})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Plan Status</label>
                  <select value={formData.planStatus} onChange={e => setFormData({...formData, planStatus: e.target.value})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]">
                    <option value="ACTIVE">Active</option>
                    <option value="TRIALING">Trialing</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Wallet Balance (USD)</label>
                  <input type="number" step="0.01" value={formData.walletBalance} onChange={e => setFormData({...formData, walletBalance: Number(e.target.value)})} className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]" />
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button type="submit" disabled={isPending} className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium flex justify-center items-center gap-2">
                  {isPending && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
