"use client";

import { useState, useCallback, useRef } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  ReactFlowProvider,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, ArrowLeft, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Import Custom Nodes and Sidebar
import TriggerNode from "./nodes/TriggerNode";
import MessageNode from "./nodes/MessageNode";
import DelayNode from "./nodes/DelayNode";
import ConditionNode from "./nodes/ConditionNode";
import Sidebar from "./Sidebar";

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  delay: DelayNode,
  condition: ConditionNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

function FlowBuilder({ flows, selectedFlow, setSelectedFlow, setFlows }: any) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Helper to parse JSON if needed
  const parseJson = (data: any, fallback: any) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch (e) { return fallback; }
    }
    return Array.isArray(data) && data.length > 0 ? data : fallback;
  };

  const initialNodes = parseJson(selectedFlow?.nodes, [{ id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Déclencheur : Nouveau Contact' } }]);
  const initialEdges = parseJson(selectedFlow?.edges, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;
    const res = await fetch(`/api/whatsapp/flows/${selectedFlow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges })
    });
    if (res.ok) {
      alert("Séquence sauvegardée avec succès !");
    } else {
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-surface-solid)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-base)] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedFlow(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">{selectedFlow.name}</h2>
            <p className="text-xs text-[var(--text-secondary)]">Éditeur Visuel Drag & Drop</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
             Paramètres Globaux
           </button>
           <button onClick={handleSaveFlow} className="btn-primary-gradient px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
             <Save className="w-4 h-4" />
             Sauvegarder
           </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Barre d'outils */}
        <Sidebar />

        {/* Espace de travail ReactFlow */}
        <div className="flex-1 relative w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={16} size={1} color="var(--border-subtle)" />
          </ReactFlow>
        </div>

        {/* Panneau de configuration du noeud sélectionné (Phase 3) */}
        {selectedNode && (
          <aside className="w-80 bg-[var(--bg-base)] border-l border-[var(--border-subtle)] flex flex-col h-full shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.05)]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><Settings2 className="w-4 h-4 text-emerald-500"/> Configuration</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {selectedNode.type === 'trigger' && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Définissez l'événement qui démarre la séquence.</p>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Événement</label>
                    <select 
                      value={(selectedNode.data.event as string) || 'new_contact'}
                      onChange={(e) => {
                        const event = e.target.value;
                        const label = e.target.options[e.target.selectedIndex].text;
                        updateNodeData(selectedNode.id, { event, label });
                      }}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-emerald-500"
                    >
                      <option value="new_contact">Nouveau Contact</option>
                      <option value="tag_added">Tag ajouté</option>
                      <option value="campaign_replied">A répondu à une campagne</option>
                      <option value="opportunity_won">Opportunité Gagnée</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'message' && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Configurez le message à envoyer.</p>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Type de Message</label>
                    <select 
                      value={(selectedNode.data.messageType as string) || 'free_text'}
                      onChange={(e) => updateNodeData(selectedNode.id, { messageType: e.target.value })}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-blue-500"
                    >
                      <option value="free_text">Texte libre</option>
                      <option value="template">Modèle WhatsApp (Approuvé)</option>
                    </select>
                  </div>
                  {selectedNode.data.messageType === 'template' ? (
                     <div>
                       <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Nom du Modèle</label>
                       <input 
                         type="text" 
                         value={(selectedNode.data.templateName as string) || ''}
                         onChange={(e) => updateNodeData(selectedNode.id, { templateName: e.target.value })}
                         placeholder="ex: welcome_message"
                         className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-blue-500"
                       />
                     </div>
                  ) : (
                     <div>
                       <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Contenu du message</label>
                       <textarea 
                         rows={4}
                         value={(selectedNode.data.text as string) || ''}
                         onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                         placeholder="Bonjour, merci de nous avoir contacté..."
                         className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-blue-500 resize-none"
                       />
                     </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'delay' && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Temps d'attente avant la prochaine action.</p>
                  <div className="flex gap-3">
                    <div className="w-1/3">
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Durée</label>
                      <input 
                        type="number" min="1"
                        value={(selectedNode.data.duration as string) || '1'}
                        onChange={(e) => updateNodeData(selectedNode.id, { duration: e.target.value })}
                        className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Unité</label>
                      <select 
                        value={(selectedNode.data.unit as string) || 'minutes'}
                        onChange={(e) => updateNodeData(selectedNode.id, { unit: e.target.value })}
                        className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-amber-500"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Heures</option>
                        <option value="days">Jours</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Sépare la séquence selon le comportement du contact.</p>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Condition Logique</label>
                    <select 
                      value={(selectedNode.data.conditionType as string) || 'has_replied'}
                      onChange={(e) => updateNodeData(selectedNode.id, { conditionType: e.target.value })}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-purple-500"
                    >
                      <option value="has_replied">A répondu au message précédent</option>
                      <option value="contains_yes">La réponse contient "Oui"</option>
                      <option value="contains_no">La réponse contient "Non"</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function FlowBuilderClient({ initialFlows }: { initialFlows: any[] }) {
  const [flows, setFlows] = useState(initialFlows);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);
  const router = useRouter();

  const handleCreateFlow = async () => {
    const name = prompt("Nom de la nouvelle séquence ?");
    if (!name) return;

    const res = await fetch("/api/whatsapp/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const newFlow = await res.json();
      setFlows([newFlow, ...flows]);
      setSelectedFlow(newFlow);
    }
  };

  if (!selectedFlow) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Séquences WhatsApp</h2>
            <p className="text-[var(--text-secondary)] mt-1">Créez des scénarios d'automatisation visuels (Flows).</p>
          </div>
          <button onClick={handleCreateFlow} className="btn-primary-gradient px-6 py-3 flex items-center gap-2">
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
             <div className="col-span-full p-12 text-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]">
               Aucune séquence pour le moment. Cliquez sur "Nouvelle Séquence" pour commencer.
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowBuilder 
        flows={flows} 
        setFlows={setFlows}
        selectedFlow={selectedFlow} 
        setSelectedFlow={setSelectedFlow} 
      />
    </ReactFlowProvider>
  );
}
