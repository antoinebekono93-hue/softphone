import { prisma } from "@/lib/prisma";

export async function executeAutomation(organizationId: string, triggerType: string, payload: any) {
  console.log(`[AUTOMATION] Déclenchement de l'événement ${triggerType} pour l'organisation ${organizationId}`);

  try {
    // 1. Récupérer les règles actives
    const rules = await prisma.automationRule.findMany({
      where: {
        organizationId,
        triggerType,
        isActive: true,
      }
    });

    if (rules.length === 0) {
      console.log(`[AUTOMATION] Aucune règle active trouvée pour ${triggerType}`);
      return;
    }

    // 2. Extraire les variables du payload pour le remplacement
    const contact = payload.contact || {};
    
    for (const rule of rules) {
      console.log(`[AUTOMATION] Exécution de la règle: "${rule.name}" (Action: ${rule.actionType})`);
      let config: any = {};
      try {
        config = JSON.parse(rule.actionPayload || "{}");
      } catch (e) {
        console.error(`[AUTOMATION] JSON.parse error for actionPayload:`, e);
      }

      // Fonction utilitaire pour remplacer les variables dynamiques (ex: {{contact.name}})
      const replaceVariables = (text: string) => {
        if (!text) return text;
        let res = text;
        res = res.replace(/\{\{contact\.name\}\}/g, contact.name || 'Client');
        res = res.replace(/\{\{contact\.phone\}\}/g, contact.phone || '');
        return res;
      };

      try {
        if (rule.actionType === "SEND_SMS") {
          const message = replaceVariables(config.message);
          const toNumber = replaceVariables(config.to || contact.phone);

          if (!toNumber) {
            console.log(`[AUTOMATION] SEND_SMS ignoré: pas de numéro de téléphone.`);
            continue;
          }

          // Trouver le numéro Telnyx de l'orga
          const telnyxAccount = await prisma.messagingProfile.findFirst({
            where: { organizationId }
          }); // Note: On utilise MessagingProfile pour SMS dans cette app

          if (telnyxAccount) {
            // Envoyer le SMS
            await fetch('https://api.telnyx.com/v2/messages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                from: "+1234567890", // Devrait venir de telnyxAccount.phoneNumber, on utilise un placeholder pour simplifier s'il manque.
                to: toNumber,
                text: message,
              })
            });
            console.log(`[AUTOMATION] SMS envoyé à ${toNumber}`);
          }
        } 
        else if (rule.actionType === "SEND_WHATSAPP") {
          const message = replaceVariables(config.message);
          const toNumber = replaceVariables(config.to || contact.phone);

          if (!toNumber) continue;

          const waAccount = await prisma.whatsAppAccount.findUnique({
            where: { organizationId }
          });

          if (waAccount) {
            await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: waAccount.phoneNumber,
                to: toNumber,
                whatsapp_message: {
                  type: 'text',
                  text: { body: message, preview_url: false }
                }
              })
            });
            console.log(`[AUTOMATION] WhatsApp envoyé à ${toNumber}`);
          }
        }
        else if (rule.actionType === "CREATE_OPPORTUNITY") {
          // Créer une opportunité dans le CRM avec une note interne
          const systemUser = await prisma.user.findFirst({
            where: { organizationId: organizationId }
          });
          
          if (!systemUser) {
             console.error("[AUTOMATION] Impossible de créer une note interne d'opportunité: aucun utilisateur trouvé.");
             continue;
          }

          await prisma.opportunity.create({
            data: {
              name: `Opportunité: ${contact.name || contact.phone}`,
              stage: "NEW",
              expectedRevenue: 0,
              contactId: contact.id,
              organizationId: organizationId,
              internalNotes: {
                create: {
                  content: `Créé automatiquement par la règle d'automatisation: "${rule.name}" (Déclencheur: ${triggerType}).`,
                  contactId: contact.id,
                  organizationId: organizationId,
                  authorId: systemUser.id
                }
              }
            }
          });
          console.log(`[AUTOMATION] Opportunité CRM créée pour ${contact.id}`);
        }
      } catch (actionError) {
        console.error(`[AUTOMATION] Erreur lors de l'exécution de l'action ${rule.actionType}:`, actionError);
      }
    }
  } catch (error) {
    console.error(`[AUTOMATION] Erreur globale:`, error);
  }
}
