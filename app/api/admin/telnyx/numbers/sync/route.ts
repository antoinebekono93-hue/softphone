import { NextResponse } from "next/server";
import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    console.log("Fetching provisioned numbers from Telnyx...");
    const response = await telnyx.phoneNumbers.list();
    const telnyxNumbers = response.data || [];

    let syncedCount = 0;

    for (const num of telnyxNumbers) {
      // Upsert the number into our database
      await prisma.phoneNumber.upsert({
        where: { telnyxId: num.id },
        update: {
          number: num.phone_number,
        },
        create: {
          number: num.phone_number,
          telnyxId: num.id,
          organizationId: orgId, // Assign to current admin org by default
          country: num.country_code || "US",
          status: "ACTIVE",
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });

  } catch (error: any) {
    console.error("Number sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync numbers", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
