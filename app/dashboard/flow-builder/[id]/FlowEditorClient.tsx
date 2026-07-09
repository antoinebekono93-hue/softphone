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
import { TriggerNode, MessageNode, DelayNode, AiAgentNode } from "./Nodes";
import { Save, Play, MessageSquare, Clock, Bot, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const nodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  delayNode: DelayNode,
  aiAgentNode: AiAgentNode
};

export function FlowEditorClient({ flowId, initialName, initialIsActive, initialNodes, initialEdges }: any) {
  const router = useRouter();
  const [nodes, setNodes] = useState<any[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [name, setName] = useState(initialName);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

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
      await fetch(`/api/flows/${flowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isActive,
          nodes,
          edges
        })
      });
      toast.success("Scénario sauvegardé !", { id: toastId });
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
          message: type === 'messageNode' ? "Nouveau message..." : undefined,
          minutes: type === 'delayNode' ? 60 : undefined,
          prompt: type === 'aiAgentNode' ? "Objectif de l'IA..." : undefined,
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
          <button onClick={() => router.push('/dashboard/flow-builder')} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="bg-transparent text-xl font-bold text-[var(--text-primary)] border-none focus:ring-0 p-0 outline-none w-64"
          />
          <div className="flex items-center gap-2 ml-4">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-[var(--text-secondary)]">{isActive ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${isActive ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
          >
            <Play className="w-4 h-4" /> {isActive ? 'Désactiver' : 'Activer'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary-gradient px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] p-4 flex flex-col gap-4 z-10 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Composants</div>
          
          <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 cursor-grab active:cursor-grabbing hover:bg-cyan-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'messageNode', 'Envoyer un Message')}
          >
            <div className="flex items-center gap-3 text-cyan-500 font-bold mb-1">
              <MessageSquare className="w-5 h-5" /> Message
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Envoyer un texte simple</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/30 cursor-grab active:cursor-grabbing hover:bg-amber-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'delayNode', 'Délai')}
          >
            <div className="flex items-center gap-3 text-amber-500 font-bold mb-1">
              <Clock className="w-5 h-5" /> Délai
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Mettre le flux en pause</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-violet-500/30 cursor-grab active:cursor-grabbing hover:bg-violet-500/5 transition-colors"
            draggable onDragStart={(e) => onDragStart(e, 'aiAgentNode', 'Agent IA')}
          >
            <div className="flex items-center gap-3 text-violet-500 font-bold mb-1">
              <Bot className="w-5 h-5" /> Agent IA
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Passer la main à l'Intelligence Artificielle</div>
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
                Glissez-déposez des composants depuis la barre latérale. Sélectionnez un composant et appuyez sur Retour Arrière pour le supprimer.
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
