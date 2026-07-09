import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FlowEditorClient } from "./FlowEditorClient";

export const metadata = {
  title: 'Flow Editor | Antigravity',
};

export default async function FlowEditorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  
  const flow = await prisma.whatsAppFlow.findUnique({
    where: { id: params.id, organizationId: session.user.organizationId }
  });

  if (!flow) redirect('/dashboard/flow-builder');

  // Parse nodes and edges from Prisma Json fields
  let parsedNodes = [];
  let parsedEdges = [];
  try {
    parsedNodes = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes;
    parsedEdges = typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges;
  } catch (e) {
    console.error("Failed to parse flow nodes/edges");
  }

  // We ensure there's at least one node
  if (!Array.isArray(parsedNodes) || parsedNodes.length === 0) {
    parsedNodes = [
      {
        id: "trigger-1",
        type: "triggerNode",
        position: { x: 250, y: 100 },
        data: { label: "Nouveau Message Entrant" }
      }
    ];
  }
  if (!Array.isArray(parsedEdges)) {
    parsedEdges = [];
  }

  return (
    <div className="h-[calc(100vh-80px)] -mx-6 -mt-6">
      <FlowEditorClient 
        flowId={flow.id} 
        initialName={flow.name}
        initialIsActive={flow.isActive}
        initialNodes={parsedNodes}
        initialEdges={parsedEdges}
      />
    </div>
  );
}
