import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { nodes } = await req.json();

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Look for an existing IVR rule for this org, or create one.
    let ivrRule = await prisma.automationWorkflow.findFirst({
      where: {
        organizationId: user.organizationId,
        triggerType: "INBOUND_CALL",
        name: "Main IVR"
      }
    });

    if (ivrRule) {
      ivrRule = await prisma.automationWorkflow.update({
        where: { id: ivrRule.id },
        data: {
          nodes: JSON.stringify(nodes)
        }
      });
    } else {
      ivrRule = await prisma.automationWorkflow.create({
        data: {
          name: "Main IVR",
          triggerType: "INBOUND_CALL",
          nodes: JSON.stringify(nodes),
          organizationId: user.organizationId
        }
      });
    }

    return NextResponse.json({ success: true, rule: ivrRule });
  } catch (error: any) {
    console.error("[IVR_POST] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
