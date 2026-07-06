import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId, assignedUserId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    // Verify contact belongs to organization
    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organizationId: session.user.organizationId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify user belongs to organization (if assigning to someone)
    if (assignedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: assignedUserId, organizationId: session.user.organizationId }
      });
      if (!user) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
    }

    // Update assignment
    const updatedContact = await prisma.contact.update({
      where: { id: contact.id },
      data: { assignedUserId: assignedUserId || null }
    });

    return NextResponse.json({ success: true, contact: updatedContact });

  } catch (error: any) {
    console.error("[Assign Contact Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
