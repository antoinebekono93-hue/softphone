import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const calls = await prisma.callLog.findMany({
      where: { organizationId: org.id }
    });

    const totalCalls = calls.length;
    const completedCount = calls.filter(c => c.status === 'COMPLETED').length;
    const abandonedCount = calls.filter(c => c.status === 'CANCELED' || c.status === 'MISSED').length;
    
    const connectionRate = totalCalls > 0 ? (completedCount / totalCalls) * 100 : 0;
    const abandonedRate = totalCalls > 0 ? (abandonedCount / totalCalls) * 100 : 0;
    
    // Simulate peak channels based on total calls
    const maxChannels = totalCalls > 0 ? Math.floor(totalCalls / 5) + 1 : 0;

    return NextResponse.json({
      totalCalls,
      connectionRate,
      abandonedRate,
      maxChannels
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
