import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { debitWalletAtomically } from '@/lib/billing';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, templateName, templateLanguage, components, text } = body;

    if (!to) {
      return NextResponse.json({ error: 'Destination number (to) is required' }, { status: 400 });
    }

    // Get the configured WhatsApp number for this organization
    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    // In a real scenario, the from number should be the verified WhatsApp number of the organization.
    // If not saved in DB yet, we would fetch it from Telnyx. Assuming it's in the DB.
    if (!account?.phoneNumber) {
      return NextResponse.json({ error: 'No active WhatsApp phone number found for this organization. Please complete Meta registration.' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });

    if (!organization || organization.walletBalance.toNumber() <= 0) {
      return NextResponse.json({ error: 'Fonds insuffisants. Veuillez recharger votre portefeuille pour envoyer des messages WhatsApp.' }, { status: 402 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    
    let whatsapp_message: any = {};
    if (templateName) {
      whatsapp_message = {
        type: 'template',
        template: {
          name: templateName,
          language: {
            policy: 'deterministic',
            code: templateLanguage || 'en_US'
          },
          components: components || []
        }
      };
    } else if (text) {
      whatsapp_message = {
        type: 'text',
        text: {
          body: text,
          preview_url: false
        }
      };
    } else {
      return NextResponse.json({ error: 'Either templateName or text is required' }, { status: 400 });
    }

    const response = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: account.phoneNumber,
        to,
        whatsapp_message
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Send WhatsApp Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to send WhatsApp message' }, { status: response.status });
    }

    const data = await response.json();
    const telnyxMessageId = data.data?.id || `wa_${Date.now()}`;

    // Try to find if this 'to' number exists as a contact
    const contact = await prisma.contact.findFirst({
      where: {
        organizationId: session.user.organizationId,
        phone: to
      }
    });

    // Log the outbound message in the DB
    await prisma.smsMessage.create({
      data: {
        telnyxMessageId,
        direction: 'OUTBOUND',
        body: text || `[Template] ${templateName}`,
        status: 'SENT',
        type: 'WHATSAPP',
        fromNumber: account.phoneNumber,
        toNumber: to,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        contactId: contact?.id
      }
    });

    // Deduct cost (mock logic) — ATOMIQUE avec garde de solde (jamais négatif).
    // Fast-fail déclenché plus haut si solde <= 0 ; la garantie réelle est ici.
    try {
      await prisma.$transaction(async (tx) => {
        const debited = await debitWalletAtomically(tx, session.user.organizationId!, 0.05);
        if (!debited) {
          throw new Error("INSUFFICIENT_FUNDS");
        }
        await tx.walletTransaction.create({
          data: {
            organizationId: session.user.organizationId!,
            amount: -0.05,
            type: "WHATSAPP_SEND",
            description: "Envoi de message WhatsApp (coût unitaire)",
          },
        });
      });
    } catch (debitErr: unknown) {
      // Le message a déjà été délivré par Telnyx ; on ne peut pas le retirer.
      // On journalise l'échec sans jamais laisser le wallet passer en négatif.
      const msg = debitErr instanceof Error ? debitErr.message : String(debitErr);
      console.error('[Send WhatsApp] Debit failed (message déjà envoyé)', msg);
    }

    return NextResponse.json({ success: true, data: data.data }, { status: 201 });
  } catch (error: any) {
    console.error('[Send WhatsApp Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
