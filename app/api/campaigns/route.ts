import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * POST /api/campaigns
 *
 * Backend CANONIQUE de création de campagne. Deux contrats acceptés :
 *
 * 1. VOICE (existants, /dashboard/campaigns/create) :
 *    { name, agentPrompt, contacts: [{ name?, phone }] }
 *    → status RUNNING, channel VOICE (traité par le dialer sortant).
 *
 * 2. SMS (/dashboard/sms) :
 *    { message, contactIds: string[], name? }
 *    → status SENDING, channel SMS (traité par le cron campaign-worker).
 *    Seuls les contacts de l'organisation appelante sont acceptés et le numéro
 *    émetteur est le premier numéro ACTIVE de l'organisation.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = session.user.organizationId;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const isSms = Array.isArray(body) === false && typeof body === "object" && body !== null
      && Array.isArray((body as { contactIds?: unknown }).contactIds) === true;

    if (!isSms) {
      // ── Contrat VOICE (hérité) ──────────────────────────────────────────
      const rec = (typeof body === "object" && body !== null ? body : {}) as {
        name?: string;
        agentPrompt?: string;
        contacts?: Array<{ name?: string; phone: string }>;
      };
      const { name, agentPrompt, contacts } = rec;
      if (!name || !contacts || !Array.isArray(contacts)) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
      }

      const campaign = await prisma.campaign.create({
        data: {
          organizationId: organizationId,
          name,
          body: agentPrompt,
          channel: "VOICE",
          status: "RUNNING", // Starts immediately
          recipients: {
            create: contacts.map((c) => ({
              status: "PENDING",
              contact: {
                connectOrCreate: {
                  where: {
                    organizationId_phone: {
                      organizationId: organizationId,
                      phone: c.phone
                    }
                  },
                  create: {
                    organizationId: organizationId,
                    name: c.name,
                    phone: c.phone
                  }
                }
              }
            }))
          }
        }
      });

      return NextResponse.json({ success: true, campaignId: campaign.id });
    }

    // ── Contrat SMS ───────────────────────────────────────────────────────
    const smsBody = body as { message?: unknown; contactIds?: unknown; name?: unknown };
    const message = typeof smsBody.message === "string" ? smsBody.message.trim() : "";
    const contactIds = Array.isArray(smsBody.contactIds)
      ? (smsBody.contactIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [];

    if (!message) {
      return NextResponse.json({ error: "Le message est requis" }, { status: 400 });
    }
    if (contactIds.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un contact" }, { status: 400 });
    }

    // Garde anti cross-tenant : on ne lie QUE les contacts de cette organisation.
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, organizationId },
      select: { id: true },
    });
    if (contacts.length === 0) {
      return NextResponse.json({ error: "Aucun contact valide sélectionné" }, { status: 400 });
    }

    // Numéro émetteur : le premier numéro ACTIVE de l'organisation.
    const sender = await prisma.phoneNumber.findFirst({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const campaign = await prisma.campaign.create({
      data: {
        organizationId,
        name: typeof smsBody.name === "string" && smsBody.name.trim()
          ? smsBody.name.trim()
          : `Campagne SMS ${new Date().toISOString().slice(0, 10)}`,
        channel: "SMS",
        body: message,
        status: "SENDING",
        phoneNumberId: sender ? sender.id : null,
        recipients: {
          create: contacts.map((c) => ({ contactId: c.id, status: "PENDING" })),
        },
      },
      select: {
        id: true,
        recipients: { select: { id: true } },
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipients: campaign.recipients.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}