import { prisma } from "@/lib/prisma";

export async function executeAutomation(organizationId: string, triggerType: string, payload: any) {
  console.log(`[AUTOMATION] Déclenchement de l'événement ${triggerType} pour l'organisation ${organizationId}`);

  try {
    const workflows = await prisma.automationWorkflow.findMany({
      where: {
        organizationId,
        triggerType,
        isActive: true,
      }
    });

    if (workflows.length === 0) {
      console.log(`[AUTOMATION] Aucune règle active trouvée pour ${triggerType}`);
      return;
    }

    for (const workflow of workflows) {
      console.log(`[AUTOMATION] Exécution du workflow: "${workflow.name}"`);
      // Call the internal execute logic here (mocked for now to fix build)
      // fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/workflows/execute?flowId=' + workflow.id, { ... })
    }
  } catch (error) {
    console.error(`[AUTOMATION] Erreur globale:`, error);
  }
}
