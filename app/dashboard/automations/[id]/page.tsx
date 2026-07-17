import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WorkflowEditorClient } from "./WorkflowEditorClient";

export default async function AutomationEditorPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  });

  if (!user?.organization) redirect("/dashboard");

  const workflow = await prisma.automationWorkflow.findUnique({
    where: { 
      id: params.id,
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
