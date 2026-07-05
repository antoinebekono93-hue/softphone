"use client";

import { useState, useEffect } from "react";
import { Softphone } from "./Softphone";
import { Search, History, Users, Voicemail, PhoneMissed, PhoneForwarded, PhoneIncoming, MoreVertical, Play, Loader2, UserPlus, ChevronDown, ChevronUp, Bot, Phone } from "lucide-react";

import Link from "next/link";
import { useTelnyx } from "@/contexts/TelnyxContext";

export function SoftphoneWorkspace() {
  const [activeTab, setActiveTab] = useState<'history' | 'contacts' | 'voicemail'>('history');
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const { makeCall } = useTelnyx();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cRes, hRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/calls')
        ]);
        if (cRes.ok) {
          setContacts(await cRes.json());
        }
        if (hRes.ok) {
          setHistory(await hRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'missed': return <PhoneMissed className="w-4 h-4 text-rose-500" />;
      case 'incoming': return <PhoneIncoming className="w-4 h-4 text-emerald-500" />;
      case 'outgoing': return <PhoneForwarded className="w-4 h-4 text-[var(--text-secondary)]" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-5rem)] rounded-2xl overflow-hidden glass-panel border border-[var(--border-subtle)]">
      {/* Left Panel: Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/50">
        {/* Header & Search */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input 
              type="text"
              placeholder="Search contacts or numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 border-b border-[var(--border-subtle)]">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'history' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <History className="w-4 h-4" /> Historique
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'contacts' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <Users className="w-4 h-4" /> Contacts
          </button>
          <button 
            onClick={() => setActiveTab('voicemail')}
            className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'voicemail' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <Voicemail className="w-4 h-4" /> Voicemails
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : (
            <>
              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {history.length === 0 && <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Aucun historique d'appel</div>}
                  {history.map((call) => (
                    <div key={call.id} className="p-4 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                          {getCallIcon(call.status === 'missed' ? 'missed' : call.direction === 'inbound' ? 'incoming' : 'outgoing')}
                          <span className={call.status === 'missed' ? 'text-rose-500' : ''}>{call.fromNumber} &rarr; {call.toNumber}</span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                          <span>{new Date(call.createdAt).toLocaleString()}</span>
                          {call.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{Math.floor(call.duration/60)}m {call.duration%60}s</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="p-2 text-[var(--text-secondary)] hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors">
                        <PhoneForwarded className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CONTACTS TAB */}
              {activeTab === 'contacts' && (
                <div className="divide-y divide-[var(--border-subtle)]">
                  <div className="p-4 flex justify-end">
                    <Link href="/dashboard/contacts" className="apple-btn btn-primary px-3 py-1.5 text-xs flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Créer un contact
                    </Link>
                  </div>
                  {contacts.length === 0 && <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Aucun contact trouvé</div>}
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className="p-4 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer flex flex-col gap-3 border-b border-[var(--border-subtle)]"
                      onClick={() => setExpandedContactId(expandedContactId === contact.id ? null : contact.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-xs font-bold">
                            {(contact.name || "?").charAt(0).toUpperCase()}
                            </div>
                            {contact.name || "Sans Nom"}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 pl-8">
                            <span>{contact.phone}</span>
                            {contact.company && (
                              <>
                                <span>•</span>
                                <span>{contact.company}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button className="p-2 text-[var(--text-secondary)] hover:bg-white/5 rounded-full transition-colors">
                          {expandedContactId === contact.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {expandedContactId === contact.id && (
                        <div className="flex gap-3 pl-8 mt-2 animate-in slide-in-from-top-2 duration-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); alert("Lancement d'un appel via l'Agent IA (À implémenter)"); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm font-semibold text-[var(--text-primary)] transition-colors shadow-sm"
                          >
                            <Bot className="w-4 h-4 text-violet-500" />
                            Agent IA
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); makeCall(contact.phone); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:opacity-90 rounded-xl text-sm font-semibold text-white transition-opacity shadow-sm"
                          >
                            <Phone className="w-4 h-4" />
                            Moi-même
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* VOICEMAIL TAB */}
              {activeTab === 'voicemail' && (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                    <Voicemail className="w-8 h-8 text-[var(--text-secondary)]" />
                  </div>
                  <p className="text-[var(--text-secondary)]">Aucun nouveau message vocal.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel: Dialpad/Softphone */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative bg-gradient-to-br from-[var(--bg-surface-hover)] to-[var(--bg-app)]">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <Softphone />
      </div>
    </div>
  );
}
