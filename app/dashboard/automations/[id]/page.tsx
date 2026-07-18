import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkflowEditorClient } from "./WorkflowEditorClient";

export default async function AutomationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user?.organization) redirect("/dashboard");

  const workflow = await prisma.automationWorkflow.findUnique({
    where: { 
      id,
      organizationId: user.organization.id
    }
  });

  if (!workflow) redirect("/dashboard/automations");

  let initialNodes = [];
  let initialEdges = [];
  try {
    initialNodes = JSON.parse(workflow.nodes as string);
    initialEdges = JSON.parse(workflow.edges as string);
  } catch (e) {
    console.error("Invalid JSON in flow", e);
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      <WorkflowEditorClient 
        flowId={workflow.id}
        initialName={workflow.name}
        initialIsActive={workflow.isActive}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />
    </div>
  );
}
