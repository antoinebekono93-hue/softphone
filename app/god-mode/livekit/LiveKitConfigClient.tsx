"use client";

import { useState } from "react";
import { Bot, Server, Shield, Key, Save, CheckCircle, Cpu } from "lucide-react";

export function LiveKitConfigClient() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <Bot className="text-violet-500 w-8 h-8" />
             LiveKit AI Infrastructure
          </h1>
          <p className="text-[var(--text-secondary)]">Manage your LiveKit server connection for Voice AI Agents (SIP Inbound).</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="apple-btn btn-primary flex items-center gap-2"
        >
          {isSaving ? <Cpu className="w-4 h-4 animate-spin" /> : (saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
          {saved ? "Saved Configuration" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-500" /> Server Connection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">LiveKit URL (WebSocket)</label>
                <input 
                  type="text" 
                  defaultValue="wss://my-project.livekit.cloud"
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">API Key</label>
                  <input 
                    type="password" 
                    defaultValue="API123456789"
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">API Secret</label>
                  <input 
                    type="password" 
                    defaultValue="SECRET123456789"
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-violet-500">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-500" /> SIP Inbound Trunk
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              This is the SIP URI where Telnyx will transfer incoming calls when an AI Agent is assigned to a number.
            </p>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">LiveKit SIP URI</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  defaultValue="sip:agent@my-project.sip.livekit.cloud"
                  className="flex-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                />
                <button className="px-4 py-2 bg-[var(--bg-surface-hover)] hover:bg-white/10 text-[var(--text-primary)] font-bold rounded-lg transition-colors border border-[var(--border-subtle)] text-sm">Copy</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent">
            <h3 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" /> Architecture Status
            </h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Telnyx Webhook Ready
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> SIP Headers Configured
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /> Waiting for LiveKit Worker
              </li>
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5 text-xs">
              <span className="text-violet-400 font-bold block mb-1">SIP Headers Sent:</span>
              <code className="text-gray-400">
                X-Agent-Name<br/>
                X-Agent-Voice<br/>
                X-Organization-Id<br/>
                X-Call-Log-Id
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
