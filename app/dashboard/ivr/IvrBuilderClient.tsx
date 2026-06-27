"use client";

import { useState } from "react";
import { Plus, Settings, Play, Phone, Bot, Users, Voicemail, Save, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Basic Types for our IVR Node system
type NodeType = "GREETING" | "MENU" | "TRANSFER_AI" | "TRANSFER_TEAM" | "VOICEMAIL" | "HANGUP";

type IvrNode = {
  id: string;
  type: NodeType;
  title: string;
  config: any;
  nextId: string | null;
  // For MENU nodes
  options?: { digit: string; nextId: string | null }[];
};

const NODE_ICONS = {
  GREETING: <Play className="w-4 h-4" />,
  MENU: <Settings className="w-4 h-4" />,
  TRANSFER_AI: <Bot className="w-4 h-4" />,
  TRANSFER_TEAM: <Users className="w-4 h-4" />,
  VOICEMAIL: <Voicemail className="w-4 h-4" />,
  HANGUP: <Phone className="w-4 h-4" />,
};

const NODE_COLORS = {
  GREETING: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
  MENU: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
  TRANSFER_AI: "from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-cyan-400",
  TRANSFER_TEAM: "from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400",
  VOICEMAIL: "from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400",
  HANGUP: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
};

export default function IvrBuilderClient({ initialNodes }: { initialNodes: IvrNode[] | null }) {
  // Default fallback tree if none exists
  const defaultTree: IvrNode[] = [
    { id: "start", type: "GREETING", title: "Message de bienvenue", config: { text: "Bonjour et bienvenue chez Antigravity." }, nextId: "menu_1" },
    { id: "menu_1", type: "MENU", title: "Menu Principal", config: { text: "Tapez 1 pour parler à notre IA. Tapez 2 pour l'équipe." }, nextId: null, options: [
      { digit: "1", nextId: "ai_1" },
      { digit: "2", nextId: "team_1" }
    ]},
    { id: "ai_1", type: "TRANSFER_AI", title: "Agent IA (God Mode)", config: { prompt: "Tu es un assistant commercial." }, nextId: null },
    { id: "team_1", type: "TRANSFER_TEAM", title: "Transfert Équipe", config: { ringGroup: "sales" }, nextId: null },
  ];

  const [nodes, setNodes] = useState<IvrNode[]>(initialNodes && initialNodes.length > 0 ? initialNodes : defaultTree);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const saveIvr = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/ivr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes }),
      });
      if (res.ok) {
        alert("SVI sauvegardé avec succès !");
        router.refresh();
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to find a node by ID
  const getNode = (id: string) => nodes.find(n => n.id === id);

  // Recursive function to render the tree starting from a root node
  const renderNode = (nodeId: string | null) => {
    if (!nodeId) return null;
    const node = getNode(nodeId);
    if (!node) return null;

    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center relative">
        {/* Node Card */}
        <div 
          onClick={() => setSelectedNodeId(node.id)}
          className={`relative z-10 w-64 p-4 rounded-xl border cursor-pointer transition-all duration-200 glass-panel bg-gradient-to-br ${NODE_COLORS[node.type]} ${isSelected ? 'ring-2 ring-cyan-500 scale-105' : 'hover:scale-105 hover:border-[var(--text-secondary)]'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[var(--bg-base)] rounded-lg">
              {NODE_ICONS[node.type]}
            </div>
            <div className="font-bold text-sm text-[var(--text-primary)] truncate">{node.title}</div>
          </div>
          <div className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {node.config.text || node.config.prompt || node.type}
          </div>
        </div>

        {/* Children connections */}
        {node.type === "MENU" && node.options ? (
          <div className="flex mt-8 relative w-full justify-center gap-16">
            {/* Horizontal line for branches */}
            <div className="absolute top-[-2rem] left-[25%] right-[25%] h-px bg-[var(--border-subtle)]"></div>
            
            {node.options.map((opt, idx) => (
              <div key={idx} className="flex flex-col items-center relative min-w-[200px]">
                {/* Vertical line down to child */}
                <div className="absolute top-[-2rem] w-px h-8 bg-[var(--border-subtle)]"></div>
                {/* Digit Badge */}
                <div className="absolute top-[-1.5rem] w-6 h-6 rounded-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] z-20">
                  {opt.digit}
                </div>
                {opt.nextId ? renderNode(opt.nextId) : (
                  <button className="mt-4 w-12 h-12 rounded-full border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          node.nextId ? (
             <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-[var(--border-subtle)] my-1"></div>
                {renderNode(node.nextId)}
             </div>
          ) : (
            node.type !== "HANGUP" && node.type !== "TRANSFER_TEAM" && node.type !== "TRANSFER_AI" && node.type !== "VOICEMAIL" && (
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-[var(--border-subtle)] my-1"></div>
                <button className="w-12 h-12 rounded-full border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Main Canvas */}
      <div className="flex-1 bg-[url('/grid.svg')] bg-center bg-[length:40px_40px] overflow-auto custom-scrollbar relative">
        {/* Overlay gradient to match dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-base)]/50 to-[var(--bg-base)] pointer-events-none"></div>
        
        <div className="p-8 min-w-max min-h-max flex flex-col items-center justify-start pt-16 pb-32 relative z-10">
           {/* Starting Point Indicator */}
           <div className="mb-4 px-4 py-1.5 rounded-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider shadow-lg">
             Appel Entrant
           </div>
           <div className="w-px h-8 bg-[var(--border-subtle)] mb-1"></div>
           
           {/* Render the Tree starting at 'start' */}
           {renderNode("start")}
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-8 right-8 flex gap-4 z-20">
          <button 
            onClick={saveIvr}
            disabled={isSaving}
            className="btn-primary-gradient px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Enregistrement...' : 'Publier le SVI'}
          </button>
        </div>
      </div>

      {/* Right Sidebar (Node Editor) */}
      {selectedNodeId && (
        <div className="w-80 bg-[var(--bg-surface-solid)] border-l border-[var(--border-subtle)] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30 animate-slideInRight">
          <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-base)]">
             <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
               <Settings className="w-4 h-4 text-cyan-400" /> Configuration
             </h3>
             <button onClick={() => setSelectedNodeId(null)} className="text-[var(--text-secondary)] hover:text-white p-1">
               <X className="w-4 h-4" />
             </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
             {(() => {
                const node = getNode(selectedNodeId);
                if (!node) return null;
                return (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Type d'étape</label>
                      <div className={`px-4 py-3 rounded-xl border bg-gradient-to-br ${NODE_COLORS[node.type]} flex items-center gap-3`}>
                        {NODE_ICONS[node.type]}
                        <span className="font-bold text-sm">{node.type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Titre Interne</label>
                      <input 
                        type="text"
                        value={node.title}
                        onChange={(e) => {
                          const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, title: e.target.value } : n);
                          setNodes(updatedNodes);
                        }}
                        className="w-full px-4 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm focus:border-cyan-500 transition-colors text-[var(--text-primary)] outline-none"
                      />
                    </div>

                    {/* Node Specific Configs */}
                    {(node.type === "GREETING" || node.type === "MENU") && (
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Texte à lire (Text-to-Speech)</label>
                        <textarea 
                          value={node.config.text || ''}
                          onChange={(e) => {
                            const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, config: { ...n.config, text: e.target.value } } : n);
                            setNodes(updatedNodes);
                          }}
                          className="w-full px-4 py-2 min-h-[100px] bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm focus:border-cyan-500 transition-colors text-[var(--text-primary)] outline-none custom-scrollbar"
                        />
                      </div>
                    )}

                    {node.type === "TRANSFER_AI" && (
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Prompt de l'Agent IA</label>
                        <textarea 
                          value={node.config.prompt || ''}
                          onChange={(e) => {
                            const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, config: { ...n.config, prompt: e.target.value } } : n);
                            setNodes(updatedNodes);
                          }}
                          className="w-full px-4 py-2 min-h-[150px] bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm focus:border-cyan-500 transition-colors text-[var(--text-primary)] outline-none custom-scrollbar"
                          placeholder="Ex: Tu es un assistant..."
                        />
                      </div>
                    )}

                  </div>
                )
             })()}
          </div>
          <div className="p-4 border-t border-[var(--border-subtle)]">
             <button className="w-full py-2.5 flex items-center justify-center gap-2 text-rose-500 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors text-sm font-bold">
               <Trash2 className="w-4 h-4" /> Supprimer l'étape
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
