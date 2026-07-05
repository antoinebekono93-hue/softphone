import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contactId, assignedUserId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
    }

    // Verify contact belongs to organization
    const contact = await prisma.contact.findFirst({
      where: { 
        id: contactId,
        organizationId: session.user.organizationId
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { assignedUserId }
    });

    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error: any) {
    console.error("Assign API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
