import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { 
        id,
        organizationId: user.organization.id 
      }
    });

    if (!workflow) {
      return new NextResponse("Workflow not found", { status: 404 });
    }

    // Fetch the runs
    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: workflow.id },
      orderBy: { startedAt: "desc" },
      take: 50 // Limit to last 50 for performance
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("[WORKFLOW_RUNS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
