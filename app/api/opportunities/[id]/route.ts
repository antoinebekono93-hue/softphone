import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      },
      include: {
        contact: {
          include: {
            callLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' }
        },
        assignedUser: true
      }
    });

    if (!opportunity) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    const { name, expectedRevenue, stage } = body;

    const opportunity = await prisma.opportunity.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      },
      data: {
        ...(name !== undefined && { name }),
        ...(expectedRevenue !== undefined && { expectedRevenue }),
        ...(stage !== undefined && { stage }),
      }
    });

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.opportunity.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[OPPORTUNITY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
