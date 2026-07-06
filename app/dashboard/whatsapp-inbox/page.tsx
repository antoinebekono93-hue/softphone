import { prisma } from "@/lib/prisma";
import WhatsAppInboxClient from "./WhatsAppInboxClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "WhatsApp Inbox | Antigravity",
};

export default async function WhatsAppInboxPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  try {
    // Fetch Omnichannel Messages
    const sms = await prisma.smsMessage.findMany({
      where: { 
        organizationId: orgId,
        type: { in: ['WHATSAPP', 'INSTAGRAM', 'EMAIL'] } 
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
    });

    const unifiedEvents = sms.map(s => ({
        id: s.id,
        type: s.type,
        direction: s.direction,
        status: s.status,
        from: s.fromNumber,
        to: s.toNumber,
        timestamp: s.sentAt.toISOString(),
        body: s.body,
        mediaUrls: s.mediaUrls,
        contactId: s.contactId
    }));

    // Fetch contacts to get their assignment status and AI Summary
    const contacts = await prisma.contact.findMany({
      where: { organizationId: orgId },
      select: { id: true, phone: true, name: true, assignedUserId: true, aiSummary: true }
    });

    // Fetch team members
    const teamMembers = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true }
    });

    return (
      <div className="h-full w-full flex overflow-hidden bg-[var(--bg-base)]">
        <WhatsAppInboxClient 
          initialEvents={unifiedEvents} 
          contacts={contacts}
          teamMembers={teamMembers}
          currentUserId={session.user.id}
        />
      </div>
    );
  } catch (error: any) {
    console.error("Inbox rendering error:", error);
    return (
      <div className="p-8 text-rose-500">
        <h2 className="text-xl font-bold mb-4">Erreur de chargement WhatsApp</h2>
        <pre className="bg-rose-500/10 p-4 rounded-lg whitespace-pre-wrap">{error.message || String(error)}</pre>
      </div>
    );
  }
}
