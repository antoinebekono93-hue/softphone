"use client";

import { useState } from "react";
import { MessageSquare, Smartphone, CheckCircle, ShieldAlert, Cpu } from "lucide-react";

export function ChannelsClient({ numbers }: { numbers: any[] }) {
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<string[]>([]);

  const handleRequestChannel = (numberId: string, channel: string) => {
    setRequesting(`${numberId}-${channel}`);
    setTimeout(() => {
      setRequesting(null);
      setRequested((prev) => [...prev, `${numberId}-${channel}`]);
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Rich Messaging Channels</h1>
        <p className="text-[var(--text-secondary)]">Upgrade your phone numbers to support WhatsApp Business and Google RCS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* WhatsApp Card */}
        <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-[#25D366]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">WhatsApp Business</h2>
              <p className="text-xs text-[var(--text-secondary)]">Reach 2B+ users globally</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Convert your standard SMS number into an official WhatsApp Business account. Support rich media, templates, and interactive buttons.
          </p>
          <div className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1 rounded-full inline-block">
            Powered by Telnyx Messaging API
          </div>
        </div>

        {/* RCS Card */}
        <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Google RCS</h2>
              <p className="text-xs text-[var(--text-secondary)]">The future of SMS on Android</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Enable Verified Sender status, Read Receipts, High-Res Image sharing, and Suggested Action chips natively in Android Messages.
          </p>
          <div className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full inline-block">
            Early Access (Beta)
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Your Phone Numbers</h3>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Number</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">WhatsApp Status</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">RCS Status</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {numbers.map((num) => (
              <tr key={num.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="p-4 font-mono text-sm font-medium text-[var(--text-primary)]">
                  {num.number}
                  {num.name && <span className="block text-xs font-sans text-[var(--text-secondary)]">{num.name}</span>}
                </td>
                
                {/* WhatsApp Status Column */}
                <td className="p-4">
                  {num.whatsappEnabled ? (
                    <span className="flex items-center gap-1.5 text-sm text-[#25D366] font-medium">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : requested.includes(`${num.id}-WA`) ? (
                    <span className="flex items-center gap-1.5 text-sm text-amber-500 font-medium">
                      <ShieldAlert className="w-4 h-4" /> Pending Approval
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-secondary)]">Not Enabled</span>
                  )}
                </td>

                {/* RCS Status Column */}
                <td className="p-4">
                  {num.rcsEnabled ? (
                    <span className="flex items-center gap-1.5 text-sm text-blue-500 font-medium">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : requested.includes(`${num.id}-RCS`) ? (
                    <span className="flex items-center gap-1.5 text-sm text-amber-500 font-medium">
                      <ShieldAlert className="w-4 h-4" /> Pending Verification
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-secondary)]">Not Enabled</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!num.whatsappEnabled && !requested.includes(`${num.id}-WA`) && (
                      <button 
                        onClick={() => handleRequestChannel(num.id, 'WA')}
                        disabled={!!requesting}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors flex items-center gap-2"
                      >
                        {requesting === `${num.id}-WA` ? <Cpu className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                        Enable WA
                      </button>
                    )}
                    {!num.rcsEnabled && !requested.includes(`${num.id}-RCS`) && (
                      <button 
                        onClick={() => handleRequestChannel(num.id, 'RCS')}
                        disabled={!!requesting}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                      >
                        {requesting === `${num.id}-RCS` ? <Cpu className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />}
                        Enable RCS
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {numbers.length === 0 && (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No phone numbers found. Purchase a number first to enable Rich Messaging.
          </div>
        )}
      </div>
    </div>
  );
}
