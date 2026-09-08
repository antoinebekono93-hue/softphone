import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    const { numberId, organizationId } = await req.json();

    if (typeof numberId !== "string" || typeof organizationId !== "string" || !organizationId) {
      return NextResponse.json({ error: "Number ID and organization ID are required" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Moving a provider DID is an ownership boundary.  Always detach the
    // previous user first, so a user from the old tenant can never remain the
    // apparent owner after an organization transfer.
    await prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        organizationId: organization.id,
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
