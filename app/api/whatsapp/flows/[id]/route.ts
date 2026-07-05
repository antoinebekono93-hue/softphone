import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nodes, edges } = await req.json();
    const resolvedParams = await params;
    const flowId = resolvedParams.id;

    const flow = await prisma.whatsAppFlow.findFirst({
      where: { 
        id: flowId,
        organizationId: session.user.organizationId
      }
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const updatedFlow = await prisma.whatsAppFlow.update({
      where: { id: flowId },
      data: {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges)
      }
    });

    return NextResponse.json(updatedFlow);
  } catch (error: any) {
    console.error("Flow API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
