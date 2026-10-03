import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";
import { resolveNumberAssignee } from "@/lib/number-assignment";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    const { numberId, organizationId, assignedUserId } = await req.json();

    if (typeof numberId !== "string" || typeof organizationId !== "string" || !organizationId) {
      return NextResponse.json({ error: "Number ID and organization ID are required" }, { status: 400 });
    }

    const [organization, number] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, users: { select: { id: true } } },
      }),
      prisma.phoneNumber.findUnique({
        where: { id: numberId },
        select: { id: true, organizationId: true, assignedUserId: true },
      }),
    ]);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    if (!number) return NextResponse.json({ error: "Number not found" }, { status: 404 });

    // The requested assignee must exist in the TARGET organization. An
    // administrator can therefore never park a DID on a foreign user.
    let assignee: string | null;
    try {
      assignee = resolveNumberAssignee(organization.users.map(user => user.id), number.assignedUserId, assignedUserId);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    // Compare-and-set: two administrators acting at the same time must not end
    // up in a silent last-write-wins. The write only applies if the row still
    // holds the ownership it had when it was read.
    const { count } = await prisma.phoneNumber.updateMany({
      where: {
        id: numberId,
        organizationId: number.organizationId,
        assignedUserId: number.assignedUserId,
      },
      data: { organizationId: organization.id, assignedUserId: assignee },
    });
    if (count !== 1) {
      return NextResponse.json(
        { error: "Le numéro a été modifié entre-temps. Rechargez la liste et réessayez." },
        { status: 409 },
      );
    }

    // God Mode is the only place allowed to move a DID across tenants. Every
    // view derived from that ownership must be invalidated so the previous and
    // the new owner re-read the database instead of a cached payload.
    revalidatePath("/dashboard/numbers");
    revalidatePath("/god-mode/numbers");
    return NextResponse.json({
      success: true,
      organizationId: organization.id,
      assignedUserId: assignee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Number assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign number", details: message },
      { status: 500 }
    );
  }
}
