"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Phone, Send, User, Bot, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import Pusher from "pusher-js";

type ContactPreview = {
  id: string;
  name: string;
  phone: string;
  botMode: boolean;
  escalationStatus: string;
  aiSummary: string | null;
  lastMessage: { body: string, sentAt: string, direction: string, type: string } | null;
};

type SmsMessage = {
  id: string;
  body: string;
  direction: string;
  type: string;
  sentAt: string;
};

export default function InboxClient({ organizationId, initialEvents }: { organizationId?: string, initialEvents?: any[] }) {
  const [contacts, setContacts] = useState<ContactPreview[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Fetch initial contacts
  useEffect(() => {
    fetch('/api/inbox/contacts')
      .then(res => res.json())
      .then(data => {
        if (data.contacts) {
          setContacts(data.contacts);
          if (data.contacts.length > 0) setSelectedContactId(data.contacts[0].id);
        }
      });
  }, []);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!selectedContactId) return;
    setIsLoadingMessages(true);
    fetch(`/api/inbox/messages?contactId=${selectedContactId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
        setIsLoadingMessages(false);
        scrollToBottom();
      });
  }, [selectedContactId]);

  // Real-time Pusher setup
  useEffect(() => {
    if (!organizationId) return;
    
    // Enable pusher logging - don't include this in production
    // Pusher.logToConsole = true;
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`org-${organizationId}`);
    
    channel.bind('new-message', (data: any) => {
      // If it's for the selected contact, add it to the messages
      if (data.contactId === selectedContactId) {
        setMessages(prev => [...prev, data]);
        setTimeout(scrollToBottom, 100);
      }
      // Re-fetch contacts to update previews (or we could mutate state locally)
      fetch('/api/inbox/contacts')
        .then(res => res.json())
        .then(resData => {
          if (resData.contacts) setContacts(resData.contacts);
        });
    });

    channel.bind('contact-updated', (data: any) => {
      setContacts(prev => prev.map(c => 
        c.id === data.contactId 
          ? { ...c, botMode: data.botMode, escalationStatus: data.escalationStatus } 
          : c
      ));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [organizationId, selectedContactId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContactId) return;
    
    const textToSend = inputText;
    setInputText("");

    // Optimistic UI update could go here
    
    try {
      const res = await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContactId, body: textToSend })
      });
      // Errors will be caught, but Pusher handles the success state
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleTakeover = async (botMode: boolean, escalationStatus: string) => {
    if (!selectedContactId) return;
    try {
      await fetch('/api/inbox/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContactId, botMode, escalationStatus })
      });
    } catch(e) {}
  };

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)]">
      
      {/* LEFT PANE: Contacts List */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col h-full bg-slate-900/50 backdrop-blur-xl shrink-0">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Discussions</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`w-full text-left p-4 border-b border-white/10 hover:bg-slate-800/50 transition-colors flex gap-3 ${selectedContactId === contact.id ? 'bg-slate-800/80 border-l-2 border-l-rose-500' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="mt-1 p-2 bg-slate-900 rounded-full shrink-0 relative">
                <User className="w-5 h-5 text-gray-400" />
                {contact.escalationStatus === 'REQUESTED' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[var(--bg-surface-solid)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[var(--text-primary)] truncate">{contact.name}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {contact.lastMessage?.body || "Nouvelle conversation"}
                </p>
                <div className="mt-2 flex gap-2">
                  {contact.botMode ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> IA
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> Humain
                    </span>
                  )}
                  {contact.escalationStatus === 'REQUESTED' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Escaladé
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE PANE: Chat */}
      <div className="hidden md:flex flex-1 flex-col h-full bg-slate-950 relative">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-lg flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{selectedContact.name}</h3>
                <span className="text-sm text-[var(--text-secondary)]">{selectedContact.phone}</span>
              </div>
              
              <div>
                {selectedContact.botMode ? (
                  <button 
                    onClick={() => handleTakeover(false, selectedContact.escalationStatus === 'REQUESTED' ? 'RESOLVED' : selectedContact.escalationStatus)}
                    className="text-sm font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Reprendre la main
                  </button>
                ) : (
                  <button 
                    onClick={() => handleTakeover(true, 'NONE')}
                    className="text-sm font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" /> Laisser l'IA gérer
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full text-[var(--text-secondary)]">Chargement...</div>
              ) : (
                messages.map(msg => {
                  const isOutbound = msg.direction === 'OUTBOUND';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isOutbound 
                          ? 'n8n-gradient-bg rounded-br-none' 
                          : 'glass-panel-premium text-[var(--text-primary)] rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)] mt-1 px-1">
                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-lg">
              {selectedContact.botMode ? (
                <div className="flex items-center justify-center p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm text-emerald-600 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> L'Agent IA gère cette conversation. Reprenez la main pour écrire.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  <textarea 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Écrivez un message (Entrée pour envoyer)..."
                    className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-[var(--text-primary)] resize-none h-14 focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-2 bottom-2 w-10 n8n-gradient-bg rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] flex-col gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>Sélectionnez une conversation</p>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Context & AI Summary */}
      <div className="hidden lg:flex w-80 border-l border-white/10 bg-slate-900/50 backdrop-blur-xl flex-col h-full shrink-0">
        {selectedContact ? (
          <>
            <div className="p-6 border-b border-white/10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-full mx-auto flex items-center justify-center border border-rose-500/30 mb-4">
                <User className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="font-bold text-xl text-[var(--text-primary)]">{selectedContact.name}</h3>
              <p className="text-[var(--text-secondary)]">{selectedContact.phone}</p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h4 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" /> Résumé de l'IA
              </h4>
              <div className="glass-panel-premium p-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                {selectedContact.aiSummary || "L'IA n'a pas encore généré de résumé pour ce client."}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm px-8 text-center">
            Les informations du contact s'afficheront ici
          </div>
        )}
      </div>

    </div>
  );
}
