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

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    const apiKey = org?.telnyxApiKey || process.env.TELNYX_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "No Telnyx API key configured" }, { status: 500 });
    }

    const res = await fetch(`${API_BASE}/messaging_profiles`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.detail || "Failed to fetch messaging profiles" }, { status: res.status });
    }

    return NextResponse.json({ profiles: data.data });

  } catch (error: any) {
    console.error("[Telnyx Messaging Profiles GET Error]", error);
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

    const res = await fetch(`${API_BASE}/messaging_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name,
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.detail || "Failed to create messaging profile" }, { status: res.status });
    }

    return NextResponse.json({ profile: data.data });

  } catch (error: any) {
    console.error("[Telnyx Messaging Profiles POST Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
