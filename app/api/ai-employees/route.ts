import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import OpenAI from 'openai';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.aIEmployee.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Failed to fetch AI employees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, jobTitle, systemPrompt, templateId, selectedTone, voiceId, language, handlesWhatsApp, handlesVoice, handlesSms, handlesInstagram, voicePhoneNumberId, roleType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let finalSystemPrompt = systemPrompt || "Tu es un assistant virtuel utile.";

    if (templateId) {
      const template = await prisma.agentTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalSystemPrompt = template.systemPrompt;
        if (selectedTone) {
          try {
            const tones = JSON.parse(template.tones || '[]');
            const toneObj = tones.find((t: any) => t.name === selectedTone);
            if (toneObj) {
              finalSystemPrompt += `\n\n[DIRECTIVE DE TON : ${toneObj.name}]\n${toneObj.prompt}`;
            }
          } catch(e) {}
        }
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Find if the organization has a Knowledge Base
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { organizationId: session.user.organizationId }
    });

    // Create Assistant in OpenAI
    let tools: any[] = [
      {
        type: "function",
        function: {
          name: "transfer_to_human",
          description: "Utilisez cette fonction lorsque l'utilisateur demande explicitement à parler à un humain, ou s'il est très frustré/en colère, ou si vous ne pouvez absolument pas résoudre le problème après avoir cherché dans la base de connaissances.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "La raison détaillée du transfert à l'humain."
              }
            },
            required: ["reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verifier_stock",
          description: "Vérifie si un article (SKU) est en stock dans la base de données.",
          parameters: {
            type: "object",
            properties: {
              sku_id: { type: "string", description: "L'identifiant SKU du produit." }
            },
            required: ["sku_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_payment_link",
          description: "Génère un lien de paiement Flutterwave sécurisé pour un article donné. Ne mentionnez pas de prix avant d'avoir généré le lien. L'orchestrateur fixera le prix officiel.",
          parameters: {
            type: "object",
            properties: {
              sku_id: { type: "string", description: "L'identifiant SKU du produit à payer." },
              customer_email: { type: "string", description: "L'email du client (optionnel)." }
            },
            required: ["sku_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Vérifie les disponibilités du calendrier pour une date donnée. Retourne toujours 2 créneaux maximum pour ne pas saturer l'utilisateur à l'oral.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "La date souhaitée au format YYYY-MM-DD." }
            },
            required: ["date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "book_appointment",
          description: "Réserve un créneau dans le calendrier.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "La date au format YYYY-MM-DD." },
              time: { type: "string", description: "L'heure au format HH:MM." },
              name: { type: "string", description: "Le nom du client." },
              phone: { type: "string", description: "Le numéro de téléphone du client." }
            },
            required: ["date", "time", "name", "phone"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_quote",
          description: "Génère un devis (Quote) pour un client et l'enregistre dans le système.",
          parameters: {
            type: "object",
            properties: {
              contact_phone: { type: "string", description: "Le numéro de téléphone du client." },
              contact_name: { type: "string", description: "Le nom du client." },
              amount: { type: "number", description: "Le montant total du devis." },
              description: { type: "string", description: "La description des produits ou services." }
            },
            required: ["contact_phone", "amount", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_invoice",
          description: "Génère une facture (Invoice) pour un client et l'enregistre dans le système.",
          parameters: {
            type: "object",
            properties: {
              contact_phone: { type: "string", description: "Le numéro de téléphone du client." },
              contact_name: { type: "string", description: "Le nom du client." },
              amount: { type: "number", description: "Le montant total de la facture." },
              description: { type: "string", description: "La description des produits ou services facturés." }
            },
            required: ["contact_phone", "amount", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_support_ticket",
          description: "Créé un ticket de support technique ou réclamation pour un client. A utiliser quand l'IA ne peut pas résoudre le problème elle-même.",
          parameters: {
            type: "object",
            properties: {
              contact_phone: { type: "string", description: "Le numéro de téléphone du client." },
              contact_name: { type: "string", description: "Le nom du client (si connu)." },
              title: { type: "string", description: "Un titre court résumant le problème." },
              description: { type: "string", description: "Une description détaillée du problème formulée par le client." },
              priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"], description: "Le niveau d'urgence du problème." }
            },
            required: ["contact_phone", "title", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_stock_and_price",
          description: "Recherche un produit dans le catalogue pour vérifier son prix et son niveau de stock.",
          parameters: {
            type: "object",
            properties: {
              product_name: { type: "string", description: "Le nom ou une partie du nom du produit à rechercher." }
            },
            required: ["product_name"]
          }
        }
      }
    ];
    let tool_resources: any = undefined;

    if (knowledgeBase && knowledgeBase.openaiVectorStoreId) {
      tools.push({ type: "file_search" });
      tool_resources = {
        file_search: {
          vector_store_ids: [knowledgeBase.openaiVectorStoreId]
        }
      };
    }

    const assistant = await openai.beta.assistants.create({
      name: name,
      instructions: finalSystemPrompt,
      model: "gpt-4o-mini",
      tools: tools,
      tool_resources: tool_resources
    });

    const employee = await prisma.aIEmployee.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        jobTitle: jobTitle || 'Agent de Support Client',
        systemPrompt: finalSystemPrompt,
        templateId: templateId || null,
        selectedTone: selectedTone || null,
        voiceId: voiceId || 'alloy',
        language: language || 'fr-FR',
        handlesWhatsApp: !!handlesWhatsApp,
        handlesVoice: !!handlesVoice,
        handlesInstagram: !!handlesInstagram,
        voicePhoneNumberId: voicePhoneNumberId || null,
        roleType: roleType || 'GENERAL',
        isActive: true,
        openaiAssistantId: assistant.id,
        knowledgeBaseId: knowledgeBase?.id || null
      }
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create AI employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
