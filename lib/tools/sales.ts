import { prisma } from '@/lib/prisma';

export async function generate_quote(organizationId: string, args: { contact_phone: string, amount: number, description: string, contact_name?: string }) {
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
          name: args.contact_name || "Nouveau Client"
        }
      });
    }

    const quote = await prisma.quote.create({
      data: {
        organizationId: organizationId,
        contactId: contact.id,
        amount: args.amount,
        description: args.description,
        status: "SENT" // On considère que l'IA "envoie" le devis
      }
    });

    console.log(`[Sales] Quote generated: ${quote.id} for ${args.amount}€`);

    return { 
      success: true, 
      message: `Le devis de ${args.amount}€ pour '${args.description}' a bien été généré et lié au client ${args.contact_phone}. Dites au client qu'il recevra le devis par email ou SMS très prochainement.`,
      quote_id: quote.id
    };

  } catch (error: any) {
    console.error("[Sales] generate_quote error:", error);
    return { error: error.message };
  }
}

export async function generate_invoice(organizationId: string, args: { contact_phone: string, amount: number, description: string, contact_name?: string }) {
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
          name: args.contact_name || "Nouveau Client"
        }
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: organizationId,
        contactId: contact.id,
        amount: args.amount,
        description: args.description,
        status: "SENT" // L'IA "envoie" la facture
      }
    });

    console.log(`[Sales] Invoice generated: ${invoice.id} for ${args.amount}€`);

    return { 
      success: true, 
      message: `La facture de ${args.amount}€ pour '${args.description}' a bien été générée et liée au client ${args.contact_phone}.`,
      invoice_id: invoice.id
    };

  } catch (error: any) {
    console.error("[Sales] generate_invoice error:", error);
    return { error: error.message };
  }
}
