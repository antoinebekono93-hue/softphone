import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    const { numberId, organizationId } = await req.json();

    if (!numberId) {
      return NextResponse.json({ error: "Number ID is required" }, { status: 400 });
    }

    // Update the phone number to point to the new organization
    await prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        organizationId: organizationId || null,
        // Reset assigned user when changing organization
        assignedUserId: null, 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Number assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign number", details: message },
      { status: 500 }
    );
  }
}
