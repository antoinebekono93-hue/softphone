import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, agentPrompt, contacts } = await req.json();

    if (!name || !contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Create the campaign and all contacts in a single transaction
    const campaign = await prisma.campaign.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        agentPrompt,
        status: "RUNNING", // Starts immediately
        contacts: {
          create: contacts.map(c => ({
            name: c.name,
            phone: c.phone,
            status: "PENDING"
          }))
        }
      }
    });

    // In a real production environment, you would trigger your queue/worker here
    // Example: await sqs.sendMessage({ QueueUrl, MessageBody: campaign.id })
    // For now, our cron (workers/dialer) will pick up RUNNING campaigns with PENDING contacts.

    return NextResponse.json({ success: true, campaignId: campaign.id });
  } catch (error: any) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
