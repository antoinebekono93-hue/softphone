import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const ticketId = params.id;

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

    // Trouver le compte WhatsApp de l'organisation pour envoyer le message
    const waAccount = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (waAccount && ticket.contact.phone) {
      const messageBody = `Votre demande concernant "${ticket.title}" a été résolue. Sur une échelle de 1 à 5 (1 = Très insatisfait, 5 = Très satisfait), comment évaluez-vous notre service ? (Répondez simplement par un chiffre).`;

      // Sauvegarder dans l'historique
      await prisma.smsMessage.create({
        data: {
          telnyxMessageId: "csat-request-" + Date.now(),
          direction: "OUTBOUND",
          body: messageBody,
          status: "DELIVERED",
          type: "WHATSAPP",
          fromNumber: waAccount.phoneNumber,
          toNumber: ticket.contact.phone,
          organizationId: session.user.organizationId,
          contactId: ticket.contact.id,
        }
      });

      // Envoyer via Telnyx
      await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: waAccount.phoneNumber,
          to: ticket.contact.phone,
          whatsapp_message: {
            type: 'text',
            text: { body: messageBody, preview_url: false }
          }
        })
      });
    }

    return NextResponse.json({ success: true, message: "Ticket résolu et demande CSAT envoyée." });
  } catch (error) {
    console.error("[TICKET_RESOLVE_ERROR]", error);
    return NextResponse.json({ error: "Erreur interne serveur" }, { status: 500 });
  }
}
