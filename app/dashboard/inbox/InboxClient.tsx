"use client";

import { useState } from "react";
import { Phone, MessageSquare, PhoneMissed, Voicemail, Clock, CheckCircle2, User, Play, Sparkles } from "lucide-react";

export type InboxEvent = {
  id: string;
  type: 'CALL' | 'SMS' | 'WHATSAPP';
  direction: string;
  status: string;
  from: string;
  to: string;
  timestamp: string;
  // Call specific
  duration?: number;
  recordingUrl?: string | null;
  transcriptionText?: string | null;
  aiSummary?: string | null;
  // SMS specific
  body?: string;
};

export default function InboxClient({ initialEvents }: { initialEvents: InboxEvent[] }) {
  const [events] = useState<InboxEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEvents.length > 0 ? initialEvents[0].id : null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventIcon = (event: InboxEvent) => {
    if (event.type === 'WHATSAPP') return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    if (event.type === 'SMS') return <MessageSquare className="w-4 h-4 text-blue-400" />;
    if (event.type === 'CALL') {
      if (event.status === 'VOICEMAIL') return <Voicemail className="w-4 h-4 text-violet-400" />;
      if (event.status === 'NO_ANSWER' || event.status === 'MISSED') return <PhoneMissed className="w-4 h-4 text-rose-400" />;
      return <Phone className="w-4 h-4 text-emerald-400" />;
    }
    return <MessageSquare className="w-4 h-4 text-gray-400" />;
  };

  const getEventPreview = (event: InboxEvent) => {
    if (event.type === 'SMS' || event.type === 'WHATSAPP') return event.body ? event.body.substring(0, 50) + (event.body.length > 50 ? '...' : '') : 'Message vide';
    if (event.type === 'CALL') {
      if (event.aiSummary) return event.aiSummary.substring(0, 50) + '...';
      if (event.status === 'VOICEMAIL') return 'Nouveau message vocal';
      if (event.status === 'NO_ANSWER') return 'Appel manqué';
      return `Appel terminé (${event.duration}s)`;
    }
    return '';
  };

  return (
    <div className="flex w-full h-full">
      {/* Left Pane: List */}
      <div className="w-full md:w-96 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex flex-col h-full">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Boîte de réception</h2>
          <p className="text-sm text-[var(--text-secondary)]">{events.length} événements</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {events.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              Aucun message.
            </div>
          ) : (
            events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`w-full text-left p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors flex gap-3 ${selectedEventId === event.id ? 'bg-[var(--bg-surface-hover)] border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="mt-1 p-2 bg-[var(--bg-base)] rounded-full shrink-0">
                  {getEventIcon(event)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[var(--text-primary)] truncate">
                      {event.direction === 'INBOUND' ? event.from : event.to}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap ml-2">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {getEventPreview(event)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Detail */}
      <div className="hidden md:flex flex-1 bg-[var(--bg-base)] flex-col h-full">
        {selectedEvent ? (
          <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-solid)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                   <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                    {selectedEvent.direction === 'INBOUND' ? selectedEvent.from : selectedEvent.to}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(selectedEvent.timestamp).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>
                      {selectedEvent.direction === 'INBOUND' ? 'Reçu' : 'Envoyé'} via {selectedEvent.direction === 'INBOUND' ? selectedEvent.to : selectedEvent.from}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-full text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1">
                  {getEventIcon(selectedEvent)} {selectedEvent.type}
                </span>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                {/* SMS View */}
                {(selectedEvent.type === 'SMS' || selectedEvent.type === 'WHATSAPP') && (
                  <div className="glass-panel p-8 relative">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                      {selectedEvent.type === 'WHATSAPP' ? 'Message WhatsApp' : 'Message Texte'}
                    </h4>
                    <p className="text-xl leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                      {selectedEvent.body}
                    </p>
                  </div>
                )}

                {/* Call View */}
                {selectedEvent.type === 'CALL' && (
                  <div className="space-y-8">
                    {/* Summary Card (AI) */}
                    {(selectedEvent.aiSummary || selectedEvent.status === 'VOICEMAIL') && (
                      <div className="p-8 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 rounded-3xl border border-cyan-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                          <Sparkles className="w-32 h-32 text-cyan-400" />
                        </div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" /> Résumé généré par l'IA
                        </h4>
                        <p className="text-xl leading-relaxed text-[var(--text-primary)] relative z-10">
                          {selectedEvent.aiSummary || "L'appelant a laissé un message vocal."}
                        </p>
                      </div>
                    )}

                    {/* Call Metadata */}
                    <div className="flex gap-4">
                      {selectedEvent.duration !== undefined && selectedEvent.duration > 0 && (
                        <div className="glass-panel px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
                          <span className="text-sm text-[var(--text-secondary)] mb-1">Durée</span>
                          <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                            {Math.floor(selectedEvent.duration / 60)}:{(selectedEvent.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      <div className="glass-panel px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-[var(--text-secondary)] mb-1">Statut</span>
                        <span className="text-lg font-bold text-[var(--text-primary)]">
                          {selectedEvent.status}
                        </span>
                      </div>
                    </div>

                    {/* Audio Player placeholder (if voicemail or recording) */}
                    {selectedEvent.status === 'VOICEMAIL' && (
                      <div className="glass-panel p-4 flex items-center gap-4">
                        <button className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform">
                          <Play className="w-5 h-5 ml-1" />
                        </button>
                        <div className="flex-1">
                          <div className="h-2 bg-[var(--bg-surface-hover)] rounded-full w-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-1/3 rounded-full"></div>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-[var(--text-secondary)]">0:12 / 0:25</span>
                      </div>
                    )}

                    {/* Transcription */}
                    {selectedEvent.transcriptionText && (
                      <div className="glass-panel p-8">
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-6 uppercase tracking-wider">
                          Transcription complète
                        </h4>
                        <div className="space-y-4">
                          {selectedEvent.transcriptionText.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            const isAgent = line.startsWith('Agent:') || line.startsWith('Antigravity:');
                            return (
                              <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${isAgent ? 'bg-cyan-500/10 border border-cyan-500/20 text-[var(--text-primary)]' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)]'}`}>
                                  <span className="text-xs font-bold uppercase mb-1 block opacity-50">
                                    {isAgent ? 'Agent IA' : 'Client'}
                                  </span>
                                  <p className="leading-relaxed">{line.replace(/^(Agent|Client|Antigravity):\s*/, '')}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
            <div className="w-24 h-24 rounded-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg">Sélectionnez un message pour l'afficher.</p>
          </div>
        )}
      </div>
    </div>
  );
}
