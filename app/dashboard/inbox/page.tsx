import { prisma } from "@/lib/prisma";
import InboxClient from "./InboxClient";

export const metadata = {
  title: "Boîte de réception | Antigravity",
};

export default async function InboxPage() {
  // 1. Fetch Call Logs
  const calls = await prisma.callLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  // 2. Fetch SMS Messages
  const sms = await prisma.smsMessage.findMany({
    orderBy: { sentAt: 'desc' },
    take: 50,
  });

  // 3. Format into a unified Event interface
  const unifiedEvents = [
    ...calls.map(c => ({
      id: c.id,
      type: 'CALL' as const,
      direction: c.direction,
      status: c.status,
      from: c.fromNumber,
      to: c.toNumber,
      timestamp: c.startedAt.toISOString(),
      duration: c.duration,
      recordingUrl: c.recordingUrl,
      transcriptionText: c.transcriptionText,
      aiSummary: c.aiSummary,
    })),
    ...sms.map(s => ({
      id: s.id,
      type: 'SMS' as const,
      direction: s.direction,
      status: s.status,
      from: s.fromNumber,
      to: s.toNumber,
      timestamp: s.sentAt.toISOString(),
      body: s.body,
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="h-full w-full flex overflow-hidden bg-[var(--bg-base)]">
      <InboxClient initialEvents={unifiedEvents} />
    </div>
  );
}
