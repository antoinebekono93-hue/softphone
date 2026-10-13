"use client";

import { useState, useEffect, useRef } from "react";
import type PusherClient from "pusher-js";
import type { Channel } from "pusher-js";
import { ArrowLeft, WifiOff, MessageSquare, Send, User, Bot, AlertTriangle, ShieldCheck, Sparkles, MessageCircle, Camera, Monitor, PhoneCall, Plus, Search, Loader2, Phone, PhoneMissed, Voicemail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useMobileDetail } from "@/hooks/useMobileDetail";
import { useOnline } from "@/hooks/useOnline";
import { draftKey, readSnapshot, writeSnapshot } from "@/lib/offline-store";

export type InboxEvent = {
  id: string;
  type: 'CALL' | 'SMS' | 'WHATSAPP';
  direction: string;
  status: string;
  from: string;
  to: string;
  timestamp: string;
  duration?: number;
  recordingUrl?: string | null;
  transcriptionText?: string | null;
  aiSummary?: string | null;
  body?: string;
};

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
  status?: string;
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

function UnifiedInboxTimeline({ initialEvents }: { initialEvents: InboxEvent[] }) {
  const eventDetail = useMobileDetail("event");
  const selectedEventId = eventDetail.selected;
  const setSelectedEventId = eventDetail.open;

  const selectedEvent = initialEvents.find(e => e.id === selectedEventId);

  const getEventIcon = (event: InboxEvent) => {
    if (event.type === 'WHATSAPP') return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    if (event.type === 'SMS') return <MessageSquare className="w-4 h-4 text-blue-400" />;
    if (event.type === 'CALL') {
      if (event.status === 'VOICEMAIL') return <Voicemail className="w-4 h-4 text-violet-400" />;
      if (event.status === 'NO_ANSWER' || event.status === 'MISSED') return <PhoneMissed className="w-4 h-4 text-rose-400" />;
      return <Phone className="w-4 h-4 text-emerald-400" />;
    }
    return <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />;
  };

  const getEventPreview = (event: InboxEvent) => {
    if (event.type === 'SMS' || event.type === 'WHATSAPP') return event.body ? event.body.substring(0, 50) + (event.body.length > 50 ? '...' : '') : 'Message vide';
    if (event.type === 'CALL') {
      if (event.aiSummary) return event.aiSummary.substring(0, 50) + '...';
      if (event.status === 'VOICEMAIL') return 'Nouveau message vocal';
      if (event.status === 'NO_ANSWER' || event.status === 'MISSED') return 'Appel manqué';
      return `Appel terminé (${event.duration || 0}s)`;
    }
    return '';
  };

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)]">
      {/* Left Pane: List */}
      <div className={`w-full md:w-96 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex-col h-full shrink-0 ${selectedEventId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Boîte de réception</h2>
          <p className="text-sm text-[var(--text-secondary)]">{initialEvents.length} événements</p>
        </div>

        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto custom-scrollbar">
          {initialEvents.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              Aucun message.
            </div>
          ) : (
            initialEvents.map(event => (
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
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      <div className={`min-w-0 flex-1 bg-[var(--bg-base)] flex-col h-full ${selectedEventId ? "flex" : "hidden md:flex"}`}>
        {selectedEvent ? (
          <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="p-3 md:p-6 border-b border-[var(--border-subtle)] flex flex-wrap gap-2 items-center justify-between bg-[var(--bg-surface-solid)]">
              <button onClick={eventDetail.close} aria-label="Retour aux messages" className="md:hidden min-h-11 min-w-11 grid place-items-center rounded-xl hover:bg-[var(--bg-surface-hover)]"><ArrowLeft className="h-5 w-5" /></button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                   <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-2xl break-all font-bold font-mono tracking-tight text-[var(--text-primary)]">
                    {selectedEvent.direction === 'INBOUND' ? selectedEvent.from : selectedEvent.to}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(selectedEvent.timestamp).toLocaleString()}
                    </span>
                    <span>—</span>
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
            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-6 md:p-10 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                {/* SMS View */}
                {(selectedEvent.type === 'SMS' || selectedEvent.type === 'WHATSAPP') && (
                  <Card className="p-8 relative">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                      {selectedEvent.type === 'WHATSAPP' ? 'Message WhatsApp' : 'Message Texte'}
                    </h4>
                    <p className="text-xl leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                      {selectedEvent.body}
                    </p>
                  </Card>
                )}

                {/* Call View */}
                {selectedEvent.type === 'CALL' && (
                  <div className="space-y-8">
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

                    <div className="flex gap-4">
                      {selectedEvent.duration !== undefined && selectedEvent.duration > 0 && (
                        <Card className="px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
                          <span className="text-sm text-[var(--text-secondary)] mb-1">Durée</span>
                          <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                            {Math.floor(selectedEvent.duration / 60)}:{(selectedEvent.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </Card>
                      )}
                      <Card className="px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-[var(--text-secondary)] mb-1">Statut</span>
                        <span className="text-lg font-bold text-[var(--text-primary)]">
                          {selectedEvent.status}
                        </span>
                      </Card>
                    </div>

                    {selectedEvent.status === 'VOICEMAIL' && (
                      <Card className="p-4">
                        {selectedEvent.recordingUrl
                          ? <audio controls preload="none" src={selectedEvent.recordingUrl} className="w-full" aria-label="Message vocal" />
                          : <p className="text-sm text-[var(--text-secondary)]">Enregistrement indisponible.</p>}
                      </Card>
                    )}

                    {selectedEvent.transcriptionText && (
                      <Card className="p-8">
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-6 uppercase tracking-wider">
                          Transcription complète
                        </h4>
                        <div className="space-y-4">
                          {selectedEvent.transcriptionText.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            const isAgent = line.startsWith('Agent:') || line.startsWith('Buster Call:');
                            return (
                              <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${isAgent ? 'bg-cyan-500/10 border border-cyan-500/20 text-[var(--text-primary)]' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)]'}`}>
                                  <span className="text-xs font-bold uppercase mb-1 block opacity-50">
                                    {isAgent ? 'Agent IA' : 'Client'}
                                  </span>
                                  <p className="leading-relaxed">{line.replace(/^(Agent|Client|Buster Call):\s*/, '')}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
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
            <button onClick={eventDetail.close} className="md:hidden min-h-11 mt-4 text-[var(--brand)]">Retour aux messages</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxClient({ organizationId, userId, initialEvents }: { organizationId?: string, userId?: string, initialEvents?: InboxEvent[] }) {
  const [contacts, setContacts] = useState<ContactPreview[]>([]);
  const detail = useMobileDetail("contact");
  const selectedContactId = detail.selected;
  const setSelectedContactId = detail.open;
  const online = useOnline();
  const scope = organizationId && userId ? organizationId + ":" + userId : "";
  const [error, setError] = useState("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const revoked = useRef(false);
  const selectedRef = useRef(selectedContactId);
  useEffect(() => { selectedRef.current = selectedContactId; }, [selectedContactId]);
  const draftStorageKey = scope && selectedContactId ? draftKey(scope, selectedContactId, "shared") : "";
  const draftRef = useRef("");
  const updateDraft = (text: string) => {
    draftRef.current = text;
    setInputText(text);
    if (!draftStorageKey) return;
    try {
      if (text) localStorage.setItem(draftStorageKey, text);
      else localStorage.removeItem(draftStorageKey);
    } catch { setError("Stockage local indisponible : gardez cette page ouverte pour conserver votre brouillon."); }
  };
  useEffect(() => {
    let text = "";
    try { text = draftStorageKey ? localStorage.getItem(draftStorageKey) || "" : ""; } catch {}
    draftRef.current = text;
    setInputText(text);
    setError("");
  }, [draftStorageKey]);
  const [messages, setMessages] = useState<OmnichannelMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [channelChoice, setChannelChoice] = useState<{ contactId: string | null; channel: string }>({ contactId: null, channel: "WHATSAPP" });
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedContact = useRef<string | null>(null);

  // New conversation modal state
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [allContacts, setAllContacts] = useState<AllContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedChannel = channelChoice.contactId === selectedContactId ? channelChoice.channel : selectedContact?.lastMessage?.type === "SMS" ? "SMS" : "WHATSAPP";
  const setSelectedChannel = (channel: string) => setChannelChoice({ contactId: selectedContactId, channel });

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.name || c.phone).toLowerCase().includes(q) || c.phone.includes(q);
  });

  useEffect(() => {
    function clear() {
      revoked.current = true;
      setContacts([]); setMessages([]); setInputText(""); draftRef.current = "";
      setError("Session terminée. Reconnectez-vous pour consulter vos discussions.");
    }
    function storage(event: StorageEvent) {
      if (event.key === "antigravity-storage-owner" && event.newValue !== scope) clear();
    }
    window.addEventListener("antigravity-private-cleared", clear);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("antigravity-private-cleared", clear);
      window.removeEventListener("storage", storage);
    };
  }, [scope]);
  // Resume without reloading the page or interrupting a draft/call.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") setRefreshVersion(v => v + 1); };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    if (initialEvents) return;
    const controller = new AbortController();
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/inbox/contacts", { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(res.status === 401 ? "Session expirée. Reconnectez-vous." : "Impossible de charger les discussions.");
        const data = await res.json();
        if (!cancelled && !revoked.current && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
          void writeSnapshot(scope, "contacts", data.contacts.slice(0, 100));
        }
      } catch (err) {
        if (cancelled || revoked.current) return;
        const cached = await readSnapshot<ContactPreview[]>(scope, "contacts");
        if (cancelled || revoked.current) return;
        if (cached && !navigator.onLine) { setContacts(cached.value); setCachedAt(cached.savedAt); }
        else setError(err instanceof Error ? err.message : "Impossible de charger les discussions.");
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [scope, initialEvents, refreshVersion]);

  useEffect(() => {
    if (!selectedContactId || initialEvents) return;
    const controller = new AbortController();
    let cancelled = false;
    if (loadedContact.current !== selectedContactId) setMessages([]);
    loadedContact.current = selectedContactId;
    setCachedAt(null);
    setIsLoadingMessages(true);
    async function load() {
      try {
        const res = await fetch("/api/inbox/messages?contactId=" + encodeURIComponent(selectedContactId!), { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(res.status === 401 ? "Session expirée. Reconnectez-vous." : "Impossible de charger cette conversation.");
        const data = await res.json();
        if (!cancelled && !revoked.current && Array.isArray(data.messages)) {
          setMessages(data.messages);
          requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ block: "nearest" }));
          void writeSnapshot(scope, "messages:" + selectedContactId, data.messages.slice(-100));
        }
      } catch (err) {
        if (cancelled || revoked.current) return;
        const cached = await readSnapshot<OmnichannelMessage[]>(scope, "messages:" + selectedContactId);
        if (cancelled || revoked.current) return;
        if (cached && !navigator.onLine) { setMessages(cached.value); setCachedAt(cached.savedAt); }
        else setError(err instanceof Error ? err.message : "Impossible de charger cette conversation.");
      } finally { if (!cancelled) setIsLoadingMessages(false); }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [selectedContactId, scope, initialEvents, refreshVersion]);

  // Real-time Pusher setup
  useEffect(() => {
    if (!organizationId || initialEvents || !process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    let disposed = false;
    let pusher: PusherClient | undefined;
    let channel: Channel | undefined;

    import('pusher-js').then((PusherModule) => {
      if (disposed) return;
      const Pusher = PusherModule.default;
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });

      channel = pusher.subscribe(`org-${organizationId}`);

      channel.bind('new-message', (data: OmnichannelMessage & { contactId: string }) => {
        if (revoked.current) return;
        if (data.contactId === selectedRef.current) {
          setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
          setTimeout(scrollToBottom, 100);
        }
        fetch('/api/inbox/contacts')
          .then(res => res.json())
          .then(resData => {
            if (!disposed && !revoked.current && resData.contacts) setContacts(resData.contacts);
          }).catch(() => { /* Refreshed when connectivity returns. */ });
      });

      channel.bind('contact-updated', (data: { contactId: string; botMode: boolean; escalationStatus: string }) => {
        if (revoked.current) return;
        setContacts(prev => prev.map(c =>
          c.id === data.contactId
            ? { ...c, botMode: data.botMode, escalationStatus: data.escalationStatus }
            : c
        ));
      });
    }).catch(() => {
      if (!disposed) setError("La connexion en direct est indisponible. Actualisez pour retrouver les derniers messages.");
    });

    return () => {
      disposed = true;
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, [organizationId, initialEvents]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContactId || isSending || !online || selectedContact?.botMode) return;
    const contactId = selectedContactId;
    const textToSend = inputText;
    const storageKey = draftStorageKey;
    const pendingId = "pending:" + crypto.randomUUID();
    setMessages(previous => [...previous, {
      id: pendingId, body: textToSend, type: selectedChannel,
      direction: "OUTBOUND", sentAt: new Date().toISOString(), status: "SENDING"
    }]);
    setIsSending(true);
    setError("");
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, body: textToSend, type: selectedChannel })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Envoi non confirmé. Vérifiez la conversation avant de réessayer.");
      }
      // Do not erase new text typed while the request was in flight.
      try { if (storageKey && localStorage.getItem(storageKey) === textToSend) localStorage.removeItem(storageKey); } catch {}
      if (!revoked.current && selectedRef.current === contactId) {
        setMessages(previous => previous.map(message => message.id === pendingId ? { ...message, status: "ACCEPTED" } : message));
        if (draftRef.current === textToSend) { draftRef.current = ""; setInputText(""); }
        setRefreshVersion(v => v + 1);
      }
    } catch (err) {
      if (!revoked.current && selectedRef.current === contactId) {
        setMessages(previous => previous.filter(message => message.id !== pendingId));
        setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "Envoi non confirmé. Votre brouillon est conservé ; vérifiez la conversation avant de réessayer.");
      }
    } finally { setIsSending(false); }
  };

  const handleTakeover = async (botMode: boolean, escalationStatus: string) => {
    if (!selectedContactId) return;
    try {
      const response = await fetch('/api/inbox/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContactId, botMode, escalationStatus })
      });
      if (!response.ok) throw new Error("Impossible de modifier la prise en charge.");
      setContacts(prev => prev.map(c =>
        c.id === selectedContactId ? { ...c, botMode, escalationStatus } : c
      ));
    } catch(e) { setError(e instanceof Error ? e.message : "Action impossible."); }
  };

  const openNewConversationModal = async () => {
    setShowNewConvModal(true);
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error("Impossible de charger les contacts.");
      const data = await res.json();
      const list = data.contacts || data;
      setAllContacts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les contacts.");
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
      default: return 'bg-cyan-600 text-white rounded-br-none';
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

  // Historique unifié (appels + SMS) fourni côté serveur
  if (initialEvents) {
    return <UnifiedInboxTimeline initialEvents={initialEvents} />;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[var(--bg-base)]">
      {(!online || cachedAt) && <div role="status" className="flex shrink-0 items-center gap-2 px-4 py-2 text-xs bg-[var(--bg-surface)] text-[var(--warning)]"><WifiOff className="h-4 w-4 shrink-0" />{!online ? "Hors connexion · votre brouillon reste sur cet appareil." : "Données enregistrées"}{cachedAt ? " · " + new Date(cachedAt).toLocaleString("fr-FR") : ""}</div>}
      {error && <div role="alert" className="flex shrink-0 items-center justify-between gap-2 px-4 py-2 text-sm bg-[var(--bg-surface)] text-[var(--danger)]"><span>{error}</span><button onClick={() => { setError(""); setRefreshVersion(v => v + 1); }} className="min-h-11 shrink-0 underline">Actualiser</button></div>}
      <div className="flex flex-1 min-h-0 w-full">
      {/* LEFT PANE: Contacts List */}
      <div className={`w-full md:w-80 border-r border-[var(--border-subtle)] flex-col h-full bg-[var(--bg-surface)] shrink-0 ${selectedContactId ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Discussions</h2>
          <Button
            onClick={openNewConversationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 bg-[var(--bg-base)] rounded-xl px-3 py-2 border border-[var(--border-subtle)]">
            <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
            <input
              type="text"
              aria-label="Rechercher une discussion" placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-base md:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto custom-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-10 h-10 text-[var(--text-secondary)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-secondary)] mb-3">Aucune conversation</p>
              <Button
                onClick={openNewConversationModal}
                className="text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Démarrer une conversation
              </Button>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full text-left p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors flex gap-3 ${selectedContactId === contact.id ? 'bg-[var(--bg-surface-hover)] border-l-2 border-l-[var(--accent-primary)]' : 'border-l-2 border-l-transparent'}`}
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
                      <span className="text-xs text-[var(--text-secondary)] shrink-0 ml-2">
                        {new Date(contact.lastMessage.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {contact.lastMessage?.body || "Nouvelle conversation"}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    {contact.botMode ? (
                      <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        <Bot className="w-2.5 h-2.5" /> IA
                      </span>
                    ) : (
                      <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Humain
                      </span>
                    )}
                    {contact.escalationStatus === 'REQUESTED' && (
                      <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 flex items-center gap-1">
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
      <div className={`min-w-0 flex-1 flex-col h-full bg-[var(--bg-base)] relative ${selectedContactId ? "flex" : "hidden md:flex"}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap gap-2 items-center justify-between z-10">
              <div className="flex flex-1 min-w-0 items-center gap-2">
                <button onClick={detail.close} aria-label="Retour aux discussions" className="md:hidden min-h-11 min-w-11 grid place-items-center rounded-xl text-[var(--brand)]"><ArrowLeft className="h-5 w-5" /></button>
                <div className="hidden md:flex w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-[var(--border-subtle)] flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate text-[var(--text-primary)]">{selectedContact.name}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedContact.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedContact.botMode ? (
                  <button
                    onClick={() => handleTakeover(false, selectedContact.escalationStatus === 'REQUESTED' ? 'RESOLVED' : selectedContact.escalationStatus)}
                    className="min-h-11 text-xs md:text-sm font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /><span className="hidden md:inline">Reprendre la main</span><span className="md:hidden">Répondre</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTakeover(true, 'NONE')}
                    className="min-h-11 text-xs md:text-sm font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" /><span className="hidden md:inline">Confier à l’IA</span><span className="md:hidden">Activer IA</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isLoadingMessages && messages.length === 0 ? (
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
<div className="p-2 bg-cyan-500/20 rounded-full">
  <PhoneCall className="w-4 h-4 text-cyan-500" />
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
                        <span className="text-xs text-[var(--text-secondary)] mt-1 px-1">
                          {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[88%] md:max-w-[75%] rounded-2xl px-4 py-3 ${getChannelColor(msg.type, isOutbound)}`}>
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-base md:text-sm">{msg.body}</p>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] mt-1 px-1 flex items-center gap-1">
                        {isOutbound && getChannelIcon(msg.type)}
                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {!isOutbound && getChannelIcon(msg.type)}
                        {isOutbound && msg.status && <span>{({
                          SENDING: "Envoi…", ACCEPTED: "Pris en charge", QUEUED: "En attente",
                          SENT: "Envoyé", DELIVERED: "Distribué", READ: "Lu", FAILED: "Échec"
                        } as Record<string, string>)[msg.status.toUpperCase()] || msg.status}</span>}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input — ALWAYS VISIBLE */}
            <div className="p-3 md:p-4 shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {selectedContact.botMode && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-400">L'Agent IA gère cette conversation. Cliquez sur "Reprendre la main" pour écrire.</p>
                </div>
              )}

              {/* Channel selector */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
                <button onClick={() => setSelectedChannel('WHATSAPP')} aria-pressed={selectedChannel === 'WHATSAPP'} className={`min-h-11 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'WHATSAPP' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </button>
                <button onClick={() => setSelectedChannel('SMS')} aria-pressed={selectedChannel === 'SMS'} className={`min-h-11 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium ${selectedChannel === 'SMS' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'}`}>
                  <MessageSquare className="w-3 h-3" /> SMS
                </button>


              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={inputText}
                  onChange={e => updateDraft(e.target.value)}
                  disabled={selectedContact.botMode}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(min-width: 768px)').matches) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  aria-label="Votre message"
                  placeholder={selectedContact.botMode ? "Reprenez la main pour écrire..." : "Écrivez un message (Entrée pour envoyer)..."}
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] resize-none min-h-[48px] max-h-[120px] focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-base md:text-sm placeholder:text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  aria-label="Envoyer le message"
                  disabled={!online || !inputText.trim() || selectedContact.botMode || isSending}
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
              <button onClick={detail.close} className="md:hidden min-h-11 text-[var(--brand)]">Retour aux discussions</button>
              <p className="text-sm mb-4">Sélectionnez une conversation ou démarrez-en une nouvelle</p>
              <Button
                onClick={openNewConversationModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" /> Nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Context & AI Summary */}
      <div className="hidden lg:flex w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col h-full shrink-0">
        {selectedContact ? (
          <>
            <div className="p-5 border-b border-[var(--border-subtle)] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full mx-auto flex items-center justify-center border border-cyan-500/30 mb-3">
                <User className="w-6 h-6 text-[var(--text-secondary)]" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">{selectedContact.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedContact.phone}</p>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Résumé IA
                </h4>
                <Card className="p-3 text-xs text-[var(--text-secondary)] leading-relaxed rounded-xl border border-[var(--border-subtle)]">
                  {selectedContact.aiSummary || "L'IA n'a pas encore généré de résumé pour ce contact."}
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-xs px-6 text-center">
            Les informations du contact s'afficheront ici
          </div>
        )}
      </div>

      </div>
      {/* NEW CONVERSATION MODAL */}
      <Modal open={showNewConvModal} onClose={() => { setShowNewConvModal(false); setContactSearch(""); }} title="Nouvelle conversation">
        <div className="p-4">
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-xl px-3 py-2.5 border border-[var(--border-subtle)] mb-3">
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <input
                  type="text"
                  aria-label="Rechercher un contact" placeholder="Rechercher un contact..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  autoFocus
                  className="bg-transparent outline-none text-base md:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"
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
      </Modal>

    </div>
  );
}
