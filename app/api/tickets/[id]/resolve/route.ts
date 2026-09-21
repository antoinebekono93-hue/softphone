import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { executeAutomation } from "@/lib/automations";
import { sendWhatsAppForOrganization } from "@/lib/whatsapp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ticketId = resolvedParams.id;

    // Récupérer le ticket et le contact associé
    const ticket = await prisma.ticket.findUnique({
      where: { 
        id: ticketId,
        organizationId: session.user.organizationId 
      },
      include: { contact: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Mettre à jour le statut du ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date()
      }
    });

    // Mettre le contact en attente de CSAT
    await prisma.contact.update({
      where: { id: ticket.contactId },
      data: { waitingForCsatTicketId: ticket.id }
    });

    if (ticket.contact.phone) {
      const messageBody = `Votre demande concernant "${ticket.title}" a été résolue. Sur une échelle de 1 à 5 (1 = Très insatisfait, 5 = Très satisfait), comment évaluez-vous notre service ? (Répondez simplement par un chiffre).`;
      await sendWhatsAppForOrganization({ organizationId: session.user.organizationId, userId: session.user.id, to: ticket.contact.phone, content: { type: 'text', text: { body: messageBody, preview_url: false } }, agentMessage: true });
    }

    // --- GENERIC AUTOMATION BRIDGE ---
    if (ticket.contact) {
      await executeAutomation(session.user.organizationId, 'TICKET_RESOLVED', { contact: ticket.contact });
    }

    return NextResponse.json({ success: true, message: "Ticket résolu et demande CSAT envoyée." });
  } catch (error) {
    console.error("[TICKET_RESOLVE_ERROR]", error);
    return NextResponse.json({ error: "Erreur interne serveur" }, { status: 500 });
  }
}
