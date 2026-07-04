import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List profiles from OUR database for this specific organization
    const profiles = await prisma.messagingProfile.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ profiles });
  } catch (error: any) {
    console.error("[Messaging Profiles GET Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    const apiKey = org?.telnyxApiKey || process.env.TELNYX_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "No Telnyx API key configured" }, { status: 500 });
    }

    // Set Webhook URL to point to our Next.js app automatically
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://app.antigravite.com");
    const webhookUrl = `${baseUrl}/api/webhooks/telnyx/sms`;

    // 1. Create on Telnyx
    const res = await fetch(`${API_BASE}/messaging_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        webhook_url: webhookUrl,
        webhook_api_version: "2",
        whitelisted_destinations: ["US", "CA", "FR", "GB", "CM", "BE", "CH", "CI", "SN"] // Default common destinations to prevent Telnyx error
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.detail || "Failed to create messaging profile on Telnyx" }, { status: res.status });
    }

    // 2. Save in our Database (Linked to this specific Organization)
    const profile = await prisma.messagingProfile.create({
      data: {
        telnyxId: data.data.id,
        name: data.data.name,
        webhookUrl: webhookUrl,
        organizationId: session.user.organizationId
      }
    });

    return NextResponse.json({ profile });

  } catch (error: any) {
    console.error("[Messaging Profiles POST Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
