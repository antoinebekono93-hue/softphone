import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheTenantRouting } from '@/lib/redis';

export const maxDuration = 60; // Allow 60s for Vercel Serverless

export async function POST(req: Request) {
  try {
    // 1. Authenticate worker (e.g. cron secret)
    const authHeader = req.headers.get("Authorization");
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch a batch of pending contacts from RUNNING campaigns (Limit: 10 to avoid rate limits)
    const pendingContacts = await prisma.campaignContact.findMany({
      where: { 
        status: "PENDING",
        campaign: { status: "RUNNING" }
      },
      include: { campaign: { include: { organization: true } } },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    if (pendingContacts.length === 0) {
      return NextResponse.json({ message: "No pending contacts" });
    }

    console.log(`[Dialer] Processing batch of ${pendingContacts.length} contacts...`);

    const results = [];

    for (const contact of pendingContacts) {
      const org = contact.campaign.organization;
      const telnyxApiKey = org.telnyxApiKey || process.env.TELNYX_API_KEY;
      const telnyxConnectionId = org.telnyxConnectionId || process.env.TELNYX_CONNECTION_ID;

      if (!telnyxApiKey || !telnyxConnectionId) {
        console.error(`[Dialer] Missing Telnyx config for Org ${org.id}`);
        continue;
      }

      // Mark as CALLED immediately to prevent double dialing
      await prisma.campaignContact.update({
        where: { id: contact.id },
        data: { status: "CALLED" }
      });

      // Cache the routing so the webhook knows this phone maps to this org
      await cacheTenantRouting(contact.phone, org.id);

      // We need a specific caller ID. We mock it if not present.
      const fromNumber = "+15550000000"; 

      // Initiate Call via Telnyx
      try {
        const response = await fetch('https://api.telnyx.com/v2/calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${telnyxApiKey}`
          },
          body: JSON.stringify({
            to: contact.phone,
            from: fromNumber,
            connection_id: telnyxConnectionId,
            answering_machine_detection: "premium", // AMD activated
            custom_headers: [
              { name: "X-Campaign-Id", value: contact.campaignId },
              { name: "X-Contact-Id", value: contact.id }
            ],
            // Note: client_state is often used for webhooks to carry state
            client_state: Buffer.from(JSON.stringify({
              campaignId: contact.campaignId,
              contactId: contact.id,
              agentPrompt: contact.campaign.agentPrompt
            })).toString('base64')
          })
        });

        if (!response.ok) {
          const err = await response.json();
          console.error(`[Dialer] Telnyx Error for ${contact.phone}:`, err);
          await prisma.campaignContact.update({
            where: { id: contact.id },
            data: { status: "FAILED", aiSummary: JSON.stringify(err) }
          });
        } else {
          results.push(contact.phone);
        }
      } catch (err) {
        console.error(`[Dialer] Exception for ${contact.phone}:`, err);
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: { status: "FAILED" }
        });
      }

      // Add a small delay between dials to avoid bursting the API
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ success: true, dialed: results });
  } catch (error: any) {
    console.error("[Dialer] Global error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
