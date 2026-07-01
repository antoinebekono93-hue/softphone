"use client";

import { useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Play, FileText, Bot, X } from "lucide-react";

export function CallLogsClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleTranscribe = async (logId: string) => {
    try {
      setIsTranscribing(true);
      const res = await fetch(`/api/calls/${logId}/transcribe`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        setLogs(logs.map(log => log.id === logId ? { ...log, transcriptionText: data.text } : log));
        if (selectedLog?.id === logId) {
          setSelectedLog({ ...selectedLog, transcriptionText: data.text });
        }
      } else {
        alert("Transcription failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error transcribing audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Main Table Area */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all ${selectedLog ? 'md:pr-[400px]' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">Call Logs</h1>
            <p className="text-[var(--text-secondary)] text-sm">History of all inbound and outbound calls.</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Date</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Type</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Number</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Duration</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Status</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Quality</th>
                <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">AI Insight</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                    No call logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isOutbound = log.direction === 'OUTBOUND';
                  const isMissed = log.status === 'NO_ANSWER' || log.status === 'FAILED';
                  const isSelected = selectedLog?.id === log.id;
                  
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--bg-surface-hover)]' : ''}`}
                    >
                      <td className="p-4 text-sm text-[var(--text-primary)] whitespace-nowrap">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="p-4">
                         <div className="flex items-center gap-2">
                           {isMissed ? <PhoneMissed className="w-4 h-4 text-rose-500" /> 
                             : isOutbound ? <PhoneOutgoing className="w-4 h-4 text-cyan-500" />
                             : <PhoneIncoming className="w-4 h-4 text-emerald-500" />}
                           <span className="text-sm text-[var(--text-secondary)] capitalize">{log.direction.toLowerCase()}</span>
                         </div>
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {log.contact ? (
                          <span className="flex items-center gap-1.5">
                            {log.contact.name || log.contact.company || (isOutbound ? log.toNumber : log.fromNumber)}
                          </span>
                        ) : (isOutbound ? log.toNumber : log.fromNumber)}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {formatDuration(log.duration)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${isMissed ? 'badge-glass-red' : 'badge-glass-green'}`}>
                           {log.status === 'COMPLETED' ? 'Answered' : log.status.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="p-4 text-sm">
                        {log.mosScore ? (
                          <div className="flex items-center text-amber-400 text-xs" title={`MOS: ${log.mosScore}`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < Math.round(log.mosScore) ? '★' : '☆'}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           {log.aiSummary ? (
                              <span className="flex items-center gap-1 text-xs text-cyan-500 font-medium bg-cyan-500/10 px-2 py-1 rounded-full">
                                <Bot className="w-3 h-3" /> Summary
                              </span>
                           ) : (
                              <span className="text-xs text-[var(--text-secondary)]">-</span>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side Panel (Drawer) */}
      {selectedLog && (
        <div className="absolute md:static inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-surface-solid)] border-l border-[var(--border-subtle)] flex flex-col shadow-2xl z-20 transition-transform duration-300">
           <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-bold text-lg">Call Details</h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
                 <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-8 text-center">
                 <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center mx-auto mb-3">
                    <Phone className={`w-8 h-8 ${selectedLog.status === 'NO_ANSWER' ? 'text-rose-500' : 'text-cyan-500'}`} />
                 </div>
                 <div className="text-2xl font-bold mb-1">
                   {selectedLog.contact 
                     ? (selectedLog.contact.name || selectedLog.contact.company || (selectedLog.direction === 'OUTBOUND' ? selectedLog.toNumber : selectedLog.fromNumber))
                     : (selectedLog.direction === 'OUTBOUND' ? selectedLog.toNumber : selectedLog.fromNumber)}
                 </div>
                 {selectedLog.contact && (
                   <div className="text-sm text-[var(--text-secondary)] mb-1">
                     {selectedLog.direction === 'OUTBOUND' ? selectedLog.toNumber : selectedLog.fromNumber}
                   </div>
                 )}
                 <div className="text-[var(--text-secondary)] text-sm">
                   {formatDate(selectedLog.startedAt)}
                 </div>
              </div>

              {/* Diagnostics Section */}
              {(selectedLog.hangupCause || selectedLog.mosScore) && (
                <div className="mb-6">
                   <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center"><span className="text-[10px] text-amber-500 font-bold">i</span></div> Diagnostics
                   </h3>
                   <div className="glass-panel p-4 text-sm leading-relaxed text-[var(--text-primary)] grid grid-cols-2 gap-4">
                      {selectedLog.mosScore && (
                        <div>
                          <p className="text-[var(--text-secondary)] text-xs uppercase mb-1">Quality (MOS)</p>
                          <p className="font-bold">{selectedLog.mosScore.toFixed(1)} / 5.0</p>
                        </div>
                      )}
                      {selectedLog.hangupCause && (
                        <div>
                          <p className="text-[var(--text-secondary)] text-xs uppercase mb-1">Hangup Cause</p>
                          <p className="font-bold capitalize">{selectedLog.hangupCause.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {selectedLog.sipHangupCause && (
                        <div>
                          <p className="text-[var(--text-secondary)] text-xs uppercase mb-1">SIP Code</p>
                          <p className="font-bold">{selectedLog.sipHangupCause}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* AI Summary Section */}
              <div className="mb-6">
                 <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-cyan-500" /> AI Summary
                 </h3>
                 <div className="glass-panel p-4 text-sm leading-relaxed text-[var(--text-primary)]">
                    {selectedLog.aiSummary ? (
                      selectedLog.aiSummary
                    ) : (
                      <span className="text-[var(--text-secondary)] italic">AI summary not available for this call.</span>
                    )}
                 </div>
              </div>

              {/* Transcription Section */}
              <div className="mb-6">
                 <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-violet-500" /> Transcription
                 </h3>
                 <div className="glass-panel p-4 text-sm leading-relaxed text-[var(--text-primary)] max-h-64 overflow-y-auto">
                    {selectedLog.transcriptionText ? (
                      <div className="whitespace-pre-wrap">{selectedLog.transcriptionText}</div>
                    ) : selectedLog.recordingUrl ? (
                      <div className="flex flex-col items-start gap-3">
                        <span className="text-[var(--text-secondary)] italic">Transcription not available yet, but an audio recording is present.</span>
                        <button
                          onClick={() => handleTranscribe(selectedLog.id)}
                          disabled={isTranscribing}
                          className="btn-primary flex items-center gap-2 py-1.5 px-3 text-xs"
                        >
                          {isTranscribing ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Transcribing...
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3" />
                              Transcribe Audio
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[var(--text-secondary)] italic">Transcription not available for this call.</span>
                    )}
                 </div>
              </div>

              {/* Recording (Placeholder) */}
              <div className="mb-6">
                 <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Play className="w-4 h-4 text-emerald-500" /> Recording
                 </h3>
                 <div className="glass-panel p-4 flex items-center gap-4">
                    {selectedLog.recordingUrl ? (
                       <audio controls src={selectedLog.recordingUrl} className="w-full" />
                    ) : (
                       <span className="text-sm text-[var(--text-secondary)] italic">Recording not available.</span>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
