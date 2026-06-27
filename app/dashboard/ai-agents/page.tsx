"use client";

import { useState, useEffect } from "react";
import { getAgents, getAvailableNumbers, deleteAgent } from "./actions";
import { AgentBuilder } from "./AgentBuilder";
import { Bot, Plus, Trash2, Edit2, PhoneCall } from "lucide-react";

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [fetchedAgents, fetchedNumbers] = await Promise.all([
      getAgents(),
      getAvailableNumbers()
    ]);
    setAgents(fetchedAgents);
    setNumbers(fetchedNumbers);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setSelectedAgent(null);
    setIsBuilderOpen(true);
  };

  const handleEdit = (agent: any) => {
    setSelectedAgent(agent);
    setIsBuilderOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this AI Agent?")) {
      await deleteAgent(id);
      loadData();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Agents Studio</h1>
          <p className="text-[var(--text-secondary)] mt-2">Build and configure virtual assistants to answer your calls autonomously.</p>
        </div>
        <button onClick={handleCreate} className="apple-btn px-6 py-2.5 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create AI Agent
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface-solid)]/30">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No AI Agents yet</h3>
          <p className="text-[var(--text-secondary)] mb-6 text-center max-w-md">Create your first AI assistant to handle customer inquiries, book appointments, or route calls automatically.</p>
          <button onClick={handleCreate} className="apple-btn px-6 py-2.5">
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="glass-panel p-6 flex flex-col group relative">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button onClick={() => handleEdit(agent)} className="p-2 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(agent.id)} className="p-2 rounded-full bg-[var(--bg-surface-hover)] text-rose-500 hover:bg-rose-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-[var(--border-subtle)] flex items-center justify-center text-cyan-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
                    <span>•</span>
                    <span className="capitalize">{agent.voice} voice</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[var(--bg-surface-hover)] rounded-xl p-4 mb-4 border border-[var(--border-subtle)]">
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 font-mono">
                  {agent.prompt}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <PhoneCall className="w-4 h-4" />
                {agent.phoneNumber ? (
                  <span className="text-white font-medium">{agent.phoneNumber.number}</span>
                ) : (
                  <span className="italic opacity-50">Unassigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isBuilderOpen && (
        <AgentBuilder 
          agent={selectedAgent} 
          numbers={numbers} 
          onClose={() => {
            setIsBuilderOpen(false);
            loadData();
          }} 
        />
      )}
    </div>
  );
}
