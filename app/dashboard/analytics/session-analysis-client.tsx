"use client";

import { useState } from "react";
import { Search, Loader2, GitMerge, DollarSign, Bot, Phone, Play } from "lucide-react";

export default function SessionAnalysisClient() {
  const [sessionId, setSessionId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/analytics/session/${sessionId}`);
      const json = await res.json();
      if (res.ok && !json.error) {
        setData(json);
      } else {
        setError(json.error || "Erreur lors de la recherche de la session");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (node: any) => {
    if (!node) return null;
    return (
      <div className="ml-4 mt-2 border-l border-[var(--border-subtle)] pl-4 relative">
        <div className="absolute -left-[1px] top-4 w-4 border-t border-[var(--border-subtle)]"></div>
        <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-solid)]/50 rounded-lg border border-[var(--border-subtle)] mb-2 group hover:border-cyan-500/50 transition-colors">
          <div className="p-2 rounded-md bg-[var(--bg-surface-hover)]">
            {node.product === 'ai-voice-assistant' ? <Bot className="w-4 h-4 text-violet-400" /> :
             node.product === 'inference' ? <GitMerge className="w-4 h-4 text-cyan-400" /> :
             node.product === 'sip-trunking' ? <Phone className="w-4 h-4 text-blue-400" /> :
             <Play className="w-4 h-4 text-[var(--text-secondary)]" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--text-primary)]">{node.event_name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{node.product} • {node.id.substring(0,8)}...</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <DollarSign className="w-3 h-3" /> {node.cost.event_cost}
            </div>
            {parseFloat(node.cost.cumulative_cost) > parseFloat(node.cost.event_cost) && (
              <div className="text-[10px] text-[var(--text-secondary)] font-mono">Cumul: ${node.cost.cumulative_cost}</div>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map((child: any) => (
              <div key={child.id}>{renderTree(child)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[500px]">
      <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <GitMerge className="w-5 h-5 text-violet-400" />
        Analyse de Session IA
      </h3>

      <form onSubmit={searchSession} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Rechercher par ID de session..." 
            className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button 
          type="submit"
          disabled={loading || !sessionId}
          className="px-4 py-2 bg-violet-500 text-white font-medium rounded-lg hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
        </button>
      </form>

      {error && <div className="text-rose-500 text-sm mb-4">{error}</div>}

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl border border-white/5 p-4">
        {!data && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
            <GitMerge className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Entrez un ID de session pour visualiser l'arbre des coûts</p>
            <p className="text-xs opacity-50 mt-1">(Ex: call-session-id)</p>
          </div>
        )}

        {data && (
          <div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Coût Total de la Session</div>
                <div className="text-2xl font-mono text-emerald-400 font-bold">${data.cost.total}</div>
              </div>
              <div className="text-right text-xs text-[var(--text-secondary)] space-y-1">
                <div>ID: {data.session_id}</div>
                <div>{data.meta.event_count} événements</div>
              </div>
            </div>
            
            <div className="-ml-4">
              {renderTree(data.root)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
