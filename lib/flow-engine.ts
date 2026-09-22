import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type FlowNodeType = 'triggerNode' | 'messageNode' | 'delayNode' | 'aiAgentNode';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  data: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Moteur d'exécution centralisé pour les Scénarios WhatsApp (Flow Builder).
 * @param enrollmentId L'ID de l'inscription du contact dans le scénario
 * @param eventData Optionnel, des données déclenchantes (ex: text du message entrant)
 */
export async function executeFlow(enrollmentId: string, eventData?: any) {
  const enrollment = await prisma.whatsAppFlowEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      flow: true,
      contact: true,
      organization: true
    }
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return; // Le flux n'est plus actif ou n'existe pas
  }

  // Parse JSON graph
  const nodes = (enrollment.flow.nodes as unknown as FlowNode[]) || [];
  const edges = (enrollment.flow.edges as unknown as FlowEdge[]) || [];

  let currentNodeId = enrollment.currentNodeId;

  // S'il n'y a pas de noeud courant, on cherche le déclencheur (Trigger)
  if (!currentNodeId) {
    const triggerNode = nodes.find(n => n.type === 'triggerNode');
    if (!triggerNode) {
      console.warn(`[FlowEngine] Flow ${enrollment.flow.id} a démarré mais n'a pas de TriggerNode.`);
      await markEnrollmentCompleted(enrollmentId);
      return;
    }
    // Avancer au noeud qui suit le déclencheur
    currentNodeId = getNextNodeId(triggerNode.id, edges);
  }

  // Boucle d'exécution continue jusqu'à ce qu'on trouve un noeud bloquant (Delay, Agent IA, Fin)
  while (currentNodeId) {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    
    if (!currentNode) {
      console.warn(`[FlowEngine] Noeud ${currentNodeId} introuvable dans le flux.`);
      await markEnrollmentCompleted(enrollmentId);
      break;
    }

    console.log(`[FlowEngine] Execution du noeud ${currentNode.id} (${currentNode.type}) pour Contact ${enrollment.contact.phone}`);

    if (currentNode.type === 'messageNode') {
      const messageText = currentNode.data?.message || "";
      await sendWhatsAppMessage(enrollment, messageText);
      // Passe au noeud suivant
      currentNodeId = getNextNodeId(currentNode.id, edges);
    } 
    else if (currentNode.type === 'delayNode') {
      const delayMinutes = parseInt(currentNode.data?.minutes) || 60;
      const nextRunAt = new Date(Date.now() + delayMinutes * 60000);
      
      // On sauvegarde l'état, on met à jour nextRunAt et on casse la boucle (le CRON reprendra)
      await prisma.whatsAppFlowEnrollment.update({
        where: { id: enrollmentId },
        data: {
          currentNodeId: getNextNodeId(currentNode.id, edges),
          nextRunAt: nextRunAt,
          status: 'ACTIVE'
        }
      });
      console.log(`[FlowEngine] Flow en pause. Reprise prévue le ${nextRunAt.toISOString()}`);
      break; 
    }
    else if (currentNode.type === 'aiAgentNode') {
      // Le composant Agent IA transfère le contrôle à Hermes
      const prompt = currentNode.data?.prompt || "";
      
      // On sauvegarde le prompt dans les notes internes ou dans un champ spécial, et on active le mode Bot
      await prisma.contact.update({
        where: { id: enrollment.contact.id },
        data: { 
          botMode: true,
          // Nous stockerons l'objectif (prompt) dans les internalNotes pour que l'IA le lise au prochain tour
        }
      });

      if (prompt) {
        await prisma.internalNote.create({
          data: {
            content: `[OBJECTIF IA DU SCÉNARIO] : ${prompt}`,
            contactId: enrollment.contact.id,
            organizationId: enrollment.organizationId,
            authorId: "system" // ID générique
          }
        });
      }

      console.log(`[FlowEngine] Transfert à l'IA effectué pour ${enrollment.contact.phone}`);
      await markEnrollmentCompleted(enrollmentId);
      break;
    }
    else {
      // Noeud inconnu
      currentNodeId = getNextNodeId(currentNode.id, edges);
    }

    // Fin du graphe
    if (!currentNodeId) {
      console.log(`[FlowEngine] Fin du parcours atteinte pour ${enrollment.contact.phone}`);
      await markEnrollmentCompleted(enrollmentId);
      break;
    }
  }
}

// Helper pour marquer l'enrollment comme terminé
async function markEnrollmentCompleted(enrollmentId: string) {
  await prisma.whatsAppFlowEnrollment.update({
    where: { id: enrollmentId },
    data: { status: 'COMPLETED', currentNodeId: null, nextRunAt: null }
  });
}

// Trouver le noeud ciblé par l'arête sortant du noeud courant
function getNextNodeId(currentId: string, edges: FlowEdge[]): string | null {
  const edge = edges.find(e => e.source === currentId);
  return edge ? edge.target : null;
}

// Envoi d'un message via l'infrastructure existante (Telnyx)
async function sendWhatsAppMessage(enrollment: any, text: string) {
  if (!text) return;

  try {
    // 1. Trouver le compte WhatsApp de l'org pour avoir le numéro émetteur
    const waAccount = await prisma.whatsAppAccount.findFirst({
      where: { organizationId: enrollment.organizationId }
    });

    if (!waAccount) {
      console.error(`[FlowEngine] Aucun compte WhatsApp trouvé pour l'org ${enrollment.organizationId}`);
      return;
    }

    const fromNumber = waAccount.phoneNumber;
    const toNumber = enrollment.contact.phone;

    // 2. Appel natif à Telnyx
    const res = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromNumber,
        to: toNumber,
        whatsapp_message: {
          type: 'text',
          text: { body: text, preview_url: false }
        }
      })
    });

    if (res.ok) {
      // 3. Tracer dans l'historique
      await prisma.smsMessage.create({
        data: {
          telnyxMessageId: `flow-${Date.now()}`, // ID temporaire (vrai ID dans webhook sortant si on le trace, mais Telnyx v2 renvoie pas tjrs direct)
          direction: "OUTBOUND",
          body: text,
          status: "DELIVERED",
          type: "WHATSAPP",
          fromNumber: fromNumber,
          toNumber: toNumber,
          organizationId: enrollment.organizationId,
          contactId: enrollment.contact.id,
        }
      });
      console.log(`[FlowEngine] Message envoyé à ${toNumber}: "${text.substring(0, 30)}..."`);
    } else {
      console.error(`[FlowEngine] Erreur Telnyx: ${res.status}`, await res.text());
    }
  } catch (e) {
    console.error(`[FlowEngine] Exception envoi WhatsApp:`, e);
  }
}
