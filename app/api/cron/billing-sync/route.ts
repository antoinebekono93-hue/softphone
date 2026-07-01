import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "default_cron_secret"}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This is a placeholder for the Billing Ledger Sync.
    // In a production environment:
    // 1. Fetch Telnyx asynchronous detail records (CDRs/MDRs) for yesterday.
    // 2. Map Telnyx Connections/Tags to our local Organization IDs.
    // 3. For every cost incurred on Telnyx, multiply by MARKUP (e.g., x2).
    // 4. Create WalletTransaction for the organization.
    // 5. Deduct from Organization.walletBalance.

    // MVP: For now, we simulate a nightly audit.
    const orgs = await prisma.organization.findMany();
    
    // Check if any org fell below $0 (meaning they bypassed real-time guards)
    const defaultingOrgs = orgs.filter(o => o.walletBalance < 0);
    
    if (defaultingOrgs.length > 0) {
      // Suspend their connections via Telnyx API or locally
      console.log(`[Billing Sync] WARNING: ${defaultingOrgs.length} orgs are in negative balance.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Billing sync completed.",
      defaultingTenants: defaultingOrgs.map(o => o.name)
    });

  } catch (error: any) {
    console.error("Billing sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
