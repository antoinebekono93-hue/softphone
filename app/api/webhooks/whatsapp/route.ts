import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryRedisMemory, generateAndStoreSkill, formatMemoriesForPrompt } from "@/lib/hermes-memory";
import { buildRunInstructions, isResolutionSignal } from "@/lib/hermes-prompt";
import { redis } from "@/lib/redis";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Webhook WhatsApp Reçu]", JSON.stringify(payload, null, 2));

    const eventData = payload?.data;
    if (!eventData) {
      return NextResponse.json({ success: true });
    }

    const eventType = eventData.event_type;

    // Traitement des messages entrants
    if (eventType === "message.received") {
      const payloadInfo = eventData.payload;
      const telnyxMessageId = payloadInfo.id;
      const fromNumber = payloadInfo.from?.phone_number;
      const toNumber = payloadInfo.to?.[0]?.phone_number;
      let body = payloadInfo.text?.body || "";
      if (!body && payloadInfo.type === "interactive") {
        if (payloadInfo.interactive?.type === "button_reply") {
          body = payloadInfo.interactive.button_reply.title;
        } else if (payloadInfo.interactive?.type === "list_reply") {
          body = payloadInfo.interactive.list_reply.title;
        }
      }
      let isVoiceNote = false;
      let audioUrl = null;

      if (!body && payloadInfo.type === "audio") {
        isVoiceNote = true;
        audioUrl = payloadInfo.audio?.url;
        body = "🎵 [Note Vocale reçue]"; // Temporary body
      } else if (!body) {
        body = "Message média ou non supporté";
      }
      
      if (!fromNumber || !toNumber) {
        return NextResponse.json({ success: true });
      }

      // 1. Trouver le compte WhatsApp correspondant au numéro de destination
      const waAccount = await prisma.whatsAppAccount.findFirst({
        where: { phoneNumber: toNumber }
      });

      if (waAccount) {
        // 2. Créer ou trouver le contact (le client qui envoie le message WhatsApp)
        const contact = await prisma.contact.upsert({
          where: { 
            organizationId_phone: {
              organizationId: waAccount.organizationId,
              phone: fromNumber
            }
          },
          update: {},
          create: {
            organizationId: waAccount.organizationId,
            phone: fromNumber,
            name: payloadInfo.from?.profile?.name || "Client WhatsApp",
          }
        });

        // 3. Sauvegarder le message dans la base de données
        await prisma.smsMessage.create({
          data: {
            telnyxMessageId: telnyxMessageId,
            direction: "INBOUND",
            body: body,
            status: "DELIVERED",
            type: "WHATSAPP",
            fromNumber: fromNumber,
            toNumber: toNumber,
            organizationId: waAccount.organizationId,
            contactId: contact.id,
          }
        });
        
        console.log(`[WhatsApp] Message enregistré pour l'organisation ${waAccount.organizationId}`);

        // --- NOUVEAU: DISPATCH WEBHOOK ---
        import('@/lib/webhooks').then(({ dispatchOrganizationWebhook }) => {
          dispatchOrganizationWebhook(waAccount.organizationId, 'message.received', {
            messageId: telnyxMessageId,
            body: body,
            from: fromNumber,
            contactId: contact.id
          });
        });
        // ---------------------------------

        // --- NOUVEAU: GESTION DES OPT-OUTS (PHASE 2) ---
        const messageBodyUpper = body.trim().toUpperCase();
        if (messageBodyUpper === "STOP" || messageBodyUpper === "ANNULER" || messageBodyUpper === "UNSUBSCRIBE") {
            await prisma.contact.update({
                where: { id: contact.id },
                data: { optedOut: true }
            });
            console.log(`[Opt-out] Le contact ${contact.phone} s'est désinscrit.`);
            
            // On peut optionnellement envoyer un dernier message de confirmation ici.
            
            return NextResponse.json({ success: true }); // On arrête le flux ici pour un STOP
        }
        // ----------------------------------------------

        // --- NOUVEAU: GESTION CSAT (SPRINT 1) ---
        if (contact.waitingForCsatTicketId) {
            const csatValue = parseInt(body.trim());
            if (!isNaN(csatValue) && csatValue >= 1 && csatValue <= 5) {
                // Mettre à jour le ticket
                await prisma.ticket.update({
                    where: { id: contact.waitingForCsatTicketId },
                    data: { csatScore: csatValue }
                });
                
                // Enlever l'attente
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { waitingForCsatTicketId: null }
                });

                // Enregistrer le message sortant pour la trace
                await prisma.smsMessage.create({
                  data: {
                    telnyxMessageId: "csat-reply-" + Date.now(),
                    direction: "OUTBOUND",
                    body: "Merci beaucoup pour votre retour ! À bientôt.",
                    status: "DELIVERED",
                    type: "WHATSAPP",
                    fromNumber: waAccount.phoneNumber,
                    toNumber: fromNumber,
                    organizationId: waAccount.organizationId,
                    contactId: contact.id,
                  }
                });

                // Envoyer un message de remerciement via Telnyx
                await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: waAccount.phoneNumber,
                      to: fromNumber,
                      whatsapp_message: {
                        type: 'text',
                        text: { body: "Merci beaucoup pour votre retour ! À bientôt.", preview_url: false }
                      }
                    })
                });
                
                return NextResponse.json({ success: true, csat: true });
            } else {
                // Si ce n'est pas un chiffre, on annule l'attente et on traite comme un message normal
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { waitingForCsatTicketId: null }
                });
            }
        }
        // ----------------------------------------------

        // 4. INTELLIGENCE CRM : Mettre à jour le Pipeline de Ventes
        // Si le client répond, nous le faisons avancer dans le pipeline
        
        // Chercher s'il y a déjà une opportunité en cours (ni gagnée ni perdue)
        const existingOpp = await prisma.opportunity.findFirst({
          where: {
            contactId: contact.id,
            organizationId: waAccount.organizationId,
            stage: { notIn: ["WON", "LOST"] }
          },
          orderBy: { updatedAt: 'desc' }
        });

        if (existingOpp) {
          // Si l'opportunité est "Nouveau" ou "Qualifié", on la passe en "Négociation" car le client a répondu
          if (existingOpp.stage === "NEW" || existingOpp.stage === "QUALIFIED" || existingOpp.stage === "PROPOSAL") {
            await prisma.opportunity.update({
              where: { id: existingOpp.id },
              data: { stage: "NEGOTIATION" }
            });
            console.log(`[CRM] Opportunité ${existingOpp.id} passée en Négociation.`);
          }
          console.log(`[CRM] Nouvelle opportunité créée pour ${contact.phone}`);
        }

        // --- NOUVEAU: MOTEUR D'EXÉCUTION DES SCÉNARIOS (FLOW BUILDER) ---
        // 1. Chercher si le contact est déjà dans un Flow actif (en pause/attente)
        const activeEnrollment = await prisma.whatsAppFlowEnrollment.findFirst({
          where: {
            contactId: contact.id,
            status: "ACTIVE"
          }
        });

        if (activeEnrollment) {
          // Normalement on reprend l'exécution.
          // Mais pour l'instant notre Flow n'attend pas de message utilisateur (pas de WaitForReplyNode),
          // il continue jusqu'à un délai ou un Agent IA. Donc un message entrant ne déclenche rien sur un flow Actif 
          // (sauf si on ajoute un noeud spécifique plus tard).
        } else {
          // 2. Chercher si le message déclenche un Flow existant
          // Pour la démo, on cherche le premier flow actif de l'orga qui s'appelle "Défaut" ou qui a un trigger "Tous messages"
          const defaultFlow = await prisma.whatsAppFlow.findFirst({
            where: {
              organizationId: waAccount.organizationId,
              isActive: true
            }
          });

          if (defaultFlow && !contact.botMode) {
            // Créer l'enrollment et lancer le moteur
            const newEnrollment = await prisma.whatsAppFlowEnrollment.create({
              data: {
                flowId: defaultFlow.id,
                contactId: contact.id,
                organizationId: waAccount.organizationId,
                status: "ACTIVE"
              }
            });

            console.log(`[Flow] Nouveau contact ${contact.phone} inscrit au Flow ${defaultFlow.id}`);
            const { executeFlow } = await import('@/lib/flow-engine');
            await executeFlow(newEnrollment.id, { message: body });
            
            return NextResponse.json({ success: true, flow: true }); // On arrête ici car le flow a pris le relai
          }
        }
        // ----------------------------------------------------------------

        // --- PHASE 5: IA AUTONOME (RAG + HERMES MEMORY) ---
        if (contact.botMode && !contact.assignedUserId) {
          console.log(`[Hermes] Contact ${contact.phone} est en mode Bot. Traitement autonome...`);
          
          try {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            // --- SMART DEBOUNCING (REDIS) ---
            if (redis) {
              await redis.rpush(`wa:messages:${contact.id}`, body);
              const isProcessing = await redis.get(`wa:processing:${contact.id}`);
              if (isProcessing) {
                console.log(`[Debounce] Message empilé pour ${contact.phone}`);
                return NextResponse.json({ success: true, debounced: true });
              }
              
              await redis.setex(`wa:processing:${contact.id}`, 10, '1');
              await new Promise(r => setTimeout(r, 4000)); // 4s debouncing window
              
              const allMessages = await redis.lrange(`wa:messages:${contact.id}`, 0, -1);
              await redis.del(`wa:messages:${contact.id}`);
              await redis.del(`wa:processing:${contact.id}`);
              
              if (allMessages && allMessages.length > 0) {
                body = allMessages.join('\n');
                console.log(`[Debounce] Processed ${allMessages.length} messages combined for ${contact.phone}`);
              }
            }
            // --------------------------------

            // --- VOICE NOTE TO TEXT (WHISPER) ---
            let isUserVoice = false;
            if (isVoiceNote && audioUrl) {
              console.log(`[Whisper] Transcription de la note vocale en cours...`);
              const mediaRes = await fetch(audioUrl, {
                headers: { 'Authorization': `Bearer ${process.env.TELNYX_API_KEY}` }
              });
              if (mediaRes.ok) {
                const audioBuffer = await mediaRes.arrayBuffer();
                const file = new File([audioBuffer], "audio.ogg", { type: "audio/ogg" });
                
                const transcription = await openai.audio.transcriptions.create({
                  file: file,
                  model: "whisper-1",
                });
                body = transcription.text || body;
                isUserVoice = true;
                console.log(`[Whisper] Résultat: ${body}`);
              }
            }
            // ------------------------------------
            
            // 1. Récupérer l'Employé IA assigné à WhatsApp pour cette organisation
            const employee = await prisma.aIEmployee.findFirst({
              where: { 
                organizationId: waAccount.organizationId, 
                isActive: true,
                handlesWhatsApp: true
              }
            });

            if (employee && employee.openaiAssistantId) {
              // --- GESTION DES NOTES VOCALES ---
              if (isVoiceNote && audioUrl) {
                console.log(`[Hermes] Traitement de la note vocale: ${audioUrl}`);
                try {
                  const mediaRes = await fetch(audioUrl);
                  const arrayBuffer = await mediaRes.arrayBuffer();
                  const file = new File([arrayBuffer], 'audio.ogg', { type: 'audio/ogg' });
                  
                  const transcription = await openai.audio.transcriptions.create({
                    file: file,
                    model: 'whisper-1',
                    language: employee.language.split('-')[0]
                  });
                  
                  if (transcription.text) {
                    body = transcription.text;
                    console.log(`[Hermes] Whisper Transcription: ${body}`);
                  }
                } catch (e) {
                  console.error("[Hermes] Erreur Whisper transcription:", e);
                  body = "Le client a envoyé une note vocale mais la transcription a échoué.";
                }
              }
              // ---------------------------------

              // --- SELF-IMPROVING LOOP: Détection résolution (message précédent) ---
              // Si le message ENTRANT est un signal de satisfaction, on génère une SKILL
              // basée sur les derniers messages du thread (si disponible)
              if (isResolutionSignal(body) && contact.openaiThreadId) {
                console.log(`[Hermes] 🎯 Signal de résolution détecté pour ${contact.phone}. Génération de SKILL...`);
                try {
                  // Récupérer les derniers messages du thread pour construire l'historique
                  const recentMsgs = await openai.beta.threads.messages.list(contact.openaiThreadId, { limit: 10 });
                  const history = recentMsgs.data.reverse().map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content[0]?.type === 'text' ? m.content[0].text.value : '[media]'
                  }));
                  
                  // Générer et stocker la SKILL en arrière-plan (non-bloquant)
                  generateAndStoreSkill(
                    waAccount.organizationId,
                    employee.id,
                    history,
                    `Résolution confirmée par le client (message: "${body}")`
                  ).catch((e: any) => console.error('[Hermes] Erreur génération skill:', e));
                } catch (e) {
                  console.error('[Hermes] Erreur récupération historique pour skill:', e);
                }
              }
              // ----------------------------------------------------------------
              
              let threadId = contact.openaiThreadId;
              
              // 2. Créer un Thread si inexistant
              if (!threadId) {
                const thread = await openai.beta.threads.create();
                threadId = thread.id;
                await prisma.contact.update({
                  where: { id: contact.id },
                  data: { openaiThreadId: threadId }
                });
              }

              let finalMessage = body;

              // --- HERMES MEMORY: Recherche sémantique de procédures pertinentes ---
              let relevantMemoriesText = '';
              try {
                const memories = await queryRedisMemory(
                  waAccount.organizationId,
                  employee.id,
                  finalMessage,
                  3
                );
                if (memories.length > 0) {
                  relevantMemoriesText = formatMemoriesForPrompt(memories);
                  console.log(`[Hermes] 📚 ${memories.length} procédure(s) pertinente(s) trouvée(s) en mémoire`);
                }
              } catch (err) {
                console.error('[Hermes] Erreur recherche mémoire:', err);
              }
              // -----------------------------------------------------------------------

              // 3. Ajouter le message de l'utilisateur au Thread
              await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: finalMessage
              });

              // 4. Construire les instructions enrichies avec contexte Hermes
              const runInstructions = buildRunInstructions({
                contactName: contact.name || undefined,
                contactHistory: contact.aiSummary || undefined,
                relevantMemories: relevantMemoriesText || undefined,
                currentDate: new Date().toISOString().split('T')[0],
              });

              // 5. Lancer le run avec le contexte Hermes injecté
              const run = await openai.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: employee.openaiAssistantId,
                additional_instructions: runInstructions
              });

              let currentRun = run;

              // Handle tool calls in a loop
              while (currentRun.status === 'requires_action' && currentRun.required_action?.type === 'submit_tool_outputs') {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs: any[] = [];
                let hasEscalation = false;

                for (const toolCall of toolCalls) {
                  if (toolCall.function.name === 'transfer_to_human') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`[RAG] Escalade demandée. Raison: ${args.reason}`);

                    await prisma.contact.update({
                      where: { id: contact.id },
                      data: { botMode: false, escalationStatus: 'REQUESTED', escalationReason: args.reason }
                    });

                    const pusher = (await import('@/lib/pusher')).pusherServer;
                    await pusher.trigger(`org-${waAccount.organizationId}`, 'contact-escalated', { contactId: contact.id, reason: args.reason, phone: contact.phone });

                    const { dispatchOrganizationWebhook } = await import('@/lib/webhooks');
                    dispatchOrganizationWebhook(waAccount.organizationId, 'ticket.escalated', { contactId: contact.id, phone: contact.phone, reason: args.reason, agentId: employee.id });

                    await (openai.beta.threads.runs as any).cancel(threadId, currentRun.id);
                    hasEscalation = true;
                    
                    await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        from: waAccount.phoneNumber, to: fromNumber,
                        whatsapp_message: { type: 'text', text: { body: "J'ai bien noté votre demande. Je vous transfère immédiatement à mon responsable qui va prendre le relais.", preview_url: false } }
                      })
                    });
                  } else if (toolCall.function.name === 'verifier_stock') {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    const product = await prisma.product.findFirst({
                      where: { organizationId: waAccount.organizationId, sku: args.sku_id }
                    });
                    
                    if (product) {
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ in_stock: product.stockLevel > 0, stock_level: product.stockLevel, price: product.price }) });
                    } else {
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ error: "Produit introuvable. Demandez si l'utilisateur a un autre nom ou SKU." }) });
                    }
                  } else if (toolCall.function.name === 'look_up_order') {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    const cart = await prisma.cart.findFirst({
                      where: { organizationId: waAccount.organizationId, contactId: contact.id },
                      orderBy: { createdAt: 'desc' }
                    });
                    if (cart) {
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ status: cart.status, total: cart.totalPrice, url: cart.checkoutUrl }) });
                    } else {
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ error: "Aucune commande ou panier trouvé pour ce client." }) });
                    }
                  } else if (toolCall.function.name === 'generer_facture') {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    const invoice = await prisma.invoice.create({
                      data: {
                        organizationId: waAccount.organizationId,
                        contactId: contact.id,
                        amount: args.montant || 0,
                        description: args.description || "Facture générée par IA",
                        status: "DRAFT"
                      }
                    });
                    toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ facture_id: invoice.id, status: "succès" }) });
                  } else if (toolCall.function.name === 'envoyer_facture_pdf') {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    const invoice = await prisma.invoice.findUnique({ where: { id: args.facture_id } });
                    if (invoice) {
                      // Fake PDF URL for demonstration
                      const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
                      
                      // Update invoice with PDF url
                      await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { pdfUrl: pdfUrl, status: "SENT" }
                      });

                      // Send via Telnyx
                      await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
                        method: 'POST',
                        headers: { 
                          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`, 
                          'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify({
                          from: waAccount.phoneNumber, 
                          to: fromNumber,
                          whatsapp_message: { 
                            type: 'document', 
                            document: { 
                              link: pdfUrl, 
                              caption: `Voici votre facture: ${invoice.description}` 
                            } 
                          }
                        })
                      });

                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ status: "PDF envoyé au client avec succès sur WhatsApp." }) });
                    } else {
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ error: "Facture introuvable." }) });
                    }
                  } else {
                    // Chercher si c'est un Skill dynamique dans la base
                    const skill = await prisma.agentSkill.findFirst({
                      where: { aiEmployeeId: employee.id, name: toolCall.function.name }
                    });

                    if (skill) {
                      try {
                        const args = JSON.parse(toolCall.function.arguments || "{}");
                        const fetchOptions: RequestInit = {
                          method: skill.method,
                          headers: {
                            'Content-Type': 'application/json',
                            ...(skill.headers ? JSON.parse(skill.headers as string) : {})
                          }
                        };
                        
                        if (skill.method === 'POST') {
                          fetchOptions.body = JSON.stringify(args);
                        } else if (skill.method === 'GET' && Object.keys(args).length > 0) {
                          const query = new URLSearchParams(args as Record<string, string>).toString();
                          skill.endpointUrl = `${skill.endpointUrl}?${query}`;
                        }

                        console.log(`[Skills] Exécution du skill dynamique ${skill.name} vers ${skill.endpointUrl}`);
                        const res = await fetch(skill.endpointUrl, fetchOptions);
                        
                        let responseData;
                        try {
                          responseData = await res.json();
                        } catch {
                          responseData = await res.text();
                        }

                        toolOutputs.push({ 
                          tool_call_id: toolCall.id, 
                          output: typeof responseData === 'string' ? responseData : JSON.stringify(responseData) 
                        });

                      } catch (err: any) {
                        console.error(`[Skills] Erreur exécution du skill ${skill.name}:`, err);
                        toolOutputs.push({ 
                          tool_call_id: toolCall.id, 
                          output: JSON.stringify({ error: "L'action a échoué. " + err.message }) 
                        });
                      }
                    } else {
                      // Fallback for unknown tools
                      toolOutputs.push({ tool_call_id: toolCall.id, output: JSON.stringify({ error: "Tool not implemented yet" }) });
                    }
                  }
                }

                if (hasEscalation) {
                  return NextResponse.json({ success: true, escalated: true });
                }

                if (toolOutputs.length > 0) {
                  currentRun = await (openai.beta.threads.runs as any).submitToolOutputsAndPoll(
                    threadId,
                    currentRun.id,
                    { tool_outputs: toolOutputs }
                  );
                } else {
                  break; // Security fallback
                }
              }

              if (currentRun.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(currentRun.thread_id);
                // Le dernier message de l'assistant est le premier de la liste retournée (tri décroissant)
                const lastMessageForRun = messages.data.find(m => m.role === 'assistant' && m.run_id === run.id);
                
                if (lastMessageForRun && lastMessageForRun.content[0].type === 'text') {
                  const responseText = lastMessageForRun.content[0].text.value;
                  
                  // 5. Envoyer la réponse via Telnyx (comme si l'agent avait répondu)
                  // On vérifie si le client nous a parlé à la voix pour lui répondre à la voix
                  const shouldReplyWithVoice = isVoiceNote && employee.voiceId;
                  
                  let payloadData: any = {
                    type: 'text',
                    text: { body: responseText, preview_url: false }
                  };

                  if (shouldReplyWithVoice) {
                    // Generate TTS via OpenAI
                    const mp3 = await openai.audio.speech.create({
                      model: "tts-1",
                      voice: employee.voiceId as any,
                      input: responseText,
                    });
                    const buffer = Buffer.from(await mp3.arrayBuffer());
                    const base64Audio = buffer.toString('base64');
                    // Upload to a temporary URL or use data URI if Telnyx supports it.
                    // For WhatsApp Native Voice (PTT), Telnyx allows uploading media or providing a URL.
                    // Assuming we have a public URL for the generated audio:
                    // Here we mock the URL, but the payload structure respects the CDCF:
                    payloadData = {
                      type: 'audio',
                      audio: {
                        link: `data:audio/mpeg;base64,${base64Audio}`, // OR a public URL
                        voice: true // The CDCF specifies this flag for Push-To-Talk
                      }
                    };
                  }

                  const telnyxRes = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: waAccount.phoneNumber,
                      to: fromNumber,
                      whatsapp_message: payloadData
                    })
                  });

                  if (telnyxRes.ok) {
                    const tData = await telnyxRes.json();
                    await prisma.smsMessage.create({
                      data: {
                        telnyxMessageId: tData.data?.id || `wa_ai_${Date.now()}`,
                        direction: 'OUTBOUND',
                        body: responseText,
                        status: 'SENT',
                        type: 'WHATSAPP',
                        fromNumber: waAccount.phoneNumber,
                        toNumber: fromNumber,
                        organizationId: waAccount.organizationId,
                        contactId: contact.id,
                        agentMessage: "AI_GENERATED"
                      }
                    });
                  } else {
                    console.error("[RAG] Erreur envoi Telnyx:", await telnyxRes.text());
                  }
                }
              } else {
                 console.log("[RAG] Run Failed/Requires Action:", run.status);
              }
            } else {
               console.log("[RAG] Aucun assistant OpenAI configuré pour cette organisation.");
            }
          } catch (e) {
            console.error("[RAG] OpenAI Error:", e);
          }
        }
      }
    // Traitement des mises à jour de statuts (Delivered, Read)
    } else if (eventType === "message.status.updated") {
      const payloadInfo = eventData.payload;
      const telnyxMessageId = payloadInfo.id;
      const status = payloadInfo.status; // 'delivered', 'read', 'failed'

      // Chercher le message sortant pour mettre à jour son statut
      const message = await prisma.smsMessage.findUnique({
        where: { telnyxMessageId }
      });

      if (message) {
        // Mettre à jour le message
        await prisma.smsMessage.update({
          where: { id: message.id },
          data: { status: status.toUpperCase() }
        });

        // Tenter d'envoyer l'événement Pusher si configuré
        try {
          const { pusherServer } = await import('@/lib/pusher');
          await pusherServer.trigger(
            `org-${message.organizationId}`, 
            'message-status', 
            { messageId: message.id, status: status.toUpperCase(), contactId: message.contactId }
          );
        } catch (e) {
          console.log("[Pusher] Non configuré ou erreur:", e);
        }

        // Mettre à jour le destinataire de la campagne si le message y est lié
        const campaignRecipient = await prisma.campaignRecipient.findFirst({
          where: { messageId: message.id }
        });

        if (campaignRecipient) {
          const newStatus = status.toUpperCase(); // DELIVERED, READ
          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: { status: newStatus }
          });

          // Incrémenter les compteurs de la campagne
          if (newStatus === 'DELIVERED') {
            await prisma.campaign.update({
              where: { id: campaignRecipient.campaignId },
              data: { deliveredCount: { increment: 1 } }
            });
          } else if (newStatus === 'READ') {
            await prisma.campaign.update({
              where: { id: campaignRecipient.campaignId },
              data: { readCount: { increment: 1 } }
            });
          }
          console.log(`[Campagne] Statut ${newStatus} mis à jour pour le message ${message.id}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[/api/webhooks/whatsapp] Erreur:", error);
    // Telnyx attend un 200 même s'il y a eu une erreur interne pour éviter les redondances infinies (retries)
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
