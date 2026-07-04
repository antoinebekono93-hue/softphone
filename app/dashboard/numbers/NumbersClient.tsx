"use client";

import { useState } from "react";
import { Phone, Bot, User, Plus, Search, Loader2, Edit2, X, ShoppingCart } from "lucide-react";
import { updateNumber, searchNumbers, buyNumber } from "./actions";

import Link from "next/link";

export function NumbersClient({ initialNumbers, users }: { initialNumbers: any[], users: any[] }) {
  const [numbers, setNumbers] = useState(initialNumbers);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editUserId, setEditUserId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = (num: any) => {
    setSelectedNumber(num);
    setEditName(num.friendlyName || "");
    setEditUserId(num.assignedUserId || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedNumber) return;
    setIsSaving(true);
    const res = await updateNumber(selectedNumber.id, editName, editUserId === "" ? null : editUserId);
    if (res.success) {
      setNumbers(numbers.map(n => n.id === selectedNumber.id ? { ...n, friendlyName: editName, assignedUserId: editUserId === "" ? null : editUserId } : n));
      setIsEditModalOpen(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Phone Numbers
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Manage your organization's phone numbers and assignments.</p>
        </div>
        <Link 
          href="/dashboard/numbers/buy"
          className="apple-btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buy New Number
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {numbers.map((num) => {
           const hasAgent = !!num.voiceAIAgent;
           const assignedUser = users.find(u => u.id === num.assignedUserId);

           return (
             <div key={num.id} className="glass-panel p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                      <Phone className="w-6 h-6" />
                   </div>
                   <button onClick={() => openEditModal(num)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
                      <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                   </button>
                </div>

                <div className="mb-4">
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">{num.number}</h3>
                   <p className="text-sm text-[var(--text-secondary)]">{num.friendlyName || "Unnamed Number"}</p>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)]">
                   <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">Assigned To</div>
                   {hasAgent ? (
                      <div className="flex items-center gap-2 text-cyan-500 bg-cyan-500/10 w-fit px-3 py-1.5 rounded-lg">
                         <Bot className="w-4 h-4" />
                         <span className="text-sm font-semibold">AI Agent ({num.voiceAIAgent.name})</span>
                      </div>
                   ) : assignedUser ? (
                      <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg">
                         <User className="w-4 h-4" />
                         <span className="text-sm font-semibold">{assignedUser.name}</span>
                      </div>
                   ) : (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] w-fit px-3 py-1.5 rounded-lg">
                         <User className="w-4 h-4" />
                         <span className="text-sm font-semibold">Shared (Entire Team)</span>
                      </div>
                   )}
                </div>
             </div>
           );
        })}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="text-xl font-bold">Configure Number</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Friendly Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="apple-input"
                  placeholder="e.g. Sales Line"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Assigned User</label>
                {selectedNumber?.voiceAIAgent ? (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-500 text-sm">
                     This number is currently managed by an AI Agent. You can change its assignment in the AI Studio.
                  </div>
                ) : (
                  <select 
                    value={editUserId}
                    onChange={(e) => setEditUserId(e.target.value)}
                    className="apple-input"
                  >
                    <option value="">Shared (Entire Team)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="apple-btn bg-transparent border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving || !!selectedNumber?.voiceAIAgent} className="apple-btn btn-primary">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
