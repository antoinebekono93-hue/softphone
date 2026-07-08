import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        } else {
          // S'il n'y a pas d'opportunité, on en crée une automatiquement (Lead entrant)
          await prisma.opportunity.create({
            data: {
              name: `Lead WhatsApp: ${contact.name || contact.phone}`,
              stage: "QUALIFIED", // Client qualifié puisqu'il a interagi
              expectedRevenue: 0,
              contactId: contact.id,
              organizationId: waAccount.organizationId,
            }
          });
          console.log(`[CRM] Nouvelle opportunité créée pour ${contact.phone}`);
        }

        // --- PHASE 5: IA AUTONOME (RAG) ---
        if (contact.botMode && !contact.assignedUserId) {
          console.log(`[RAG] Contact ${contact.phone} est en mode Bot. Traitement via OpenAI...`);
          
          try {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
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
                console.log(`[RAG] Traitement de la note vocale: ${audioUrl}`);
                try {
                  // 1. Download Media
                  const mediaRes = await fetch(audioUrl);
                  const arrayBuffer = await mediaRes.arrayBuffer();
                  
                  // NOTE: En production avec FFmpeg (selon le CDCF) :
                  // a. fs.writeFileSync('temp.ogg', Buffer.from(arrayBuffer))
                  // b. execSync('ffmpeg -i temp.ogg -ar 16000 temp.wav')
                  // c. const file = fs.createReadStream('temp.wav')
                  
                  // Pour OpenAI Whisper, on peut utiliser directement le fichier en simulant un nom
                  const file = new File([arrayBuffer], 'audio.ogg', { type: 'audio/ogg' });
                  
                  const transcription = await openai.audio.transcriptions.create({
                    file: file,
                    model: 'whisper-1',
                    language: employee.language.split('-')[0] // ex: 'fr'
                  });
                  
                  if (transcription.text) {
                    body = transcription.text;
                    console.log(`[RAG] Whisper Transcription: ${body}`);
                  }
                } catch (e) {
                  console.error("[RAG] Erreur Whisper transcription:", e);
                  body = "Le client a envoyé une note vocale mais la transcription a échoué.";
                }
              }
              // ---------------------------------
              
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

              // --- SMART DEBOUNCING (REDIS) ---
              let finalMessage = body;
              
              try {
                const { redis } = await import('@/lib/redis');
                if (redis) {
                  const bufferKey = `session:wa:${fromNumber}:buffer`;
                  const lockKey = `session:wa:${fromNumber}:lock`;
                  
                  // Add message to ZSET with current timestamp
                  const now = Date.now();
                  await redis.zadd(bufferKey, { score: now, member: `${now}||${body}` });
                  
                  // Wait 5 seconds to group messages
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  
                  // Try to acquire lock to process
                  const acquired = await redis.set(lockKey, "locked", { nx: true, ex: 10 });
                  
                  if (!acquired) {
                    console.log(`[Debouncer] Un autre processus gère la rafale pour ${fromNumber}`);
                    return NextResponse.json({ success: true });
                  }

                  // We have the lock, fetch all messages in buffer
                  const messages = await redis.zrange(bufferKey, 0, -1);
                  await redis.del(bufferKey); // Clear buffer
                  
                  if (messages && messages.length > 0) {
                    // Sort by timestamp just in case
                    const sorted = (messages as string[]).sort((a, b) => parseInt(a.split('||')[0]) - parseInt(b.split('||')[0]));
                    finalMessage = sorted.map(m => m.split('||')[1]).join('\n');
                    console.log(`[Debouncer] Fusion de ${messages.length} messages: ${finalMessage}`);
                  }
                }
              } catch (err) {
                console.error("[Debouncer] Redis error:", err);
              }
              // --------------------------------

              // 3. Ajouter le message de l'utilisateur au Thread
              await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: finalMessage
              });

              // 4. Lancer le run et attendre la fin
              const run = await openai.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: employee.openaiAssistantId,
                // On peut surcharger les instructions ici si besoin, par exemple en injectant le nom du contact
                additional_instructions: `Le client s'appelle ${contact.name || 'Client'}.`
              });

              let currentRun = run;

              // Handle tool calls for escalation
              if (currentRun.status === 'requires_action' && currentRun.required_action?.type === 'submit_tool_outputs') {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                for (const toolCall of toolCalls) {
                  if (toolCall.function.name === 'transfer_to_human') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`[RAG] Escalade demandée. Raison: ${args.reason}`);

                    // 1. Mettre à jour le contact (désactiver le bot)
                    await prisma.contact.update({
                      where: { id: contact.id },
                      data: {
                        botMode: false,
                        escalationStatus: 'REQUESTED',
                        escalationReason: args.reason
                      }
                    });

                    // 2. Notifier le Dashboard (via Pusher)
                    const pusher = (await import('@/lib/pusher')).pusherServer;
                    await pusher.trigger(
                      `org-${waAccount.organizationId}`,
                      'contact-escalated',
                      { contactId: contact.id, reason: args.reason, phone: contact.phone }
                    );

                    // 3. Informer le client et annuler le run OpenAI
                    await (openai.beta.threads.runs as any).cancel(threadId, currentRun.id);
                    
                    const telnyxRes = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
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
                          text: { body: "J'ai bien noté votre demande. Je vous transfère immédiatement à mon responsable qui va prendre le relais.", preview_url: false }
                        }
                      })
                    });

                    return NextResponse.json({ success: true, escalated: true });
                  }
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
