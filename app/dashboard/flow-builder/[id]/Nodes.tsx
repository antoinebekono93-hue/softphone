"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { MessageSquare, Clock, Zap, Bot } from "lucide-react";

export const TriggerNode = memo(({ data }: any) => {
  return (
    <div className="bg-emerald-500 text-white rounded-xl shadow-lg border-2 border-emerald-600 w-64">
      <div className="p-3 font-bold flex items-center gap-2 border-b border-emerald-400/50">
        <Zap className="w-4 h-4" /> Déclencheur
      </div>
      <div className="p-4 text-sm font-medium">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white border-2 border-emerald-600" />
    </div>
  );
});
TriggerNode.displayName = "TriggerNode";

export const MessageNode = memo(({ data }: any) => {
  return (
    <div className="bg-[var(--bg-surface-solid)] text-[var(--text-primary)] rounded-xl shadow-lg border-2 border-cyan-500 w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-500 border-2 border-[var(--bg-surface-solid)]" />
      <div className="p-3 font-bold flex items-center gap-2 border-b border-[var(--border-subtle)] text-cyan-500">
        <MessageSquare className="w-4 h-4" /> Envoyer un Message
      </div>
      <div className="p-4 text-sm">
        <div className="bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border-subtle)] text-xs truncate">
          {data.message || "Texte du message..."}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-500 border-2 border-[var(--bg-surface-solid)]" />
    </div>
  );
});
MessageNode.displayName = "MessageNode";

export const DelayNode = memo(({ data }: any) => {
  return (
    <div className="bg-[var(--bg-surface-solid)] text-[var(--text-primary)] rounded-xl shadow-lg border-2 border-amber-500 w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-[var(--bg-surface-solid)]" />
      <div className="p-3 font-bold flex items-center gap-2 border-b border-[var(--border-subtle)] text-amber-500">
        <Clock className="w-4 h-4" /> Délai d'attente
      </div>
      <div className="p-4 text-sm text-center font-mono font-bold">
        {data.minutes || 60} Minutes
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-[var(--bg-surface-solid)]" />
    </div>
  );
});
DelayNode.displayName = "DelayNode";

export const AiAgentNode = memo(({ data }: any) => {
  return (
    <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-xl shadow-xl border-2 border-violet-300 w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-white border-2 border-violet-500" />
      <div className="p-3 font-bold flex items-center gap-2 border-b border-white/20">
        <Bot className="w-4 h-4" /> Transfert à l'IA
      </div>
      <div className="p-4 text-sm">
        <div className="font-bold mb-1 opacity-80 text-xs uppercase">Prompt d'Objectif :</div>
        <div className="bg-black/20 p-2 rounded-lg text-xs">
          {data.prompt || "Ex: Tu dois clore cette vente..."}
        </div>
      </div>
      {/* No source handle, usually AI takes over fully, or maybe we have one? Let's not add a source handle for now to simplify */}
    </div>
  );
});
AiAgentNode.displayName = "AiAgentNode";
