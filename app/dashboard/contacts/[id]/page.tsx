import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building, FileText, User } from "lucide-react";
import InboxClient from "../../inbox/InboxClient";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  if (!user?.organizationId) {
    return <div>Aucune organisation trouvée.</div>;
  }

  const contact = await prisma.contact.findUnique({
    where: {
      id,
      organizationId: user.organizationId
    },
    include: {
      callLogs: {
        orderBy: { startedAt: 'desc' }
      },
      smsMessages: {
        orderBy: { sentAt: 'desc' }
      }
    }
  });

  if (!contact) {
    notFound();
  }

  // Unify and format events for the InboxClient
  const unifiedEvents = [
    ...contact.callLogs.map(c => ({
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
    ...contact.smsMessages.map(s => ({
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/dashboard/contacts" className="p-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{contact.name || contact.phone}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Fiche Contact</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        {/* Left pane: Contact Info (30%) */}
        <div className="w-full md:w-1/3 xl:w-1/4 glass-panel p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              {contact.name ? <span className="text-3xl font-bold">{contact.name.charAt(0).toUpperCase()}</span> : <User className="w-10 h-10" />}
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{contact.name || 'Inconnu'}</h2>
            {contact.company && <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 justify-center mt-1"><Building className="w-3 h-3" /> {contact.company}</p>}
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Coordonnées</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="p-2 bg-[var(--bg-base)] rounded-lg shrink-0">
                    <Phone className="w-4 h-4 text-[var(--text-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-[var(--text-secondary)]">Téléphone</div>
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{contact.phone}</div>
                  </div>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
                    <div className="p-2 bg-[var(--bg-base)] rounded-lg shrink-0">
                      <Mail className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--text-secondary)]">Email</div>
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{contact.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Notes privées</h3>
              <div className="p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] min-h-[100px]">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap flex gap-2">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                  {contact.notes || <span className="text-[var(--text-secondary)] italic">Aucune note.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Unified History (70%) */}
        <div className="flex-1 glass-panel overflow-hidden border border-[var(--border-subtle)] rounded-2xl">
           {/* We inject the InboxClient component directly here! But we need to isolate it from its global layout padding. */}
           <div className="h-full w-full relative -m-0 p-0 transform scale-100">
             {unifiedEvents.length > 0 ? (
                // Wrapping InboxClient in a div to override its negative margin from its original page
                <div className="[&>div]:m-0 h-full">
                  <InboxClient initialEvents={unifiedEvents} />
                </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-8 text-center">
                 <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center mb-4">
                   <Clock className="w-6 h-6 opacity-50" />
                 </div>
                 <p className="text-lg font-medium text-[var(--text-primary)]">Aucun historique</p>
                 <p className="text-sm mt-1">C'est le début d'une belle relation !</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
