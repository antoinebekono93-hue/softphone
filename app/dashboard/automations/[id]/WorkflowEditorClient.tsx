"use client";

import { useState, useCallback, useRef } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TriggerNode, HttpActionNode, SmsActionNode, DelayNode, IfElseNode, AIGenerationNode, EmailNode } from "./Nodes";
import { Save, Play, MessageSquare, Clock, ArrowLeft, Globe, Zap, Webhook, ArrowRightLeft, Sparkles, Mail, History, CheckCircle2, XCircle, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const nodeTypes = {
  triggerNode: TriggerNode,
  httpActionNode: HttpActionNode,
  smsActionNode: SmsActionNode,
  delayNode: DelayNode,
  ifElseNode: IfElseNode,
  aiGenerationNode: AIGenerationNode,
  emailNode: EmailNode
};

export function WorkflowEditorClient({ flowId, initialName, initialIsActive, initialNodes, initialEdges }: any) {
  const router = useRouter();
  const [nodes, setNodes] = useState<any[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [name, setName] = useState(initialName);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [showLogs, setShowLogs] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  const fetchRuns = async () => {
    setIsLoadingRuns(true);
    try {
      const res = await fetch(`/api/workflows/${flowId}/runs`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0ea5e9', strokeWidth: 2 } }, eds)),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Sauvegarde en cours...");
    try {
      await fetch(`/api/automations/${flowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isActive,
          nodes,
          edges
        })
      });
      toast.success("Workflow sauvegardé !", { id: toastId });
      router.refresh();
    } catch (e) {
      toast.error("Erreur de sauvegarde", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label,
          message: type === 'smsActionNode' ? "Votre message ici..." : undefined,
          minutes: type === 'delayNode' ? 5 : undefined,
          url: type === 'httpActionNode' ? "https://" : undefined,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border-subtle)] flex items-center justify-between px-6 bg-[var(--bg-surface-solid)] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/automations')} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="bg-transparent text-xl font-bold text-[var(--text-primary)] border-none focus:ring-0 p-0 outline-none w-64"
          />
          <div className="flex items-center gap-2 ml-4 bg-[var(--bg-surface-hover)] px-3 py-1.5 rounded-full">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-[var(--text-secondary)]">{isActive ? 'Workflow Actif' : 'Workflow Inactif'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!showLogs) fetchRuns();
              setShowLogs(!showLogs);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${showLogs ? 'bg-indigo-500/10 text-indigo-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}
          >
            <History className="w-4 h-4" /> Logs d'Exécution
          </button>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${isActive ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
          >
            <Play className="w-4 h-4" /> {isActive ? 'Désactiver' : 'Activer'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary-gradient px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] p-4 flex flex-col gap-4 z-10 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Événements (Triggers)</div>
          
          <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 cursor-grab active:cursor-grabbing hover:bg-emerald-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'triggerNode', 'Déclencheur')}
          >
            <div className="flex items-center gap-3 text-emerald-500 font-bold mb-1">
              <Webhook className="w-5 h-5" /> Déclencheur
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Point d'entrée du workflow</div>
          </div>

          <div className="text-xs font-bold text-[var(--text-secondary)] mt-4 mb-1 uppercase tracking-wider">Actions Intégrées</div>

          <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 cursor-grab active:cursor-grabbing hover:bg-cyan-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'httpActionNode', 'Requête HTTP')}
          >
            <div className="flex items-center gap-3 text-cyan-500 font-bold mb-1">
              <Globe className="w-5 h-5" /> Requête HTTP / Webhook Sortant
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Envoyer des données vers Zapier, n8n ou toute API.</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 cursor-grab active:cursor-grabbing hover:bg-indigo-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'smsActionNode', 'Envoyer SMS')}
          >
            <div className="flex items-center gap-3 text-indigo-500 font-bold mb-1">
              <MessageSquare className="w-5 h-5" /> Envoyer SMS
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Envoi interne d'un SMS au contact.</div>
          </div>

          <div className="text-xs font-bold text-[var(--text-secondary)] mt-4 mb-1 uppercase tracking-wider">Logique</div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/30 cursor-grab active:cursor-grabbing hover:bg-amber-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'delayNode', 'Délai')}
          >
            <div className="flex items-center gap-3 text-amber-500 font-bold mb-1">
              <Clock className="w-5 h-5" /> Attendre
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Mettre en pause l'exécution.</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-purple-500/30 cursor-grab active:cursor-grabbing hover:bg-purple-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'ifElseNode', 'Condition')}
          >
            <div className="flex items-center gap-3 text-purple-500 font-bold mb-1">
              <ArrowRightLeft className="w-5 h-5" /> Condition (If/Else)
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Embranchement basé sur des variables.</div>
          </div>

          <div className="text-xs font-bold text-[var(--text-secondary)] mt-4 mb-1 uppercase tracking-wider">Avancé</div>

          <div className="glass-panel p-4 rounded-xl border border-pink-500/30 cursor-grab active:cursor-grabbing hover:bg-pink-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'aiGenerationNode', 'Génération IA')}
          >
            <div className="flex items-center gap-3 text-pink-500 font-bold mb-1">
              <Sparkles className="w-5 h-5" /> Génération IA
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Faire traiter une donnée par OpenAI.</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-blue-500/30 cursor-grab active:cursor-grabbing hover:bg-blue-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'emailNode', 'Envoyer Email')}
          >
            <div className="flex items-center gap-3 text-blue-500 font-bold mb-1">
              <Mail className="w-5 h-5" /> Envoyer Email
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Envoi d'un email transactionnel.</div>
          </div>

        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              className="bg-[var(--bg-base)]"
            >
              <Background color="var(--border-subtle)" gap={16} />
              <Controls className="bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] fill-[var(--text-primary)]" />
              <Panel position="bottom-center" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] px-4 py-2 rounded-full text-xs text-[var(--text-secondary)] font-medium shadow-xl">
                Glissez-déposez des nœuds depuis le menu. Appuyez sur Retour Arrière pour supprimer.
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Logs Panel */}
        {showLogs && (
          <div className="w-96 border-l border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex flex-col z-20 shrink-0 shadow-2xl">
            <div className="h-16 border-b border-[var(--border-subtle)] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <History className="w-5 h-5 text-indigo-500" />
                Historique des Exécutions
              </div>
              <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-lg">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
              {isLoadingRuns ? (
                <div className="text-center text-sm text-[var(--text-secondary)] py-8">Chargement...</div>
              ) : runs.length === 0 ? (
                <div className="text-center text-sm text-[var(--text-secondary)] py-8">Aucune exécution trouvée.</div>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                      className="w-full text-left p-3 flex items-center justify-between bg-[var(--bg-surface-hover)] hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {run.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : run.status === 'FAILED' ? (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">
                            {new Date(run.startedAt).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">ID: {run.id.slice(-6)}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${selectedRun?.id === run.id ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {selectedRun?.id === run.id && (
                      <div className="p-3 bg-[var(--bg-base)] text-xs font-mono space-y-4">
                        <div>
                          <div className="font-bold text-[var(--text-secondary)] mb-1 uppercase text-[10px]">Trigger Data</div>
                          <pre className="bg-[var(--bg-surface-solid)] p-2 rounded border border-[var(--border-subtle)] text-[var(--text-primary)] overflow-x-auto">
                            {JSON.stringify(run.triggerData, null, 2)}
                          </pre>
                        </div>
                        
                        <div>
                          <div className="font-bold text-[var(--text-secondary)] mb-2 uppercase text-[10px]">Étapes (Nodes)</div>
                          {(() => {
                            let logs = [];
                            try { logs = JSON.parse(run.runLogs as string); } catch(e) {}
                            return logs.length === 0 ? (
                              <div className="text-[var(--text-secondary)] italic">Aucune étape enregistrée.</div>
                            ) : (
                              logs.map((log: any, idx: number) => (
                                <div key={idx} className="mb-3 relative pl-4 border-l-2 border-indigo-500/30">
                                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-[var(--text-primary)]">{log.nodeType}</span>
                                    {log.status === 'SUCCESS' ? (
                                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">SUCCÈS</span>
                                    ) : (
                                      <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold">ÉCHEC</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">ID: {log.nodeId}</div>
                                  
                                  {log.output && (
                                    <div className="mt-1">
                                      <div className="text-[9px] text-[var(--text-secondary)] mb-0.5">Sortie:</div>
                                      <pre className="bg-[var(--bg-surface-solid)] p-1.5 rounded border border-[var(--border-subtle)] text-[var(--text-primary)] overflow-x-auto text-[10px]">
                                        {JSON.stringify(log.output, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {log.error && (
                                    <div className="mt-1 text-rose-500 bg-rose-500/10 p-1.5 rounded border border-rose-500/20 text-[10px]">
                                      {log.error}
                                    </div>
                                  )}
                                </div>
                              ))
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
