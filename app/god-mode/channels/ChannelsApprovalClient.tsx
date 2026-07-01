"use client";

import { useState } from "react";
import { MessageSquare, Smartphone, CheckCircle, XCircle, Settings } from "lucide-react";

export function ChannelsApprovalClient() {
  const [requests, setRequests] = useState([
    { id: '1', type: 'WHATSAPP', number: '+33612345678', org: 'Acme Corp', status: 'PENDING' },
    { id: '2', type: 'RCS', number: '+33798765432', org: 'Tech Solutions', status: 'PENDING' }
  ]);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    setRequests(prev => prev.filter(r => r.id !== id));
    // Here we would call a server action to update the DB and Telnyx API
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Rich Messaging Approvals</h1>
        <p className="text-[var(--text-secondary)]">Review and provision WhatsApp and RCS requests from your tenants.</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Channel</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Tenant</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Number</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">
                  No pending requests.
                </td>
              </tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="p-4">
                  {req.type === 'WHATSAPP' ? (
                    <span className="flex items-center gap-2 text-sm font-bold text-[#25D366]">
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-bold text-blue-500">
                      <Smartphone className="w-4 h-4" /> Google RCS
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm font-medium text-[var(--text-primary)]">
                  {req.org}
                </td>
                <td className="p-4 font-mono text-sm text-[var(--text-primary)]">
                  {req.number}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleAction(req.id, 'REJECT')}
                      className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Reject Request"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'APPROVE')}
                      className="px-4 py-2 text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Provision
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">How Provisioning Works (Telnyx Hosted)</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          When you click <strong>Provision</strong>, your platform will call the Telnyx API to link the tenant's number to your WhatsApp Business Account (WABA) or Telnyx RCS Agent. Once verified by Meta/Google, the client can use the Unified Messaging API to send rich media.
        </p>
      </div>
    </div>
  );
}
