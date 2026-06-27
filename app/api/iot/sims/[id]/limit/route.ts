import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const { dataLimitMB, alertEnabled } = await request.json();

    const sim = await prisma.simCard.findFirst({
      where: { id: params.id, organizationId: org.id }
    });

    if (!sim) return NextResponse.json({ error: "SIM not found" }, { status: 404 });

    const updated = await prisma.simCard.update({
      where: { id: sim.id },
      data: {
        dataLimitMB: dataLimitMB === "" ? null : parseFloat(dataLimitMB),
        alertEnabled: alertEnabled === true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error setting limit:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
