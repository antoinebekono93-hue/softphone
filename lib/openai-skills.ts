import OpenAI from "openai";
import { prisma } from "./prisma";
import { AssistantTool } from "openai/resources/beta/assistants";

/**
 * Syncs the dynamic skills of an AIEmployee with their OpenAI Assistant.
 * It combines any hardcoded tools with the custom skills defined in the DB.
 */
export async function syncAgentSkillsWithOpenAI(employeeId: string) {
  const openai = new OpenAI();
  
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

  // Marketing / Social Media Manager skills
  if (employee.roleType === 'FACEBOOK_MANAGER' || employee.roleType === 'INSTAGRAM_MANAGER') {
    tools.push(
      {
        type: 'function',
        function: {
          name: 'hide_comment',
          description: 'Hide a comment on a social media post if it is spam, offensive, or violates community guidelines.',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'The reason for hiding the comment.' }
            },
            required: ['reason']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'like_comment',
          description: 'Like a comment to show appreciation or acknowledge it.',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'reply_privately',
          description: 'Send a private direct message to the user who commented, usually to ask for personal details or send a payment link.',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'The content of the private message to send.' }
            },
            required: ['message']
          }
        }
      }
    );
  }

  // CRM & Sales Skills for all interactive agents
  tools.push(
    {
      type: 'function',
      function: {
        name: 'update_contact_info',
        description: 'Update the contact information of the user in the CRM (e.g. name, email, company).',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The full name of the contact.' },
            email: { type: 'string', description: 'The email address of the contact.' },
            company: { type: 'string', description: 'The company name of the contact.' }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'qualify_lead',
        description: 'Update the lead score or sentiment of the contact based on their interest level.',
        parameters: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'A score from 0 to 100 representing how hot the lead is.' },
            sentiment: { type: 'string', description: 'The sentiment: POSITIVE, NEUTRAL, or NEGATIVE.', enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] }
          },
          required: ['score', 'sentiment']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_quote',
        description: 'Generate a sales quote for the contact with a specific amount and description.',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'The total amount of the quote.' },
            currency: { type: 'string', description: 'The currency code (e.g. EUR, XAF, USD).', default: 'EUR' },
            description: { type: 'string', description: 'Details of what the quote is for.' }
          },
          required: ['amount', 'description']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'assign_ticket_to_human',
        description: 'Create a support ticket assigned to a human agent when the user needs manual assistance, complains, or has a complex request.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A short title summarizing the issue.' },
            description: { type: 'string', description: 'A detailed description of why human intervention is needed.' },
            priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] }
          },
          required: ['title', 'description', 'priority']
        }
      }
    }
  );

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
