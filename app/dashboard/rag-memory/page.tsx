'use client';

import { useState, useEffect } from 'react';
import { Brain, Search, Trash2, Tag, Clock, Zap, BookOpen } from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  type: 'SKILL' | 'FACT' | 'PROCEDURE' | 'ESCALATION';
  agentId: string;
  timestamp: string;
  score?: number;
  metadata?: { title?: string; category?: string; key_phrases?: string[] };
}

const TYPE_COLORS: Record<string, string> = {
  SKILL: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  FACT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PROCEDURE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  ESCALATION: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const TYPE_ICONS: Record<string, any> = {
  SKILL: Zap,
  FACT: BookOpen,
  PROCEDURE: Brain,
  ESCALATION: Tag,
};

export default function RAGMemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [stats, setStats] = useState({ total: 0, skills: 0, facts: 0 });

  async function fetchStats() {
    try {
      const res = await fetch('/api/knowledge/memories?stats=1');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/knowledge/memories?q=${encodeURIComponent(query)}&topK=10`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mémoire Hermes</h1>
          <p className="text-sm text-muted-foreground">Base de connaissances sémantique des agents IA — procédures auto-apprises</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total mémoires', value: stats.total, icon: Brain, color: 'violet' },
          { label: 'Skills générées', value: stats.skills, icon: Zap, color: 'emerald' },
          { label: 'Faits extraits', value: stats.facts, icon: BookOpen, color: 'blue' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 border border-${s.color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${s.color}-400`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recherche Sémantique</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ex: client insatisfait commande retard..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recherche...' : 'Chercher'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          La recherche utilise la similarité cosine sur les embeddings OpenAI pour trouver les procédures les plus pertinentes.
        </p>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {memories.length > 0 ? `${memories.length} résultat(s) trouvé(s)` : 'Aucun résultat'}
          </h2>
          {memories.length === 0 && !loading && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune mémoire correspondante trouvée.</p>
              <p className="text-xs mt-1">Les mémoires se génèrent automatiquement quand un agent résout un problème.</p>
            </div>
          )}
          {memories.map(mem => {
            const Icon = TYPE_ICONS[mem.type] || Brain;
            const colorClass = TYPE_COLORS[mem.type] || TYPE_COLORS.SKILL;
            return (
              <div key={mem.id} className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-violet-500/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {mem.type}
                    </span>
                    {mem.metadata?.title && (
                      <span className="text-sm font-semibold">{mem.metadata.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {mem.score !== undefined && (
                      <span className="text-xs text-emerald-400 font-mono">
                        {Math.round(mem.score * 100)}% match
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(mem.timestamp).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                {mem.metadata?.category && (
                  <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                    {mem.metadata.category}
                  </span>
                )}
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/20 rounded-xl p-4 max-h-48 overflow-y-auto">
                  {mem.content}
                </pre>
                {mem.metadata?.key_phrases && mem.metadata.key_phrases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(mem.metadata.key_phrases as string[]).map((kp: string) => (
                      <span key={kp} className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md">
                        {kp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!searched && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center space-y-3">
          <Brain className="w-12 h-12 mx-auto text-violet-400/30" />
          <p className="text-muted-foreground font-medium">Base de mémoire Hermes</p>
          <p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
            Chaque fois qu'un agent résout un problème et que le client dit "merci", 
            une procédure est automatiquement générée et stockée ici.
          </p>
        </div>
      )}
    </div>
  );
}
