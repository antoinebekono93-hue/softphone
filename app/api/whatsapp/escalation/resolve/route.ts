import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "contactId est requis" }, { status: 400 });
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        botMode: true,
        escalationStatus: 'RESOLVED',
        escalationReason: null
      }
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("Escalation resolve error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
