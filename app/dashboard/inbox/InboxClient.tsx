"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Bot, AlertTriangle, ShieldCheck, Sparkles, MessageCircle, Camera, Monitor, PhoneCall, Plus, Search, X, Loader2 } from "lucide-react";

type ContactPreview = {
  id: string;
  name: string;
  phone: string;
  botMode: boolean;
  escalationStatus: string;
  aiSummary: string | null;
  lastMessage: { body: string, sentAt: string, direction: string, type: string } | null;
};

type OmnichannelMessage = {
  id: string;
  body: string;
  direction: string;
  type: string;
  sentAt: string;
  mediaUrls?: string[];
  recordingUrl?: string;
  duration?: number;
};

type AllContact = {
  id: string;
  name: string | null;
  phone: string;
};

export default function InboxClient({ organizationId }: { organizationId?: string }) {
  const [contacts, setContacts] = useState<ContactPreview[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OmnichannelMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("WHATSAPP");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation modal state
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [allContacts, setAllContacts] = useState<AllContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // Set default channel based on contact's last message type
  useEffect(() => {
    if (selectedContact?.lastMessage) {
      if (['WHATSAPP', 'SMS', 'INSTAGRAM', 'FACEBOOK'].includes(selectedContact.lastMessage.type)) {
        setSelectedChannel(selectedContact.lastMessage.type);
      }
    }
  }, [selectedContactId, selectedContact]);

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
        setTimeout(scrollToBottom, 100);
      });
  }, [selectedContactId]);

  // Real-time Pusher setup
  useEffect(() => {
    if (!organizationId) return;

    let pusher: any;
    let channel: any;

    import('pusher-js').then((PusherModule) => {
      const Pusher = PusherModule.default || PusherModule;
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });

      channel = pusher.subscribe(`org-${organizationId}`);

      channel.bind('new-message', (data: any) => {
        if (data.contactId === selectedContactId) {
          setMessages(prev => [...prev, data]);
          setTimeout(scrollToBottom, 100);
        }
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
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, [organizationId, selectedContactId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContactId || isSending) return;

    const textToSend = inputText;
    setInputText("");
    setIsSending(true);

    // Optimistic UI update
    const optimisticMsg: OmnichannelMessage = {
      id: `temp_${Date.now()}`,
      body: textToSend,
      direction: 'OUTBOUND',
      type: selectedChannel,
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContactId, body: textToSend, channel: selectedChannel, type: selectedChannel })
      });
      // Refresh messages after send
      const res = await fetch(`/api/inbox/messages?contactId=${selectedContactId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
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
      setContacts(prev => prev.map(c =>
        c.id === selectedContactId ? { ...c, botMode, escalationStatus } : c
      ));
    } catch(e) {}
  };

  const openNewConversationModal = async () => {
    setShowNewConvModal(true);
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setAllContacts(data.contacts || data || []);
    } catch (e) {
      console.error("Failed to load contacts", e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const startConversationWith = (contact: AllContact) => {
    setShowNewConvModal(false);
    setContactSearch("");
    // Check if already in inbox list
    const existing = contacts.find(c => c.id === contact.id);
    if (existing) {
      setSelectedContactId(contact.id);
    } else {
      // Add to contacts list temporarily
      const newContact: ContactPreview = {
        id: contact.id,
        name: contact.name || contact.phone,
        phone: contact.phone,
        botMode: false,
        escalationStatus: 'NONE',
        aiSummary: null,
        lastMessage: null,
      };
      setContacts(prev => [newContact, ...prev]);
      setSelectedContactId(contact.id);
      setMessages([]);
    }
  };

  const filteredAllContacts = allContacts.filter(c => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return (c.name?.toLowerCase().includes(q)) || c.phone.includes(q);
  });

  const getChannelColor = (type: string, isOutbound: boolean) => {
    if (!isOutbound) return 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-none';
    switch(type) {
      case 'WHATSAPP': return 'bg-emerald-600 text-white rounded-br-none';
      case 'INSTAGRAM': return 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white rounded-br-none';
      case 'FACEBOOK': return 'bg-blue-600 text-white rounded-br-none';
      default: return 'bg-rose-600 text-white rounded-br-none';
    }
  };

  const getChannelIcon = (type: string) => {
    switch(type) {
      case 'WHATSAPP': return <MessageCircle className="w-3 h-3" />;
      case 'INSTAGRAM': return <Camera className="w-3 h-3" />;
      case 'FACEBOOK': return <Monitor className="w-3 h-3" />;
      case 'CALL': return <PhoneCall className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)]">

      {/* LEFT PANE: Contacts List */}
      <div className="w-full md:w-80 border-r border-[var(--border-subtle)] flex flex-col h-full bg-[var(--bg-surface)] shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Discussions</h2>
          <button
            onClick={openNewConversationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold btn-primary-gradient"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 bg-[var(--bg-base)] rounded-xl px-3 py-2 border border-[var(--border-subtle)]">
            <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-10 h-10 text-[var(--text-secondary)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-secondary)] mb-3">Aucune conversation</p>
              <button
                onClick={openNewConversationModal}
                className="btn-primary-gradient text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Démarrer une conversation
              </button>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full text-left p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors flex gap-3 ${selectedContactId === contact.id ? 'bg-[var(--bg-surface-hover)] border-l-2 border-l-rose-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="mt-1 p-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full shrink-0 relative">
                  <User className="w-4 h-4 text-[var(--text-secondary)]" />
                  {contact.escalationStatus === 'REQUESTED' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[var(--bg-surface)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{contact.name}</span>
                    {contact.lastMessage && (
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0 ml-2">
                        {new Date(contact.lastMessage.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {contact.lastMessage?.body || "Nouvelle conversation"}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    {contact.botMode ? (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        <Bot className="w-2.5 h-2.5" /> IA
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Humain
                      </span>
                    )}
                    {contact.escalationStatus === 'REQUESTED' && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Escaladé
                      </span>
                    )}
                    <span className="ml-auto">{getChannelIcon(contact.lastMessage?.type || 'SMS')}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MIDDLE PANE: Chat */}
      <div className="hidden md:flex flex-1 flex-col h-full bg-[var(--bg-base)] relative">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400/20 to-orange-400/20 border border-[var(--border-subtle)] flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{selectedContact.name}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedContact.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedContact.botMode ? (
                  <button
                    onClick={() => handleTakeover(false, selectedContact.escalationStatus === 'REQUESTED' ? 'RESOLVED' : selectedContact.escalationStatus)}
                    className="text-sm font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Reprendre la main
                  </button>
                ) : (
                  <button
                    onClick={() => handleTakeover(true, 'NONE')}
                    className="text-sm font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" /> Confier à l'IA
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full text-[var(--text-secondary)]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] gap-3">
                  <MessageSquare className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Aucun message. Commencez la conversation ci-dessous !</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOutbound = msg.direction === 'OUTBOUND';

                  if (msg.type === 'CALL') {
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 border border-[var(--border-subtle)] ${isOutbound ? 'bg-[var(--bg-surface)] rounded-br-none' : 'bg-[var(--bg-surface)]/60 rounded-bl-none'}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-500/20 rounded-full">
                              <PhoneCall className="w-4 h-4 text-rose-500" />
                            </div>
                            <span className="font-bold text-sm text-[var(--text-primary)]">
                              Appel Vocal {msg.duration ? `(${msg.duration}s)` : ''}
                            </span>
                          </div>
                          {msg.recordingUrl && (
                            <audio src={msg.recordingUrl} controls className="w-full h-10 mb-2" />
                          )}
                          <p className="text-sm italic text-[var(--text-secondary)] bg-[var(--bg-base)] p-3 rounded-lg border border-[var(--border-subtle)]">
                            {msg.body}
                          </p>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] mt-1 px-1">
                          {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${getChannelColor(msg.type, isOutbound)}`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.body}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] mt-1 px-1 flex items-center gap-1">
                        {isOutbound && getChannelIcon(msg.type)}
                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {!isOutbound && getChannelIcon(msg.type)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input — ALWAYS VISIBLE */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {selectedContact.botMode && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700">L'Agent IA gère cette conversation. Cliquez sur "Reprendre la main" pour écrire.</p>
                </div>
              )}

              {/* Channel selector */}
              <div className="flex items-center gap-1.5 mb-2">
                <button onClick={() => setSelectedChannel('WHATSAPP')} className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'WHATSAPP' ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </button>
                <button onClick={() => setSelectedChannel('SMS')} className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'SMS' ? 'bg-blue-500/15 text-blue-700 border border-blue-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <MessageSquare className="w-3 h-3" /> SMS
                </button>
                <button onClick={() => setSelectedChannel('INSTAGRAM')} className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'INSTAGRAM' ? 'bg-pink-500/15 text-pink-700 border border-pink-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <Camera className="w-3 h-3" /> Instagram
                </button>
                <button onClick={() => setSelectedChannel('FACEBOOK')} className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'FACEBOOK' ? 'bg-blue-500/15 text-blue-700 border border-blue-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <Monitor className="w-3 h-3" /> Facebook
                </button>
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={selectedContact.botMode}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={selectedContact.botMode ? "Reprenez la main pour écrire..." : "Écrivez un message (Entrée pour envoyer)..."}
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] resize-none min-h-[48px] max-h-[120px] focus:outline-none focus:border-rose-400 transition-colors text-sm placeholder:text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || selectedContact.botMode || isSending}
                  className="w-11 h-11 n8n-gradient-bg rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 shrink-0"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] flex-col gap-4 p-8">
            <MessageSquare className="w-14 h-14 opacity-10" />
            <div className="text-center">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Aucune conversation sélectionnée</p>
              <p className="text-sm mb-4">Sélectionnez une conversation ou démarrez-en une nouvelle</p>
              <button
                onClick={openNewConversationModal}
                className="btn-primary-gradient flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" /> Nouvelle conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Context & AI Summary */}
      <div className="hidden lg:flex w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col h-full shrink-0">
        {selectedContact ? (
          <>
            <div className="p-5 border-b border-[var(--border-subtle)] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-full mx-auto flex items-center justify-center border border-rose-500/30 mb-3">
                <User className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">{selectedContact.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedContact.phone}</p>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Résumé IA
                </h4>
                <div className="glass-panel p-3 text-xs text-[var(--text-secondary)] leading-relaxed rounded-xl border border-[var(--border-subtle)]">
                  {selectedContact.aiSummary || "L'IA n'a pas encore généré de résumé pour ce contact."}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-xs px-6 text-center">
            Les informations du contact s'afficheront ici
          </div>
        )}
      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewConvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Nouvelle conversation</h2>
              <button onClick={() => { setShowNewConvModal(false); setContactSearch(""); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-xl px-3 py-2.5 border border-[var(--border-subtle)] mb-3">
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  autoFocus
                  className="bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {isLoadingContacts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
                  </div>
                ) : filteredAllContacts.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-secondary)] py-8">Aucun contact trouvé</p>
                ) : (
                  filteredAllContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => startConversationWith(contact)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{contact.name || "Sans nom"}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{contact.phone}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
