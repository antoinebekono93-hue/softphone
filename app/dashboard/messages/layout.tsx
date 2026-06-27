import { SidebarClient } from "./SidebarClient";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[var(--apple-bg-primary)]">
      {/* Left Sidebar for Conversations */}
      <div className="w-80 border-r border-[var(--apple-border)] flex flex-col bg-[var(--apple-surface)]/50">
        <SidebarClient />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {children}
      </div>
    </div>
  );
}
