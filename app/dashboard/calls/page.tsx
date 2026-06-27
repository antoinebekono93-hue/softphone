"use client";

import { useState, useEffect } from "react";
import { Phone, Users, PhoneMissed, Activity, Loader2, PlayCircle, FileText } from "lucide-react";

type CallLog = {
  id: string;
  telnyxCallControlId: string;
  direction: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  transcriptionText: string | null;
  aiSummary: string | null;
};

type Stats = {
  totalCalls: number;
  connectionRate: number;
  abandonedRate: number;
  maxChannels: number;
};

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingMock, setGeneratingMock] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [callsRes, statsRes] = await Promise.all([
        fetch('/api/calls'),
        fetch('/api/calls/stats')
      ]);
      if (callsRes.ok) {
        const data = await callsRes.json();
        setCalls(data);
        if (data.length > 0 && !selectedCall) setSelectedCall(data[0]);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateMock = async () => {
    setGeneratingMock(true);
    try {
      await fetch('/api/calls/mock', { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingMock(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 md:p-8 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
              Intelligence <span className="text-gradient">Vocale</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">Analysez vos appels, consultez les transcriptions et suivez votre capacité réseau.</p>
          </div>
          <button 
            onClick={handleGenerateMock}
            disabled={generatingMock}
            className="w-full md:w-auto btn-primary-gradient flex items-center justify-center gap-2"
          >
            {generatingMock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Générer appels tests
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="glass-panel p-6 flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Total Appels</div>
                <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{stats.totalCalls}</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
            </div>
            <div className="glass-panel p-6 flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Taux Connexion</div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-500">{stats.connectionRate.toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="glass-panel p-6 flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Abandonnés</div>
                <div className="text-3xl md:text-4xl font-bold text-rose-500">{stats.abandonedRate.toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500 shadow-sm">
                <PhoneMissed className="w-6 h-6" />
              </div>
            </div>
            <div className="glass-panel p-6 flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Pic Canaux</div>
                <div className="text-3xl md:text-4xl font-bold text-violet-500">{stats.maxChannels}</div>
              </div>
              <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-500 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left List */}
        <div className="w-full md:w-1/3 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30 overflow-y-auto flex-shrink-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" /></div>
          ) : calls.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Aucun appel trouvé. Générez des données mock.</div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {calls.map(call => (
                <div 
                  key={call.id} 
                  onClick={() => setSelectedCall(call)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)] ${selectedCall?.id === call.id ? 'bg-[var(--bg-surface-hover)] border-l-4 border-cyan-500' : 'border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-[var(--text-primary)]">{call.direction === "INBOUND" ? call.fromNumber : call.toNumber}</div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${call.status === 'COMPLETED' ? 'badge-glass-green' : call.status === 'CANCELED' || call.status === 'MISSED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'badge-glass-gray'}`}>
                      {call.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      {call.direction === "INBOUND" ? "Entrant" : "Sortant"}
                    </span>
                    <span className="font-mono bg-[var(--bg-surface-solid)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Details */}
        <div className="w-full md:w-2/3 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8">
          {selectedCall ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="glass-panel p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  {selectedCall.direction === "INBOUND" ? selectedCall.fromNumber : selectedCall.toNumber}
                </h2>
                <div className="text-sm text-[var(--text-secondary)] flex flex-wrap items-center gap-4">
                  <span className="font-mono bg-[var(--bg-surface-hover)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                    ID: {selectedCall.telnyxCallControlId}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Activity className="w-4 h-4" /> Durée: {formatDuration(selectedCall.duration)}
                  </span>
                </div>
              </div>

              {selectedCall.aiSummary ? (
                <div className="glass-panel relative overflow-hidden p-6 shadow-sm border border-cyan-500/30">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-cyan-500 font-bold mb-4">
                      <Activity className="w-5 h-5" />
                      Résumé IA de l'appel
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed text-sm">{selectedCall.aiSummary}</p>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-6 text-center text-sm text-[var(--text-secondary)] border-dashed">
                  Aucun résumé IA disponible pour cet appel.
                </div>
              )}

              {selectedCall.transcriptionText && (
                <div className="glass-panel p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold mb-6 pb-4 border-b border-[var(--border-subtle)]">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    Transcription de la conversation
                  </div>
                  <div className="space-y-4">
                    {selectedCall.transcriptionText.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      const isClient = line.startsWith('Client:');
                      return (
                        <div key={idx} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm border ${isClient ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400/50 rounded-br-sm' : 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] rounded-bl-sm'}`}>
                            {line.replace('Client: ', '').replace('IA: ', '')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Sélectionnez un appel pour voir les détails de l'intelligence artificielle</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
