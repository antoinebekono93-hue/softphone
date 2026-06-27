"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendSms } from "../actions";
import { Send, Phone, User, Loader2 } from "lucide-react";

export function ChatClient({ contactNumber }: { contactNumber: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [ourNumber, setOurNumber] = useState("");
  const [contact, setContact] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMsgs = async () => {
    const data = await getMessages(contactNumber);
    setMessages(data.messages);
    setOurNumber(data.ourNumber);
    setContact(data.contact);
  };

  useEffect(() => {
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [contactNumber]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !ourNumber) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic UI update
    const tempMsg = {
      id: Date.now().toString(),
      body: textToSend,
      direction: 'OUTBOUND',
      sentAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    await sendSms(contactNumber, ourNumber, textToSend);
    await fetchMsgs();
    setIsSending(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--apple-bg-primary)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--apple-border)] flex items-center px-6 bg-[var(--apple-surface)]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--apple-surface-hover)] flex items-center justify-center text-[var(--apple-text-secondary)]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight text-[15px]">
              {contact ? (contact.name || contact.company || contactNumber) : contactNumber}
            </h2>
            {contact && <p className="text-xs text-[var(--apple-text-secondary)]">{contactNumber}</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOutbound = msg.direction === 'OUTBOUND';
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                isOutbound 
                  ? 'bg-cyan-600 text-white rounded-br-sm' 
                  : 'bg-[var(--apple-surface)] text-[var(--apple-text-primary)] border border-[var(--apple-border)] rounded-bl-sm'
              }`}>
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[var(--apple-surface)]/80 backdrop-blur-md border-t border-[var(--apple-border)]">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="iMessage..."
              className="w-full bg-[var(--apple-bg-primary)] border border-[var(--apple-border)] rounded-2xl px-4 py-3 text-[15px] focus:outline-none focus:border-cyan-500 transition-colors resize-none overflow-hidden max-h-32 min-h-[44px]"
              rows={1}
              style={{ height: 'auto' }}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim() || isSending || !ourNumber}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-cyan-600 text-white disabled:opacity-50 disabled:bg-[var(--apple-surface-hover)] disabled:text-[var(--apple-text-secondary)] transition-colors shrink-0 mb-0.5"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
