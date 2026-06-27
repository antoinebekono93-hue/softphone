"use client";

import { useState } from "react";
import { Softphone } from "./Softphone";
import { Search, History, Users, Voicemail, PhoneMissed, PhoneForwarded, PhoneIncoming, MoreVertical, Play } from "lucide-react";

const mockHistory = [
  { id: 1, name: "Alice Dupont", number: "+33 6 12 34 56 78", type: "missed", time: "10:42 AM", date: "Today" },
  { id: 2, name: "Bob Martin", number: "+1 (555) 123-4567", type: "incoming", time: "09:15 AM", date: "Today", duration: "05:23" },
  { id: 3, name: "Charlie Chaplin", number: "+44 7700 900077", type: "outgoing", time: "Yesterday", date: "Yesterday", duration: "12:01" },
  { id: 4, name: "Diana Prince", number: "+1 (555) 987-6543", type: "incoming", time: "Yesterday", date: "Yesterday", duration: "01:45" },
  { id: 5, name: "Unknown Number", number: "+33 1 23 45 67 89", type: "missed", time: "Tuesday", date: "Tuesday" },
  { id: 6, name: "Alice Dupont", number: "+33 6 12 34 56 78", type: "outgoing", time: "Monday", date: "Monday", duration: "02:10" },
];

const mockContacts = [
  { id: 1, name: "Alice Dupont", company: "Acme Corp", number: "+33 6 12 34 56 78", initial: "A" },
  { id: 2, name: "Bob Martin", company: "Globex", number: "+1 (555) 123-4567", initial: "B" },
  { id: 3, name: "Charlie Chaplin", company: "Stark Ind.", number: "+44 7700 900077", initial: "C" },
  { id: 4, name: "Diana Prince", company: "Wayne Ent.", number: "+1 (555) 987-6543", initial: "D" },
];

export function SoftphoneWorkspace() {
  const [activeTab, setActiveTab] = useState<'history' | 'contacts' | 'voicemail'>('history');
  const [searchQuery, setSearchQuery] = useState("");

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

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'history' && (
            <div className="divide-y divide-[var(--border-subtle)]">
              {mockHistory.map((call) => (
                <div key={call.id} className="p-4 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center">
                      {getCallIcon(call.type)}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${call.type === 'missed' ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                        {call.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {call.number}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-[var(--text-secondary)] mb-1">{call.time}</span>
                    {call.duration && <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">{call.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="divide-y divide-[var(--border-subtle)]">
              {mockContacts.map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] font-bold">
                      {contact.initial}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {contact.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {contact.company}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-[var(--text-secondary)] hover:text-cyan-500 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'voicemail' && (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                <Voicemail className="w-8 h-8 text-[var(--text-secondary)]" />
              </div>
              <p className="text-[var(--text-secondary)]">No new voicemails.</p>
            </div>
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
