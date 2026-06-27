import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const { ids, targetStatus } = await request.json(); // targetStatus: 'ACTIVE' or 'SUSPENDED'
    
    if (!ids || !Array.isArray(ids) || !targetStatus) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await prisma.simCard.updateMany({
      where: {
        id: { in: ids },
        organizationId: org.id
      },
      data: {
        status: targetStatus
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk toggling sims:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
