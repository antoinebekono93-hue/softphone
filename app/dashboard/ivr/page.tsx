import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import IvrBuilderClient from "./IvrBuilderClient";

export const metadata = {
  title: "Éditeur SVI | Antigravity",
};

export default async function IvrPage() {
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  if (!user?.organizationId) {
    return <div>Aucune organisation trouvée.</div>;
  }

  // Look for the main IVR rule
  const ivrRule = await prisma.automationWorkflow.findFirst({
    where: {
      organizationId: user.organizationId,
      triggerType: "INBOUND_CALL",
      name: "Main IVR"
    }
  });

  let initialNodes = null;
  if (ivrRule && ivrRule.nodes) {
    try {
      initialNodes = JSON.parse(ivrRule.nodes as string);
    } catch (e) {
      console.error("Failed to parse IVR nodes", e);
    }
  }

  return <IvrBuilderClient initialNodes={initialNodes} />;
}
