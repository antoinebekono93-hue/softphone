import OpenAI from "openai";
const openai = new OpenAI();
import { prisma } from "./prisma";
import { AssistantTool } from "openai/resources/beta/assistants";

/**
 * Syncs the dynamic skills of an AIEmployee with their OpenAI Assistant.
 * It combines any hardcoded tools with the custom skills defined in the DB.
 */
export async function syncAgentSkillsWithOpenAI(employeeId: string) {
  const employee = await prisma.aIEmployee.findUnique({
    where: { id: employeeId },
    include: { skills: true, knowledgeBase: true }
  });

  if (!employee || !employee.openaiAssistantId) return;

  // Base hardcoded tools
  const tools: AssistantTool[] = [
    {
      type: 'function',
      function: {
        name: 'transfer_to_human',
        description: 'Transfers the conversation to a human agent when the user is frustrated, angry, or explicitly asks for a human.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'The reason for the transfer'
            }
          },
          required: ['reason']
        }
      }
    }
  ];

  if (employee.templateId === 'sales') {
    tools.push(
      {
        type: 'function',
        function: {
          name: 'generer_facture',
          description: 'Génère une facture pour le client.',
          parameters: {
            type: 'object',
            properties: {
              montant: {
                type: 'number',
                description: 'Le montant total de la facture en euros.'
              },
              description: {
                type: 'string',
                description: 'La description des produits ou services facturés.'
              }
            },
            required: ['montant', 'description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'envoyer_facture_pdf',
          description: 'Envoie la facture générée au format PDF au client sur WhatsApp. Doit être appelé après avoir généré une facture.',
          parameters: {
            type: 'object',
            properties: {
              facture_id: {
                type: 'string',
                description: 'L\'identifiant de la facture préalablement générée.'
              }
            },
            required: ['facture_id']
          }
        }
      }
    );
  }

  // Add custom dynamic skills
  for (const skill of employee.skills) {
    try {
      const parametersSchema = skill.parametersSchema 
        ? typeof skill.parametersSchema === 'string' ? JSON.parse(skill.parametersSchema) : skill.parametersSchema
        : { type: 'object', properties: {} };

      tools.push({
        type: 'function',
        function: {
          name: skill.name,
          description: skill.description,
          parameters: parametersSchema
        }
      });
    } catch (err) {
      console.error(`[Skills] Failed to parse parameters schema for skill ${skill.name}`, err);
    }
  }

  // Sync to OpenAI
  try {
    const updateParams: any = {
      tools: tools
    };

    if (employee.knowledgeBase && employee.knowledgeBase.openaiVectorStoreId) {
      updateParams.tools.push({ type: 'file_search' });
      updateParams.tool_resources = {
        file_search: {
          vector_store_ids: [employee.knowledgeBase.openaiVectorStoreId]
        }
      };
    }

    await openai.beta.assistants.update(employee.openaiAssistantId, updateParams);
    console.log(`[Skills] Successfully synced ${updateParams.tools.length} tools for assistant ${employee.openaiAssistantId}`);
  } catch (err) {
    console.error(`[Skills] Failed to update assistant ${employee.openaiAssistantId}`, err);
  }
}
