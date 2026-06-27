"use client";

import { useState, useEffect } from "react";
import { getConversations } from "./actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User } from "lucide-react";

export function SidebarClient() {
  const [conversations, setConversations] = useState<any[]>([]);
  const pathname = usePathname();

  const fetchConvos = async () => {
    const data = await getConversations();
    setConversations(data);
  };

  useEffect(() => {
    fetchConvos();
    // Polling every 5 seconds
    const interval = setInterval(fetchConvos, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="p-4 border-b border-[var(--apple-border)]">
        <h2 className="text-xl font-bold tracking-tight">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--apple-text-secondary)]">
            No messages yet.
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = pathname === `/dashboard/messages/${encodeURIComponent(c.contactNumber)}`;
            return (
              <Link 
                key={c.contactNumber} 
                href={`/dashboard/messages/${encodeURIComponent(c.contactNumber)}`}
                className={`block p-4 border-b border-[var(--apple-border)] hover:bg-[var(--apple-surface-hover)] transition-colors ${isActive ? 'bg-[var(--apple-surface-hover)]' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-[15px] truncate pr-2">
                    {c.contact ? (
                      <span className="flex items-center gap-1.5">
                        {c.contact.name || c.contact.company || c.contactNumber}
                      </span>
                    ) : c.contactNumber}
                  </div>
                  <div className="text-xs text-[var(--apple-text-secondary)] whitespace-nowrap">
                    {formatTime(c.latestMessage.sentAt)}
                  </div>
                </div>
                <div className="text-sm text-[var(--apple-text-secondary)] truncate">
                  {c.latestMessage.direction === 'OUTBOUND' && <span className="opacity-60">You: </span>}
                  {c.latestMessage.body}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
