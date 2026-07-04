import { prisma } from "@/lib/prisma";
import InboxClient from "../inbox/InboxClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Boîte de réception | Antigravity",
};

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  try {
    // 1. Fetch Call Logs
    const calls = await prisma.callLog.findMany({
      where: { organizationId: orgId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    // 2. Fetch SMS Messages
    const sms = await prisma.smsMessage.findMany({
      where: { organizationId: orgId },
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
  } catch (error: any) {
    console.error("Inbox rendering error:", error);
    return (
      <div className="p-8 text-rose-500">
        <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
        <pre className="bg-rose-500/10 p-4 rounded-lg whitespace-pre-wrap">{error.message || String(error)}</pre>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Veuillez m'envoyer une capture de cette erreur pour que je puisse la corriger !</p>
      </div>
    );
  }
}
