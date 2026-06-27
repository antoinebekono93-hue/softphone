import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: simId } = await params;
    const sim = await prisma.simCard.findUnique({
      where: { id: simId }
    });

    if (!sim) {
      return NextResponse.json({ error: "SIM not found" }, { status: 404 });
    }

    const newStatus = sim.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    // MOCK TELNYX API : Appel simulé pour changer le statut chez l'opérateur
    // await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId}/actions/${newStatus === 'ACTIVE' ? 'enable' : 'disable'}`, ...)

    const updatedSim = await prisma.simCard.update({
      where: { id: simId },
      data: { status: newStatus }
    });

    return NextResponse.json(updatedSim);
  } catch (error) {
    console.error("Error toggling SIM status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
