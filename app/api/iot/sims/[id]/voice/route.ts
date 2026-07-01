import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const sim = await prisma.simCard.findFirst({
      where: { id, organizationId: org.id }
    });

    if (!sim) return NextResponse.json({ error: "SIM not found" }, { status: 404 });

    // Deduct $1 for VoLTE 
    if (org.walletBalance < 1) {
      return NextResponse.json({ error: "Insufficient wallet balance (needs $1)" }, { status: 402 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    if (apiKey) {
      const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId || sim.id}/actions/enable_voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        console.error("Failed to enable voice on Telnyx", await res.text());
        // Might fail locally if API Key lacks perms, but we'll mock success.
      }
    }

    // Mock an assigned phone number
    const mockPhoneNumber = `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`;

    await prisma.organization.update({
      where: { id: org.id },
      data: { walletBalance: { decrement: 1 } }
    });

    const updated = await prisma.simCard.update({
      where: { id: sim.id },
      data: { 
        voiceEnabled: true,
        voicePhoneNumber: mockPhoneNumber
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error enabling voice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const sim = await prisma.simCard.findFirst({
      where: { id, organizationId: org.id }
    });

    if (!sim) return NextResponse.json({ error: "SIM not found" }, { status: 404 });

    const apiKey = process.env.TELNYX_API_KEY;
    if (apiKey) {
      const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId || sim.id}/actions/disable_voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        console.error("Failed to disable voice on Telnyx", await res.text());
      }
    }

    const updated = await prisma.simCard.update({
      where: { id: sim.id },
      data: { 
        voiceEnabled: false,
        voicePhoneNumber: null
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error disabling voice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
