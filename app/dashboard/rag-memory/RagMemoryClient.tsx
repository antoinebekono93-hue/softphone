"use client";

import { useState } from "react";
import { searchConversationHistory, toggleConversationPersistence } from "./actions";
import { Brain, Database, Search, History, Loader2, Play, FileText, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";

export default function RagMemoryClient({ initialConnections }: { initialConnections: any[] }) {
  const [activeTab, setActiveTab] = useState<"memory" | "rag">("memory");
  
  // Memory State
  const [connections, setConnections] = useState(initialConnections);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleToggle = async (connectionId: string, currentState: boolean) => {
    setIsToggling(connectionId);
    const res = await toggleConversationPersistence(connectionId, !currentState);
    if (res.success) {
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, conversation_persistence: !currentState } : c
      ));
    }
    setIsToggling(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const res = await searchConversationHistory(searchQuery, 10);
    if (res.success) {
      setSearchResults(res.data);
    }
    setIsSearching(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
          <Brain className="text-violet-500" />
          Mémoire & RAG
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 max-w-3xl">
          Donnez à vos agents IA une mémoire à long terme en indexant vos appels, et enrichissez leurs connaissances avec vos propres documents via le RAG (Retrieval-Augmented Generation).
        </p>
      </div>

      <div className="flex space-x-1 p-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("memory")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "memory" ? "bg-violet-500 text-white" : "text-gray-400 hover:text-white"}`}
        >
          Historique (Mémoire)
        </button>
        <button
          onClick={() => setActiveTab("rag")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "rag" ? "bg-violet-500 text-white" : "text-gray-400 hover:text-white"}`}
        >
          Bases de Connaissances (RAG)
        </button>
      </div>

      {activeTab === "memory" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-violet-400" />
                Connexions SIP
              </h2>
              <p className="text-sm text-gray-400 mt-1">Activez la persistance des conversations pour stocker et indexer l'historique des appels (conservation de 30 jours).</p>
            </div>

            <div className="space-y-3">
              {connections.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-center text-gray-500 text-sm">
                  Aucune connexion SIP FQDN trouvée.
                </div>
              ) : (
                connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                    <div>
                      <div className="text-sm font-medium text-white">{conn.connection_name}</div>
                      <div className="text-xs text-gray-500">ID: {conn.id}</div>
                    </div>
                    <button 
                      onClick={() => handleToggle(conn.id, !!conn.conversation_persistence)}
                      disabled={isToggling === conn.id}
                      className="text-2xl disabled:opacity-50 transition-colors"
                    >
                      {isToggling === conn.id ? (
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                      ) : conn.conversation_persistence ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-600" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-violet-400" />
                Recherche Sémantique
              </h2>
              <p className="text-sm text-gray-400 mt-1">Retrouvez des interactions passées en cherchant par le sens plutôt que par mots-clés exacts.</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ex: Demande de remboursement de vol..."
                className="flex-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <button disabled={isSearching} type="submit" className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm rounded-xl flex items-center gap-2 disabled:opacity-50">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Chercher
              </button>
            </form>

            <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <div className="text-center text-sm text-gray-500 py-4">Aucun résultat trouvé.</div>
              )}
              {searchResults.map((result, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-violet-400">Score: {Math.round(result.score * 100)}%</span>
                    <span className="text-xs text-gray-500">{new Date(result.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-300">"{result.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rag" && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface-solid)] border border-violet-500/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-3xl rounded-full"></div>
            
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2 relative z-10">
              <Database className="w-6 h-6 text-violet-400" />
              Bases de Connaissances
            </h2>
            <p className="text-gray-400 mt-2 max-w-2xl relative z-10">
              Transformez vos documents (PDF, Textes) en base de connaissances pour vos agents IA. 
              Pour intégrer un document, uploadez-le via Telnyx Storage, puis intégrez-le (Embed).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
              <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white">1. Uploader vos fichiers</h3>
                <p className="text-sm text-gray-400">Glissez-déposez vos documents sur Telnyx Cloud Storage (S3-compatible).</p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white">2. Générer l'Embedding</h3>
                <p className="text-sm text-gray-400">Telnyx va découper vos documents et générer les vecteurs sémantiques (Chunks).</p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Play className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white">3. Fournir au LLM</h3>
                <p className="text-sm text-gray-400">Indiquez l'ID du Bucket dans la configuration de votre Assistant IA (Outil de Retrieval).</p>
              </div>
            </div>
            
            <div className="mt-8 relative z-10 flex gap-4">
              <a href="https://portal.telnyx.com/#/storage/buckets" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm rounded-xl transition-colors">
                Ouvrir Telnyx Storage
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
