import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { stage } = body;

    const opportunity = await prisma.opportunity.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      },
      data: {
        stage
      }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("[OPPORTUNITY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
