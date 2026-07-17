import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { contactId, takeOver } = await req.json();

    if (!contactId || typeof takeOver !== "boolean") {
      return new NextResponse("Missing contactId or takeOver flag", { status: 400 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = user.organization.id;

    // Verify contact belongs to the organization
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    // If takeOver is true: Human takes over -> botMode = false, escalationStatus = "RESOLVED"
    // If takeOver is false: Hand back to AI -> botMode = true, escalationStatus = "NONE"
    
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        botMode: !takeOver, // botMode is false when human takes over
        escalationStatus: takeOver ? "RESOLVED" : "NONE",
        assignedUserId: takeOver ? user.id : null, // assign to the user who took over
      },
    });

    return NextResponse.json({ contact: updatedContact });
  } catch (error: any) {
    console.error("[INBOX_TAKEOVER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
