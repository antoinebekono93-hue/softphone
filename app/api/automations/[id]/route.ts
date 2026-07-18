import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) return new NextResponse("No Org", { status: 403 });

    const body = await req.json();
    const { name, isActive, nodes, edges } = body;

    const wf = await prisma.automationWorkflow.findUnique({
      where: { id, organizationId: user.organization.id }
    });

    if (!wf) return new NextResponse("Not Found", { status: 404 });

    const updated = await prisma.automationWorkflow.update({
      where: { id },
      data: {
        name,
        isActive,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT workflow error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
