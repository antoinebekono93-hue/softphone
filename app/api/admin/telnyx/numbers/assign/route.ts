import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Only admins should be able to do this
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error: any) {
    console.error("Number assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign number", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
