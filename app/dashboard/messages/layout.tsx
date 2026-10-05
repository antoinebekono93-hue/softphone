"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SidebarClient } from "./SidebarClient";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // A conversation lives at /dashboard/messages/<number>. On mobile the list and
  // the conversation are two full-screen states instead of two side-by-side
  // columns, so Back (button or browser) returns to the list.
  const conversationOpen = /^\/dashboard\/messages\/.+/.test(pathname);
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--apple-bg-primary)]">
      {/* Left Sidebar for Conversations */}
      <div className={`w-full md:w-80 shrink-0 border-r border-[var(--apple-border)] flex-col bg-[var(--apple-surface)]/50 ${conversationOpen ? "hidden md:flex" : "flex"}`}>
        <SidebarClient />
      </div>

      {/* Main Chat Area */}
      <div className={`min-w-0 flex-1 flex-col relative ${conversationOpen ? "flex" : "hidden md:flex"}`}>
        {conversationOpen && (
          <div className="md:hidden shrink-0 border-b border-[var(--apple-border)]">
            <Link href="/dashboard/messages" aria-label="Retour aux conversations" className="flex items-center gap-2 min-h-11 px-3 text-[var(--apple-text-primary)]">
              <ArrowLeft className="h-5 w-5" /> Conversations
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}