import { prisma } from '@/lib/prisma';

export async function create_support_ticket(organizationId: string, args: { contact_phone: string, title: string, description: string, priority?: string, contact_name?: string }) {
  try {
    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: {
        organizationId_phone: {
          organizationId: organizationId,
          phone: args.contact_phone
        }
      }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: organizationId,
          phone: args.contact_phone,
          name: args.contact_name || "Client Support"
        }
      });
    }

    const priority = args.priority || "NORMAL";

    const ticket = await prisma.ticket.create({
      data: {
        organizationId: organizationId,
        contactId: contact.id,
        title: args.title,
        description: args.description,
        priority: priority,
        status: "OPEN"
      }
    });

    console.log(`[Support] Ticket generated: ${ticket.id} (${priority})`);

    return { 
      success: true, 
      message: `Le ticket de support intitulé '${args.title}' a bien été créé avec la priorité ${priority}. Un technicien ou conseiller reviendra vers le client très prochainement.`,
      ticket_id: ticket.id
    };

  } catch (error: any) {
    console.error("[Support] create_support_ticket error:", error);
    return { error: error.message };
  }
}
