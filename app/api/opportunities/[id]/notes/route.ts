import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify opportunity ownership
    const opportunity = await prisma.opportunity.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    });

    if (!opportunity) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return new NextResponse("Missing content", { status: 400 });
    }

    const note = await prisma.internalNote.create({
      data: {
        content,
        opportunityId: opportunity.id,
        contactId: opportunity.contactId
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[OPPORTUNITY_NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
