import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    
    // Instead of loading all into memory, let's just count (better for scale, though rates still need logic)
    // We'll keep the current logic but scoped to the org for safety.
    const calls = await prisma.callLog.findMany({
      where: { organizationId: orgId },
      select: { status: true }
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
