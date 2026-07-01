import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { ids, targetStatus } = await request.json(); // ids from local DB, targetStatus from UI

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Map UI statuses to Telnyx actions
    // UI targets: 'ACTIVE' -> 'enable', 'SUSPENDED' -> 'standby' (as requested to keep IP)
    const telnyxAction = targetStatus === 'ACTIVE' ? 'enable' : 'standby';
    const newLocalStatus = targetStatus === 'ACTIVE' ? 'enabled' : 'standby';

    // Fetch SIMs to get their telnyxSimId
    const sims = await prisma.simCard.findMany({
      where: {
        id: { in: ids },
        organizationId: org.id
      }
    });

    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json({ error: "Configuration API Telnyx manquante" }, { status: 500 });
    }

    const results = await Promise.allSettled(
      sims.map(async (sim) => {
        if (!sim.telnyxSimId) throw new Error("No telnyxSimId");
        
        const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId}/actions/${telnyxAction}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Telnyx API error: ${err}`);
        }
        
        return sim.id;
      })
    );

    const successfulIds = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value);

    // Update local DB for the ones that succeeded
    if (successfulIds.length > 0) {
      await prisma.simCard.updateMany({
        where: { id: { in: successfulIds } },
        data: { status: newLocalStatus }
      });
    }

    return NextResponse.json({ success: true, processed: successfulIds.length, total: ids.length });
  } catch (error) {
    console.error("Error toggling SIMs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
