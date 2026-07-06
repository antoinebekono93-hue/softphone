"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, User, CheckCircle2, AlertCircle, Clock, Bot, UserPlus, XCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export type WhatsAppEvent = {
  id: string;
  type: 'WHATSAPP';
  direction: string;
  status: string;
  from: string;
  to: string;
  timestamp: string;
  body?: string;
  mediaUrls?: string[];
  contactId?: string | null;
};

export default function WhatsAppInboxClient({ 
  initialEvents,
  contacts = [],
  teamMembers = [],
  currentUserId
}: { 
  initialEvents: WhatsAppEvent[],
  contacts?: any[],
  teamMembers?: any[],
  currentUserId?: string
}) {
  const [events, setEvents] = useState<WhatsAppEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEvents.length > 0 ? initialEvents[0].id : null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Create a local map of contact assignments
  const [contactAssignments, setContactAssignments] = useState<Record<string, string | null>>(
    contacts.reduce((acc, c) => ({ ...acc, [c.id]: c.assignedUserId }), {})
  );

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [contactSummaries, setContactSummaries] = useState<Record<string, string | null>>(
    contacts.reduce((acc, c) => ({ ...acc, [c.id]: c.aiSummary }), {})
  );

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const conversations = events.reduce((acc, event) => {
    const counterparty = event.direction === 'INBOUND' ? event.from : event.to;
    if (!acc[counterparty]) {
      acc[counterparty] = [];
    }
    acc[counterparty].push(event);
    return acc;
  }, {} as Record<string, WhatsAppEvent[]>);

  const sortedConversations = Object.entries(conversations).sort((a, b) => {
    const lastA = a[1][0].timestamp; 
    const lastB = b[1][0].timestamp;
    return new Date(lastB).getTime() - new Date(lastA).getTime();
  });

  const selectedConversation = sortedConversations.find(c => c[1].some(e => e.id === selectedEventId));
  const contactNumber = selectedConversation ? selectedConversation[0] : null;
  const conversationEvents = selectedConversation ? selectedConversation[1].slice().reverse() : []; 
  
  const currentContactId = conversationEvents.find(e => e.contactId)?.contactId;
  const currentAssignedUserId = currentContactId ? contactAssignments[currentContactId] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedEventId, events]);

  const handleAssign = async (userId: string | null) => {
    if (!currentContactId) return;
    setIsAssigning(true);
    try {
      const res = await fetch('/api/whatsapp/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: currentContactId, assignedUserId: userId })
      });
      if (!res.ok) throw new Error("Erreur lors de l'assignation");
      
      setContactAssignments(prev => ({ ...prev, [currentContactId]: userId }));
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!currentContactId) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/whatsapp/messages/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: currentContactId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de résumé");
      
      setContactSummaries(prev => ({ ...prev, [currentContactId]: data.summary }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSendReply = async () => {
    if (!contactNumber || !replyText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactNumber,
          type: 'text',
          text: replyText
        })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      
      const newMessage: WhatsAppEvent = {
        id: data.messageId || Date.now().toString(),
        type: 'WHATSAPP',
        direction: 'OUTBOUND',
        status: 'SENT',
        from: 'Me',
        to: contactNumber,
        timestamp: new Date().toISOString(),
        body: replyText,
        contactId: currentContactId
      };

      setEvents([newMessage, ...events]);
      setReplyText("");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)]">
      {/* Left Pane: Conversation List */}
      <div className="w-full md:w-96 border-r border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-[var(--border-subtle)] bg-emerald-500/10">
          <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
             <MessageSquare className="w-5 h-5" />
             WhatsApp Inbox
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{sortedConversations.length} conversations</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedConversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              Aucun message WhatsApp.
            </div>
          ) : (
            sortedConversations.map(([number, messages]) => {
              const latestMessage = messages[0];
              const isSelected = contactNumber === number;
              const contactId = messages.find(m => m.contactId)?.contactId;
              const assignedUserId = contactId ? contactAssignments[contactId] : null;
              const isHandledByBot = !assignedUserId;

              return (
                <button
                  key={number}
                  onClick={() => setSelectedEventId(latestMessage.id)}
                  className={`w-full text-left p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors flex gap-3 ${isSelected ? 'bg-[var(--bg-surface-hover)] border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className={`mt-1 p-2 rounded-full shrink-0 ${isHandledByBot ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}>
                    {isHandledByBot ? (
                       <Bot className="w-5 h-5 text-indigo-500" />
                    ) : (
                       <User className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[var(--text-primary)] truncate">
                        {number}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap ml-2">
                        {formatTime(latestMessage.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate">
                      {latestMessage.direction === 'OUTBOUND' && 'Vous: '}
                      {latestMessage.body || 'Media'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Pane: Chat Detail */}
      <div className="hidden md:flex flex-1 bg-[#efeae2] flex-col h-full relative dark:bg-[#0b141a]">
        {contactNumber ? (
          <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex items-center justify-between bg-gray-100 dark:bg-[#202c33] shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                   <User className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {contactNumber}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${!currentAssignedUserId ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'}`}>
                      {!currentAssignedUserId ? <><Bot className="w-3 h-3" /> Géré par Bot</> : <><User className="w-3 h-3" /> Géré par Humain</>}
                    </span>
                  </div>
                </div>
              </div>
              
              {currentContactId && (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-800"
                    title="Générer un résumé avec l'IA"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    <span className="hidden lg:inline">Résumé IA</span>
                  </button>
                  <div className="relative flex items-center">
                    <UserPlus className="w-4 h-4 text-gray-500 absolute left-3" />
                    <select
                      value={currentAssignedUserId || ""}
                      onChange={(e) => handleAssign(e.target.value || null)}
                      disabled={isAssigning}
                      className="pl-9 pr-3 py-2 bg-white dark:bg-[#2a3942] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-[#324550] transition-colors shadow-sm"
                    >
                      <option value="">Géré par le Bot</option>
                      {teamMembers.map(tm => (
                         <option key={tm.id} value={tm.id}>{tm.name || tm.email}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0 flex flex-col" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', opacity: 0.9 }}>
               <div className="max-w-4xl mx-auto space-y-4 w-full flex-1">
                  {currentContactId && contactSummaries[currentContactId] && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm mb-6 dark:bg-indigo-900/20 dark:border-indigo-800">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                        <Sparkles className="w-4 h-4" />
                        Résumé IA
                      </h4>
                      <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                        {contactSummaries[currentContactId]}
                      </p>
                    </div>
                  )}
                  {conversationEvents.map(event => {
                    const isOutbound = event.direction === 'OUTBOUND';
                    return (
                      <div key={event.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-lg shadow-sm relative ${isOutbound ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-none'}`}>
                          <p className="leading-relaxed whitespace-pre-wrap pr-12 text-[15px]">{event.body}</p>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 absolute bottom-1 right-2 flex items-center gap-1">
                            {formatTime(event.timestamp)}
                            {isOutbound && (
                              event.status === 'DELIVERED' ? <CheckCircle2 className="w-3 h-3 text-blue-500" /> : <Clock className="w-3 h-3" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
               </div>
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
               <div className="max-w-4xl mx-auto flex items-end gap-2">
                 <textarea
                   className="flex-1 rounded-xl border-none outline-none p-3 resize-none bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white"
                   rows={1}
                   placeholder="Écrivez un message..."
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSendReply();
                     }
                   }}
                 />
                 <button 
                   disabled={!replyText.trim() || isSending}
                   onClick={handleSendReply}
                   className={`p-3 rounded-full flex items-center justify-center transition-colors ${replyText.trim() ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}
                 >
                   <Send className="w-5 h-5 ml-1" />
                 </button>
               </div>
               {!currentAssignedUserId && (
                 <div className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   Attention : Si vous répondez, prenez le relais pour mettre en pause le Bot.
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg">Sélectionnez une conversation WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
