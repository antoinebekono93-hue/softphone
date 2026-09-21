import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRequiresAction } from "@/lib/ai/tool-runner";
import { queryRedisMemory, generateAndStoreSkill, formatMemoriesForPrompt } from "@/lib/hermes-memory";
import { buildRunInstructions, isResolutionSignal } from "@/lib/hermes-prompt";
import { redis } from "@/lib/redis";
import { getConfiguredTelnyxClient, getConfiguredTelnyxPublicKey } from "@/lib/telnyx";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { sendWhatsAppForOrganization } from "@/lib/whatsapp";

export const maxDuration = 60;

export async function POST(req: Request) {
  let claimedEventId: string | null = null;
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    if (!signature || !timestamp) return new NextResponse('Missing Telnyx signature', { status: 401 });
    let eventData: any;
    try {
      const [telnyx, publicKey] = await Promise.all([
        getConfiguredTelnyxClient(),
        getConfiguredTelnyxPublicKey(),
      ]);
      eventData = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey).data;
    } catch (error) {
      console.error('[WhatsApp webhook] Signature verification failed', error);
      return new NextResponse('Invalid Telnyx signature', { status: 401 });
    }
    if (!eventData || typeof eventData.id !== 'string' || !eventData.id
      || typeof eventData.event_type !== 'string' || !eventData.event_type) {
      return new NextResponse('Invalid Telnyx event', { status: 400 });
    }
    try {
      await prisma.webhookEvent.create({
        data: { provider: 'TELNYX_WHATSAPP', eventId: eventData.id, type: eventData.event_type },
      });
      claimedEventId = eventData.id;
    } catch (error: any) {
      if (error?.code === 'P2002') return NextResponse.json({ success: true, duplicate: true });
      throw error;
    }
    const eventType = eventData.event_type;

    // Traitement des messages entrants
    if (eventType === "message.received") {
      const payloadInfo = eventData.payload;
      const telnyxMessageId = payloadInfo.id;
      const fromNumber = canonicalizePhoneNumber(payloadInfo.from?.phone_number);
      const toNumber = canonicalizePhoneNumber(payloadInfo.to?.[0]?.phone_number);
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
        await prisma.smsMessage.upsert({
          where: { telnyxMessageId },
          update: {},
          create: {
            telnyxMessageId: telnyxMessageId,
            direction: "INBOUND",
            body: body,
            status: "DELIVERED",
            type: "WHATSAPP",
            fromNumber: fromNumber,
            toNumber: toNumber,
            organizationId: waAccount.organizationId,
            contactId: contact.id,
          },
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

                await sendWhatsAppForOrganization({
                  organizationId: waAccount.organizationId,
                  to: fromNumber,
                  content: {
                    type: 'text',
                    text: { body: "Merci beaucoup pour votre retour ! À bientôt.", preview_url: false },
                  },
                  agentMessage: true,
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
              let currentRun = await openai.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: employee.openaiAssistantId,
                additional_instructions: runInstructions
              });

              if (currentRun.status === 'requires_action') {
                const actionResult = await handleRequiresAction(
                  currentRun,
                  threadId,
                  contact.id,
                  waAccount.organizationId,
                  openai
                );
                currentRun = actionResult.run;
                if (actionResult.escalated) {
                  return NextResponse.json({ success: true, escalated: true });
                }
              }

              if (currentRun.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(currentRun.thread_id);
                // Le dernier message de l'assistant est le premier de la liste retournée (tri décroissant)
                const lastMessageForRun = messages.data.find(m => m.role === 'assistant' && m.run_id === currentRun.id);
                
                if (lastMessageForRun && lastMessageForRun.content[0].type === 'text') {
                  const responseText = lastMessageForRun.content[0].text.value;
                  
                  // Une réponse audio exige une URL HTTPS publique. Tant que le
                  // stockage média n'est pas configuré, répondre en texte évite le
                  // faux data URI que Telnyx/WhatsApp refuserait.
                  const payloadData: any = {
                    type: 'text',
                    text: { body: responseText, preview_url: false }
                  };
                  await sendWhatsAppForOrganization({
                    organizationId: waAccount.organizationId,
                    to: fromNumber,
                    content: payloadData,
                    agentMessage: true,
                  });
                }
              } else {
                 console.log("[RAG] Run Failed/Requires Action:", currentRun.status);
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
          const { getPusherServer } = await import('@/lib/pusher');
          await getPusherServer()?.trigger(
            `org-${message.organizationId}`, 
            'message-status', 
            { messageId: message.id, status: status.toUpperCase(), contactId: message.contactId }
          );
        } catch (e) {
          console.log("[Pusher] Non configuré ou erreur:", e);
        }

        // Mettre à jour le destinataire de la campagne si le message y est lié
        const campaignRecipient = await prisma.campaignRecipient.findFirst({
          where: { messageId: telnyxMessageId }
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
    if (claimedEventId) {
      await prisma.webhookEvent.deleteMany({
        where: { provider: 'TELNYX_WHATSAPP', eventId: claimedEventId },
      }).catch(() => undefined);
    }
    console.error("[/api/webhooks/whatsapp] Erreur:", error);
    // A non-2xx response is intentional: Telnyx can retry and the durable claim
    // above prevents successful events from being processed twice.
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
