"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { formatDateFR } from "@/lib/utils";
import { assignPlanToUser } from "./actions";

type UserRow = any;
type Plan = any;

export function UsersClient({ initialUsers, plans }: { initialUsers: UserRow[]; plans: Plan[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [formPlanId, setFormPlanId] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");

  const openAssign = (user: UserRow) => {
    if (!user.organization) {
      toast.error("Cet utilisateur n'a pas d'organisation : impossible d'attribuer un forfait.");
      return;
    }
    setSelectedUser(user);
    setFormPlanId(user.organization.pricingPlanId || "");
    setFormStatus(user.organization.planStatus || "ACTIVE");
  };

  const handleSave = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      const res = await assignPlanToUser(selectedUser.id, formPlanId || null, formStatus);
      if (!res.ok) {
        toast.error(res.error || "Erreur lors de l'attribution du forfait.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                organization: {
                  ...u.organization,
                  pricingPlanId: formPlanId || null,
                  planStatus: formStatus,
                  pricingPlan: formPlanId ? plans.find((p) => p.id === formPlanId) ?? null : null,
                },
              }
            : u
        )
      );
      const planName = formPlanId ? plans.find((p) => p.id === formPlanId)?.name : "Aucun forfait";
      toast.success(`Forfait « ${planName} » attribué à ${selectedUser.email}.`);
      setSelectedUser(null);
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Global Users</h1>
          <p className="text-[var(--text-secondary)]">Manage all user accounts across the entire platform.</p>
        </div>
        <button className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors">
          + Invite User
        </button>
      </div>

      <Card className="border-none overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">User</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Organization</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Plan</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Role</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Joined</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[var(--text-primary)] font-bold text-xs uppercase shadow-lg">
                        {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                     </div>
                     <div>
                        <div className="font-bold text-[var(--text-primary)] text-sm">{user.name || "No Name Provided"}</div>
                        <div className="text-[var(--text-secondary)] text-xs mt-0.5">{user.email}</div>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.organization ? (
                     <div>
                        <div className="text-[var(--text-primary)] font-medium">{user.organization.name}</div>
                        <div className="text-[var(--text-primary)]/30 text-xs">@{user.organization.slug}</div>
                     </div>
                  ) : (
                     <span className="text-[var(--text-primary)]/30 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.organization ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded text-xs font-medium text-[var(--text-primary)]">
                        {user.organization.pricingPlan?.name || "Aucun forfait"}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.organization.planStatus === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                        user.organization.planStatus === "PAST_DUE" ? "bg-red-500/10 text-red-400" :
                        "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
                      }`}>
                        {user.organization.planStatus}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--text-primary)]/30 italic">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                     {user.isSuperAdmin && (
                        <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-bold uppercase tracking-wider">
                          God
                        </span>
                     )}
                     <span className={`px-2 py-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded text-xs font-medium ${
                        user.role === 'OWNER' ? 'text-amber-400' :
                        user.role === 'ADMIN' ? 'text-blue-400' :
                        'text-[var(--text-primary)]/70'
                     }`}>
                        {user.role}
                     </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">
                  {formatDateFR(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openAssign(user)}
                    title={user.organization ? "Attribuer un forfait" : "Aucune organisation associée"}
                    className="text-cyan-400/80 hover:text-cyan-400 transition-colors text-sm font-medium mr-4 inline-flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Forfait
                  </button>
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium mr-4">
                    Reset Pwd
                  </button>
                  <button className="text-red-400/50 hover:text-red-400 transition-colors text-sm font-medium">
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-20 text-[var(--text-primary)]/30 border-t border-[var(--border-subtle)]">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             <p>No users found in the database.</p>
          </div>
        )}
      </Card>

      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Attribuer un forfait"
        description={selectedUser ? selectedUser.email : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 text-white text-sm font-bold flex items-center gap-2 transition-opacity"
            >
              {isPending && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              Enregistrer
            </button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Le forfait est rattaché à l'organisation{" "}
              <span className="font-bold text-[var(--text-primary)]">{selectedUser.organization?.name}</span>{" "}
              (partagé par tous ses membres).
            </p>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Forfait</label>
              <select
                value={formPlanId}
                onChange={(e) => setFormPlanId(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="">Aucun (Gratuit)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.monthlyPrice}/mo — {p.includedMinutes} min inclus)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Statut du forfait</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="ACTIVE">Active</option>
                <option value="TRIALING">Trialing</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="UNPAID">Unpaid</option>
                <option value="CANCELED">Canceled</option>
              </select>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                Seuls les statuts Active et Trialing donnent accès au dashboard.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
