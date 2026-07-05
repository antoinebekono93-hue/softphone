"use client";

import { useState, useCallback } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Workflow, Plus, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Define some custom node types (we will implement them later)
const nodeTypes = {
  // trigger: TriggerNode,
  // message: MessageNode,
};

const initialNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Déclencheur : Nouveau Contact' }, type: 'input' },
];
const initialEdges: Edge[] = [];

export default function FlowBuilderClient({ initialFlows }: { initialFlows: any[] }) {
  const [flows, setFlows] = useState(initialFlows);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const router = useRouter();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleCreateFlow = async () => {
    // API call to create flow
    const res = await fetch("/api/whatsapp/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nouvelle Séquence" })
    });
    if (res.ok) {
      const newFlow = await res.json();
      setFlows([newFlow, ...flows]);
      setSelectedFlow(newFlow);
    }
  };

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;
    const res = await fetch(`/api/whatsapp/flows/${selectedFlow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges })
    });
    if (res.ok) {
      alert("Séquence sauvegardée !");
    }
  };

  if (!selectedFlow) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Vos Séquences</h2>
          <button onClick={handleCreateFlow} className="btn-primary-gradient px-4 py-2 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle Séquence
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows.map(flow => (
            <div key={flow.id} onClick={() => setSelectedFlow(flow)} className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-emerald-500 transition-colors border border-[var(--border-subtle)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{flow.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-md ${flow.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {flow.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Dernière modification : {new Date(flow.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
          {flows.length === 0 && (
             <div className="col-span-full p-12 text-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">
               Aucune séquence. Cliquez sur Nouvelle Séquence pour commencer.
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-surface-solid)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-base)] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedFlow(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-lg text-[var(--text-primary)]">{selectedFlow.name}</h2>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
             Paramètres
           </button>
           <button onClick={handleSaveFlow} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
             <Save className="w-4 h-4" />
             Sauvegarder
           </button>
        </div>
      </div>
      
      <div className="flex-1 relative w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
