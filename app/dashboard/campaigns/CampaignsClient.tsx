"use client";

import { useState } from "react";
import { Megaphone, Plus, Users, Send, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { createCampaign } from "./actions";

export function CampaignsClient({ campaigns, numbers, contacts }: { campaigns: any[], numbers: any[], contacts: any[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", body: "", phoneNumberId: "", contactIds: [] as string[] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.body || !formData.phoneNumberId || formData.contactIds.length === 0) return;
    
    setLoading(true);
    await createCampaign(formData);
    setLoading(false);
    setIsCreating(false);
    setFormData({ name: "", body: "", phoneNumberId: "", contactIds: [] });
  };

  const toggleContact = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contactIds: prev.contactIds.includes(id) 
        ? prev.contactIds.filter(c => c !== id)
        : [...prev.contactIds, id]
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Campaigns</h1>
          <p className="text-[var(--text-secondary)]">Broadcast messages to your audience using SMS or WhatsApp.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="apple-btn btn-primary flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> New Campaign</>}
        </button>
      </div>

      {isCreating && (
        <div className="glass-panel p-6 rounded-2xl mb-8 animate-in slide-in-from-top-4 fade-in">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Create New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Campaign Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g. Summer Promo 2024"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Send From (Caller ID)</label>
                <select 
                  value={formData.phoneNumberId}
                  onChange={e => setFormData({...formData, phoneNumberId: e.target.value})}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                  required
                >
                  <option value="">Select a number</option>
                  {numbers.map(n => (
                    <option key={n.id} value={n.id}>{n.number} {n.name ? `(${n.name})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Message Content</label>
              <textarea 
                value={formData.body}
                onChange={e => setFormData({...formData, body: e.target.value})}
                className="w-full h-32 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50 resize-none"
                placeholder="Write your message here... Use {{firstName}} to personalize."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                Select Audience ({formData.contactIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-surface-hover)] divide-y divide-[var(--border-subtle)]">
                {contacts.map(contact => (
                  <label key={contact.id} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-surface)] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.contactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="rounded border-[var(--border-subtle)] text-violet-500 focus:ring-violet-500 bg-transparent"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{contact.name || 'Unnamed Contact'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{contact.phone}</p>
                    </div>
                  </label>
                ))}
                {contacts.length === 0 && <div className="p-4 text-sm text-[var(--text-secondary)] text-center">No contacts found in CRM.</div>}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={loading || formData.contactIds.length === 0}
                className="apple-btn btn-primary flex items-center gap-2"
              >
                {loading ? "Launching..." : <><Send className="w-4 h-4" /> Launch Campaign</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(camp => (
          <Link href={`/dashboard/campaigns/${camp.id}`} key={camp.id} className="glass-panel p-6 rounded-2xl hover:border-violet-500/30 transition-colors group block">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              {camp.status === 'SENDING' && <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Sending</span>}
              {camp.status === 'COMPLETED' && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Completed</span>}
              {camp.status === 'DRAFT' && <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full">Draft</span>}
            </div>
            
            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">{camp.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 truncate">{camp.body}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Audience</p>
                <p className="font-mono text-lg text-[var(--text-primary)]">{camp._count?.recipients || 0}</p>
              </div>
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1"><Send className="w-3 h-3" /> Sent</p>
                <p className="font-mono text-lg text-[var(--text-primary)]">{camp.sentCount}</p>
              </div>
            </div>
          </Link>
        ))}
        
        {campaigns.length === 0 && !isCreating && (
          <div className="col-span-full text-center p-12 glass-panel rounded-2xl">
            <Megaphone className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Campaigns Yet</h3>
            <p className="text-[var(--text-secondary)] mb-6">Create your first broadcast to engage your CRM contacts.</p>
            <button onClick={() => setIsCreating(true)} className="apple-btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
