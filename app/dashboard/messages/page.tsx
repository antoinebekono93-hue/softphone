import { MessageSquare } from "lucide-react";

export default function MessagesDefaultPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 h-full bg-[var(--apple-bg-primary)]">
      <div className="w-16 h-16 rounded-full bg-[var(--apple-surface-hover)] flex items-center justify-center text-[var(--apple-text-secondary)] mb-4">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-medium tracking-tight mb-2">Your Messages</h2>
      <p className="text-[var(--apple-text-secondary)] text-sm max-w-sm text-center">
        Select a conversation from the sidebar to start messaging, or create a new message.
      </p>
    </div>
  );
}
