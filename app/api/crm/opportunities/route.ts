import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      include: {
        contact: true,
        assignedUser: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("[OPPORTUNITIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, stage, expectedRevenue, probability, priority, contactId } = body;

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        stage: stage || "NEW",
        expectedRevenue: expectedRevenue || 0,
        probability: probability || 10,
        priority: priority || 0,
        organizationId: session.user.organizationId,
        contactId,
        assignedUserId: session.user.id
      },
      include: {
        contact: true
      }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("[OPPORTUNITIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
