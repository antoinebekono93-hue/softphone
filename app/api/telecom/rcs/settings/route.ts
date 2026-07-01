import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { telnyx } from '@/lib/telnyx';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.rcsSettings.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error('RCS Settings Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { agentId, messagingProfileId, aiAssistantId } = body;

    // Optional: If linking profile to RCS Agent at Telnyx level
    if (agentId && messagingProfileId) {
      try {
        // According to the docs: PATCH /v2/rcs_agents/{agent_id}
        await fetch(`https://api.telnyx.com/v2/rcs_agents/${agentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
          },
          body: JSON.stringify({
            profile_id: messagingProfileId
          })
        });
      } catch (telnyxErr) {
        console.warn("Telnyx RCS Agent Link failed (might be pending approval):", telnyxErr);
      }
    }

    const settings = await prisma.rcsSettings.upsert({
      where: { organizationId: session.user.organizationId },
      create: {
        organizationId: session.user.organizationId,
        agentId,
        messagingProfileId,
        aiAssistantId
      },
      update: {
        agentId,
        messagingProfileId,
        aiAssistantId
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('RCS Settings Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
