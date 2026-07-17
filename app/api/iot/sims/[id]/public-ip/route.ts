import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const sim = await prisma.simCard.findFirst({
      where: { id, organizationId: org.id }
    });

    if (!sim) return NextResponse.json({ error: "SIM not found" }, { status: 404 });

    // Deduct $3 for Public IP
    if (org.walletBalance < 3) {
      return NextResponse.json({ error: "Insufficient wallet balance (needs $3)" }, { status: 402 });
    }

    // Call Telnyx API to enable Public IP
    const apiKey = process.env.TELNYX_API_KEY;
    if (apiKey) {
      const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId || sim.id}/actions/set_public_ip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        console.error("Failed to assign public IP on Telnyx", await res.text());
        // For local simulation, we might proceed anyway if we want to mock it.
      }
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { walletBalance: { decrement: 3 } }
    });

    const updated = await prisma.simCard.update({
      where: { id: sim.id },
      data: { publicIpEnabled: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error setting public IP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const sim = await prisma.simCard.findFirst({
      where: { id, organizationId: org.id }
    });

    if (!sim) return NextResponse.json({ error: "SIM not found" }, { status: 404 });

    const apiKey = process.env.TELNYX_API_KEY;
    if (apiKey) {
      const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId || sim.id}/actions/remove_public_ip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        console.error("Failed to remove public IP on Telnyx", await res.text());
      }
    }

    const updated = await prisma.simCard.update({
      where: { id: sim.id },
      data: { publicIpEnabled: false }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error removing public IP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
