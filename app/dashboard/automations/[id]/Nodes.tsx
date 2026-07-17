"use client";

import { Handle, Position } from "@xyflow/react";
import { Webhook, Send, MessageSquare, Clock, Globe } from "lucide-react";

export function TriggerNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-emerald-500 rounded-xl p-4 shadow-lg w-64">
      <div className="flex items-center gap-3 text-emerald-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <Webhook className="w-5 h-5" />
        Déclencheur (Trigger)
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Type d'événement</div>
      <select 
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs mb-2 text-[var(--text-primary)]"
        defaultValue={data.triggerType || "MANUAL"}
      >
        <option value="WEBHOOK">Webhook Entrant (Externe)</option>
        <option value="CALL_MISSED">Appel Manqué (Interne)</option>
        <option value="TICKET_CREATED">Nouveau Ticket (Interne)</option>
        <option value="MANUAL">Exécution Manuelle</option>
      </select>
      <div className="text-xs text-[var(--text-secondary)] italic">
        Lance l'exécution de ce flux.
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
    </div>
  );
}

export function HttpActionNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-cyan-500 rounded-xl p-4 shadow-lg w-72">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-500" />
      <div className="flex items-center gap-3 text-cyan-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <Globe className="w-5 h-5" />
        Requête HTTP (Action)
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Méthode & URL</div>
      <div className="flex gap-2 mb-2">
        <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs font-mono text-[var(--text-primary)]">
          <option>POST</option>
          <option>GET</option>
        </select>
        <input 
          type="text" 
          defaultValue={data.url || "https://hooks.zapier.com/..."}
          className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs text-[var(--text-primary)]"
        />
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Payload JSON</div>
      <textarea 
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs font-mono text-[var(--text-secondary)] h-16"
        defaultValue={data.body || '{\n  "data": "{{trigger.data}}"\n}'}
      />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-500" />
    </div>
  );
}

export function SmsActionNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-indigo-500 rounded-xl p-4 shadow-lg w-64">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-3 text-indigo-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <MessageSquare className="w-5 h-5" />
        Envoyer SMS
      </div>
      <textarea 
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 text-xs text-[var(--text-primary)] h-16 mb-2"
        placeholder="Contenu du SMS..."
        defaultValue={data.message}
      />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
}

export function DelayNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-amber-500 rounded-xl p-4 shadow-lg w-48">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500" />
      <div className="flex items-center gap-3 text-amber-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <Clock className="w-5 h-5" />
        Attendre
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          defaultValue={data.minutes || 5} 
          className="w-16 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-sm text-[var(--text-primary)]"
        />
        <span className="text-sm font-medium text-[var(--text-secondary)]">minutes</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500" />
    </div>
  );
}

export function IfElseNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-purple-500 rounded-xl p-4 shadow-lg w-64">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center gap-3 text-purple-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        Condition (If/Else)
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Variable</div>
      <input 
        type="text" 
        defaultValue={data.conditionVariable || "{{trigger.data.amount}}"}
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs mb-2 text-[var(--text-primary)]"
      />
      <div className="flex gap-2 mb-2">
        <select 
          className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs font-mono text-[var(--text-primary)] w-24"
          defaultValue={data.operator || "=="}
        >
          <option value=">">Supérieur à</option>
          <option value="<">Inférieur à</option>
          <option value="==">Égal à</option>
          <option value="!=">Différent de</option>
          <option value="contains">Contient</option>
        </select>
        <input 
          type="text" 
          defaultValue={data.conditionValue || "100"}
          className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs text-[var(--text-primary)]"
        />
      </div>
      <div className="flex justify-between mt-4 text-xs font-bold">
        <div className="text-emerald-500">Vrai</div>
        <div className="text-rose-500">Faux</div>
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: "80%" }} className="w-3 h-3 bg-emerald-500" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: "90%" }} className="w-3 h-3 bg-rose-500" />
    </div>
  );
}

export function AIGenerationNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-pink-500 rounded-xl p-4 shadow-lg w-72">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500" />
      <div className="flex items-center gap-3 text-pink-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        Génération IA (OpenAI)
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Prompt System</div>
      <textarea 
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs text-[var(--text-primary)] h-12 mb-2"
        defaultValue={data.systemPrompt || "Tu es un assistant qui résume des textes en français."}
      />
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Input Text (Variable)</div>
      <input 
        type="text" 
        defaultValue={data.inputVariable || "{{trigger.data.message}}"}
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs text-[var(--text-primary)]"
      />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-500" />
    </div>
  );
}

export function EmailNode({ data }: any) {
  return (
    <div className="bg-[var(--bg-surface-solid)] border-2 border-blue-500 rounded-xl p-4 shadow-lg w-64">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center gap-3 text-blue-500 font-bold mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        Envoyer Email
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">À (Email)</div>
      <input 
        type="text" 
        defaultValue={data.to || "{{trigger.data.email}}"}
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs mb-2 text-[var(--text-primary)]"
      />
      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Sujet</div>
      <input 
        type="text" 
        defaultValue={data.subject || "Nouveau message !"}
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-xs mb-2 text-[var(--text-primary)]"
      />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}
