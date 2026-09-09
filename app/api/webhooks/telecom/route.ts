import { NextResponse } from 'next/server';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { executeAutomation } from '@/lib/automations';
import { preAuthorizeCall, settlePstnCall, releasePstnReservation } from '@/lib/pstn-billing';
import { getPusherServer } from '@/lib/pusher';
import { appCallChannels, PSTN_EVENTS } from '@/lib/app-call-channels';
import { canonicalizePhoneNumber, phoneNumberLookupCandidates } from '@/lib/phone-number';
import { activateFulfilledTelnyxOrder } from '@/lib/telnyx-number-purchase';
import { executePstnForward } from '@/lib/pstn-forwarding';

function decodeClientState(value: unknown): { outboundAttemptId?: string; rateProfile?: string } {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return {};
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    return decoded && typeof decoded === 'object' && !Array.isArray(decoded) ? decoded : {};
  } catch {
    return {};
  }
}

async function terminateProviderCall(callControlId: string, reason: string) {
  try {
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.hangup(callControlId, { command_id: crypto.randomUUID() });
  } catch (error) {
    console.error(`[Telnyx Webhook] Unable to terminate ${callControlId} (${reason})`, error);
  }
}

async function releaseAndTerminateRejectedCall(params: {
  organizationId: string;
  callControlId: string;
  callLogId: string;
  reason: string;
}) {
  const results = await Promise.allSettled([
    releasePstnReservation(params),
    terminateProviderCall(params.callControlId, params.reason),
  ]);
  const releaseResult = results[0];
  if (releaseResult.status === 'rejected') throw releaseResult.reason;
}

async function authorizeCallLog(params: {
  callLog: { id: string; organizationId: string; reservation?: { id: string } | null };
  callControlId: string;
  rateProfile: 'STANDARD' | 'AI_AGENT';
}) {
  if (params.callLog.reservation) return true;
  try {
    const result = await preAuthorizeCall({
      organizationId: params.callLog.organizationId,
      callControlId: params.callControlId,
      callLogId: params.callLog.id,
      rateProfile: params.rateProfile,
    });
    if (result.authorized) return true;
    await prisma.callLog.update({
      where: { id: params.callLog.id },
      data: { status: 'DENIED', endedAt: new Date() },
    });
    await terminateProviderCall(params.callControlId, result.reason ?? 'CALL_NOT_AUTHORIZED');
    return false;
  } catch (error) {
    console.error(`[Telnyx Webhook] Preauthorization failed for ${params.callControlId}`, error);
    await prisma.callLog.update({
      where: { id: params.callLog.id },
      data: { status: 'FAILED', endedAt: new Date() },
    }).catch(() => undefined);
    await terminateProviderCall(params.callControlId, 'PREAUTHORIZATION_ERROR');
    return false;
  }
}

async function findManagedPhoneNumber(raw: unknown) {
  const candidates = phoneNumberLookupCandidates(raw);
  if (candidates.length === 0) return null;
  return prisma.phoneNumber.findFirst({
    where: { number: { in: candidates }, status: 'ACTIVE' },
    include: { aiEmployee: true, assignedUser: { select: { id: true, name: true } } },
  });
}

function providerEventDate(event: any): Date {
  const candidate = event?.occurred_at ?? event?.payload?.occurred_at;
  if (typeof candidate === 'string') {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Destinataire humain d'un appel PSTN entrant sur un numéro :
 *  - assignedUser si le numéro en a un ;
 *  - sinon le premier utilisateur de l'organisation.
 * Utilisé à la fois pour `pstn:incoming` (call.initiated) et `pstn:ended`
 * (call.hangup) afin de toujours notifier le MÊME destinataire.
 */
async function resolveNotifyUser(phoneNumber: {
  assignedUser?: { id: string; name?: string | null } | null;
  organizationId: string;
}) {
  if (phoneNumber.assignedUser) return phoneNumber.assignedUser;
  return prisma.user.findFirst({
    where: { organizationId: phoneNumber.organizationId },
    select: { id: true, name: true },
  });
}

async function processEvent(event: any) {
  const eventId = typeof event?.id === 'string' && event.id.length <= 200 ? event.id : null;
  let claimed = false;
  try {
    if (!event || !event.event_type) return;

    if (eventId) {
      try {
        await prisma.webhookEvent.create({
          data: { provider: 'TELNYX', eventId, type: event.event_type },
        });
        claimed = true;
      } catch (error: any) {
        if (error?.code === 'P2002') {
          console.log(`[Telnyx Webhook] Duplicate event ignored: ${eventId}`);
          return;
        }
        throw error;
      }
    }

    const callControlId = event.payload?.call_control_id;
    const eventType = event.event_type;
    if (eventType.startsWith('call.') &&
        (typeof callControlId !== 'string' || callControlId.length === 0 || callControlId.length > 200)) {
      console.error(`[Telnyx Webhook] Invalid call_control_id for ${eventType}`);
      return;
    }

    if (eventType === 'advanced_order.status_update' ||
        eventType === 'number_order.status_update' ||
        eventType === 'inexplicit_number_order.status_update') {
      const orderId = event.payload?.order_id || event.payload?.id;
      const status = event.payload?.new_status || event.payload?.status;
      if (typeof orderId !== 'string' || !orderId || typeof status !== 'string' || !status) {
        throw new Error(`Invalid Telnyx number order event: ${eventType}`);
      }
      const providerStatus = status.toLowerCase();
      const fulfilled = ['success', 'completed', 'complete'].includes(providerStatus);
      await prisma.numberOrder.updateMany({
        where: { telnyxOrderId: orderId },
        // "success" is reserved for locally provisioned and routable numbers.
        data: { status: fulfilled ? 'provider_success' : providerStatus },
      });
      if (fulfilled) await activateFulfilledTelnyxOrder(orderId);
    }

    else if (eventType.startsWith('verification.')) {
      const verificationId = event.payload?.id;
      const status = event.payload?.status || event.payload?.response_code || eventType.split('.')[1];
      if (typeof verificationId !== 'string' || !verificationId || typeof status !== 'string' || !status) {
        throw new Error(`Invalid Telnyx verification event: ${eventType}`);
      }
      await prisma.verificationLog.updateMany({
        where: { id: verificationId },
        data: { status },
      });
    }

    else if (eventType === 'call.initiated') {
      const direction = event.payload.direction; // 'incoming' or 'outgoing'
      const to = event.payload.to;
      const from = event.payload.from;

      console.log(`[Telnyx Webhook] Call Initiated from ${from} to ${to}`);

      // Log both inbound and outbound calls. Outbound calls previously had no
      // CallLog/reservation, so their completed duration could not be billed.
      if (direction === 'incoming') {
        const phoneNumber = await findManagedPhoneNumber(to);

        if (phoneNumber) {
          const createdCallLog = await prisma.callLog.upsert({
            where: { telnyxCallControlId: callControlId },
            update: {},
            create: {
              telnyxCallControlId: callControlId,
              direction: 'INBOUND',
              fromNumber: canonicalizePhoneNumber(from) ?? from,
              toNumber: phoneNumber.number,
              organizationId: phoneNumber.organizationId,
              phoneNumberId: phoneNumber.id,
              status: 'INITIATED',
              callPurpose: 'PSTN_INBOUND',
              ...(phoneNumber.incomingRoutingEnabled && phoneNumber.incomingRoutingMode !== 'APP' && phoneNumber.forwardToE164 ? {
                forwardStatus: 'SCHEDULED',
                forwardToE164: phoneNumber.forwardToE164,
                forwardCommandId: crypto.randomUUID(),
                forwardDueAt: new Date(Date.now() + (phoneNumber.incomingRoutingMode === 'APP_THEN_FORWARD' ? phoneNumber.ringAppSeconds * 1000 : 0)),
              } : {}),
            },
            include: { reservation: { select: { id: true } } },
          });

          const rateProfile = phoneNumber.aiEmployee?.isActive ? 'AI_AGENT' : 'STANDARD';
          if (!await authorizeCallLog({ callLog: createdCallLog, callControlId, rateProfile })) return;

          const routingMode = phoneNumber.incomingRoutingEnabled ? phoneNumber.incomingRoutingMode : 'APP';
          if ((routingMode === 'FORWARD' || routingMode === 'APP_THEN_FORWARD') && !phoneNumber.forwardToE164) {
            await releaseAndTerminateRejectedCall({
              organizationId: createdCallLog.organizationId,
              callControlId,
              callLogId: createdCallLog.id,
              reason: 'FORWARD_DESTINATION_MISSING',
            });
            return;
          }

          if (routingMode === 'FORWARD') {
            await executePstnForward(createdCallLog.id);
            return;
          }

          // If there is an active AI Agent assigned to this number, take over the call
          if (phoneNumber.aiEmployee && phoneNumber.aiEmployee.isActive) {
            const telnyx = await getConfiguredTelnyxClient();
            await telnyx.calls.actions.answer(callControlId, { command_id: crypto.randomUUID() });
            console.log(`[CALL_INCOMING_RECEIVED] ${callControlId} org=${phoneNumber.organizationId} direction=${direction} target=AI_AGENT`);
          } else {
            // ── Appel PSTN entrant vers un utilisateur humain ──────────────
            // Le serveur notifie l'utilisateur via Pusher pour afficher l'UI
            // d'appel entrant, même si le SIP WebRTC natif fonctionne aussi.
            const notifyUser = await resolveNotifyUser(phoneNumber);

            if (notifyUser) {
              console.log(`[CALL_INCOMING_ROUTED] ${callControlId} org=${phoneNumber.organizationId} recipient=${notifyUser.id}`);
              try {
                const pusher = getPusherServer();
                if (!pusher) throw new Error('PUSHER_NOT_CONFIGURED');
                await pusher.trigger(
                  appCallChannels.user(notifyUser.id),
                  PSTN_EVENTS.INCOMING,
                  {
                    callControlId,
                    from: canonicalizePhoneNumber(from) ?? from,
                    to: phoneNumber.number,
                    phoneNumberId: phoneNumber.id,
                    organizationId: phoneNumber.organizationId,
                    callerName: null,
                  },
                );
                console.log(`[CALL_INCOMING_PUSHER_SENT] ${callControlId} user=${notifyUser.id}`);
              } catch (pusherErr) {
                console.error(`[CALL_INCOMING_PUSHER_SENT] ${callControlId} user=${notifyUser.id} ERREUR`, pusherErr);
                if (routingMode === 'APP_THEN_FORWARD') {
                  await prisma.callLog.updateMany({
                    where: { id: createdCallLog.id, forwardStatus: 'SCHEDULED', status: { in: ['INITIATED', 'RINGING'] } },
                    data: { forwardDueAt: new Date() },
                  });
                  await executePstnForward(createdCallLog.id);
                  return;
                }
                await prisma.callLog.update({
                  where: { id: createdCallLog.id },
                  data: { status: 'FAILED', endedAt: new Date() },
                });
                await releaseAndTerminateRejectedCall({
                  organizationId: createdCallLog.organizationId,
                  callControlId,
                  callLogId: createdCallLog.id,
                  reason: 'NOTIFICATION_FAILED',
                });
              }
            } else {
              console.error(`[CALL_INCOMING_ROUTED] ${callControlId} org=${phoneNumber.organizationId} — aucun utilisateur disponible`);
              if (routingMode === 'APP_THEN_FORWARD') {
                await prisma.callLog.updateMany({
                  where: { id: createdCallLog.id, forwardStatus: 'SCHEDULED', status: { in: ['INITIATED', 'RINGING'] } },
                  data: { forwardDueAt: new Date() },
                });
                await executePstnForward(createdCallLog.id);
                return;
              }
              await prisma.callLog.update({
                where: { id: createdCallLog.id },
                data: { status: 'FAILED', endedAt: new Date() },
              });
              await releaseAndTerminateRejectedCall({
                organizationId: createdCallLog.organizationId,
                callControlId,
                callLogId: createdCallLog.id,
                reason: 'NO_RECIPIENT',
              });
            }
            // Le SIP WebRTC natif (Telnyx SDK) reste le canal de média principal.
            // Pusher sert de notification fiable pour afficher l'UI d'appel entrant.
          }
        } else {
          console.error(`[CALL_INCOMING_REJECTED] ${callControlId} — numéro inactif ou non géré: ${to}`);
          await terminateProviderCall(callControlId, 'UNMANAGED_DESTINATION');
        }
      } else if (direction === 'outgoing') {
        // Only a known application caller ID may create a billable record.
        const phoneNumber = await findManagedPhoneNumber(from);

        if (phoneNumber) {
          const clientState = decodeClientState(event.payload?.client_state);
          const attemptId = typeof clientState.outboundAttemptId === 'string' &&
            /^[0-9a-f-]{36}$/i.test(clientState.outboundAttemptId)
            ? clientState.outboundAttemptId
            : null;
          let callLog = await prisma.callLog.findUnique({
            where: { telnyxCallControlId: callControlId },
            include: { reservation: { select: { id: true } } },
          });

          if (!callLog && attemptId) {
            const provisionalId = `pending:${attemptId}`;
            const provisional = await prisma.callLog.findFirst({
              where: {
                telnyxCallControlId: provisionalId,
                organizationId: phoneNumber.organizationId,
                phoneNumberId: phoneNumber.id,
                direction: { in: ['OUTBOUND', 'FORWARD'] },
                status: 'PREAUTHORIZED',
                startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
              },
              include: { reservation: { select: { id: true } } },
            });
            if (provisional) {
              callLog = await prisma.callLog.update({
                where: { id: provisional.id },
                data: {
                  telnyxCallControlId: callControlId,
                  fromNumber: phoneNumber.number,
                  toNumber: canonicalizePhoneNumber(to) ?? to,
                  status: 'INITIATED',
                },
                include: { reservation: { select: { id: true } } },
              });
            }
          }

          if (!callLog) {
            callLog = await prisma.callLog.create({
              data: {
                telnyxCallControlId: callControlId,
                direction: 'OUTBOUND',
                fromNumber: phoneNumber.number,
                toNumber: canonicalizePhoneNumber(to) ?? to,
                organizationId: phoneNumber.organizationId,
                phoneNumberId: phoneNumber.id,
                userId: phoneNumber.assignedUserId,
                status: 'INITIATED',
              },
              include: { reservation: { select: { id: true } } },
            });
          }
          const rateProfile = clientState.rateProfile === 'AI_AGENT' || phoneNumber.aiEmployee?.isActive
            ? 'AI_AGENT'
            : 'STANDARD';
          if (!await authorizeCallLog({ callLog, callControlId, rateProfile })) return;
          if (callLog.direction === 'FORWARD' && callLog.parentCallLogId) {
            await prisma.callLog.updateMany({
              where: { id: callLog.parentCallLogId, forwardStatus: { in: ['STARTING', 'DIALING'] } },
              data: { forwardStatus: 'DIALING' },
            });
          }
          console.log(`[CALL_OUTBOUND_BILLING_STARTED] ${callControlId} org=${phoneNumber.organizationId}`);
        } else {
          console.error(`[CALL_OUTBOUND_REJECTED] ${callControlId} — caller ID inactif ou non géré: ${from}`);
          await terminateProviderCall(callControlId, 'UNMANAGED_CALLER_ID');
        }
      }
    }

    else if (eventType === 'call.answered') {
      console.log(`[Telnyx Webhook] Call Answered: ${callControlId}`);
      
      // Fetch the call log to see if this call has an AI Agent assigned
      let callLog = await prisma.callLog.findUnique({
        where: { telnyxCallControlId: callControlId },
        include: { phoneNumber: { include: { aiEmployee: true } } }
      });
      for (let attempt = 0; !callLog && attempt < 5; attempt++) {
        await wait(250);
        callLog = await prisma.callLog.findUnique({
          where: { telnyxCallControlId: callControlId },
          include: { phoneNumber: { include: { aiEmployee: true } } },
        });
      }

      // Webhook delivery order is not guaranteed. The initiated handler owns
      // creation and billing; an early/unknown answered event must not crash.
      if (!callLog) {
        throw new Error(`CALL_LOG_NOT_READY:${callControlId}:answered`);
      }

      const parentIsForwarding = callLog.callPurpose === 'PSTN_INBOUND' &&
        ['STARTING', 'DIALING', 'ANSWERED', 'BRIDGED'].includes(callLog.forwardStatus || '');
      if (callLog.direction === 'FORWARD' && callLog.parentCallLogId) {
        await prisma.callLog.updateMany({
          where: { id: callLog.parentCallLogId, forwardStatus: { in: ['STARTING', 'DIALING'] } },
          data: { forwardStatus: 'ANSWERED' },
        });
      }

      const agent = callLog?.phoneNumber?.aiEmployee;

      // Only start streaming if there's an active AI Agent
      if (agent && agent.isActive) {
        // Option B: LiveKit SIP Architecture
        // We transfer the answered call to the LiveKit SIP Trunk.
        const telnyx = await getConfiguredTelnyxClient();
        const livekitSipUri = process.env.LIVEKIT_SIP_URI?.trim();
        if (!livekitSipUri) {
          console.error(`[Telnyx Webhook] LIVEKIT_SIP_URI missing for AI call ${callControlId}`);
          await prisma.callLog.update({
            where: { id: callLog.id },
            data: { status: 'FAILED', endedAt: providerEventDate(event) },
          });
          await releasePstnReservation({
            organizationId: callLog.organizationId,
            callControlId,
            callLogId: callLog.id,
            reason: 'AI_MEDIA_NOT_CONFIGURED',
          });
          await terminateProviderCall(callControlId, 'AI_MEDIA_NOT_CONFIGURED');
          return;
        }

        // We inject the AI context via custom SIP headers
        // LiveKit will receive these headers when the SIP call arrives
        const customHeaders = [
          { name: "X-Agent-Name", value: Buffer.from(agent.name).toString('base64') },
          { name: "X-Agent-Voice", value: agent.voiceId },
          { name: "X-Organization-Id", value: callLog?.organizationId || "" },
          { name: "X-Call-Log-Id", value: callLog?.id || "" }
          // We don't send the full prompt in headers because SIP headers have size limits (usually ~1KB max).
          // The LiveKit Agent (Python) will fetch the full prompt from the database using the X-Call-Log-Id.
        ];

        console.log(`[Telnyx Webhook] Transferring call ${callControlId} to LiveKit SIP: ${livekitSipUri}`);

        try {
          await telnyx.calls.actions.transfer(callControlId, {
            to: livekitSipUri,
            custom_headers: customHeaders
          });
        } catch (error) {
          console.error(`[Telnyx Webhook] LiveKit transfer failed for ${callControlId}`, error);
          await prisma.callLog.update({
            where: { id: callLog.id },
            data: { status: 'FAILED', endedAt: providerEventDate(event) },
          });
          await releasePstnReservation({
            organizationId: callLog.organizationId,
            callControlId,
            callLogId: callLog.id,
            reason: 'AI_MEDIA_TRANSFER_FAILED',
          });
          await terminateProviderCall(callControlId, 'AI_MEDIA_TRANSFER_FAILED');
          return;
        }
      }

      await prisma.callLog.update({
        where: { id: callLog.id },
        data: {
          status: parentIsForwarding ? 'FORWARDING' : 'IN_PROGRESS',
          ...(callLog.forwardStatus === 'SCHEDULED' ? { forwardStatus: 'CANCELLED' } : {}),
          answeredAt: providerEventDate(event)
        }
      });
    }

    else if (eventType === 'call.bridged') {
      const callLog = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } });
      if (callLog) {
        await prisma.callLog.update({ where: { id: callLog.id }, data: { status: 'IN_PROGRESS' } });
        if (callLog.direction === 'FORWARD' && callLog.parentCallLogId) {
          await prisma.callLog.updateMany({
            where: { id: callLog.parentCallLogId, forwardStatus: { in: ['STARTING', 'DIALING', 'ANSWERED'] } },
            data: { forwardStatus: 'BRIDGED', status: 'IN_PROGRESS', answeredAt: providerEventDate(event) },
          });
        } else if (callLog.callPurpose === 'PSTN_INBOUND') {
          await prisma.callLog.updateMany({ where: { id: callLog.id }, data: { forwardStatus: 'BRIDGED' } });
        }
      }
    }

    else if (eventType === 'call.hangup' || eventType === 'call.failed') {
      console.log(`[Telnyx Webhook] Call terminal (${eventType}): ${callControlId}`);

      const ended = providerEventDate(event);
      let callLog = await prisma.callLog.findUnique({
        where: { telnyxCallControlId: callControlId },
        include: {
          phoneNumber: {
            include: {
              aiEmployee: true,
              assignedUser: { select: { id: true, name: true } },
            },
          },
        },
      });

      for (let attempt = 0; !callLog && attempt < 5; attempt++) {
        await wait(250);
        callLog = await prisma.callLog.findUnique({
          where: { telnyxCallControlId: callControlId },
          include: {
            phoneNumber: {
              include: {
                aiEmployee: true,
                assignedUser: { select: { id: true, name: true } },
              },
            },
          },
        });
      }

      if (!callLog) {
        throw new Error(`CALL_LOG_NOT_READY:${callControlId}:hangup`);
      }
      
      let duration = 0;
      if (callLog?.answeredAt) {
        duration = Math.max(1, Math.ceil((ended.getTime() - callLog.answeredAt.getTime()) / 1000));
      }

      const finalStatus = eventType === 'call.failed'
        ? 'FAILED'
        : (duration === 0 || !callLog?.answeredAt) ? 'NO_ANSWER' : 'COMPLETED';

      const hangupCause = event.payload?.hangup_cause || null;
      const sipHangupCause = event.payload?.sip_hangup_cause || null;
      let mosScore = null;
      if (event.payload?.call_quality_stats?.inbound?.mos) {
        mosScore = parseFloat(event.payload.call_quality_stats.inbound.mos);
      }

      // Only update stats. DO NOT OVERWRITE transcription or summary here (handled by media-server.ts).
      await prisma.callLog.update({
        where: { id: callLog.id },
        data: {
          status: finalStatus,
          endedAt: ended,
          duration,
          hangupCause,
          sipHangupCause,
          mosScore,
          ...(callLog.forwardStatus === 'SCHEDULED' ? { forwardStatus: 'CANCELLED' } : {})
        }
      });

      if (callLog.direction === 'FORWARD' && callLog.parentCallLogId) {
        await prisma.callLog.updateMany({
          where: { id: callLog.parentCallLogId },
          data: { forwardStatus: finalStatus === 'COMPLETED' ? 'COMPLETED' : 'FAILED' },
        });
        if (finalStatus !== 'COMPLETED') {
          const parent = await prisma.callLog.findUnique({ where: { id: callLog.parentCallLogId }, select: { telnyxCallControlId: true } });
          if (parent) await terminateProviderCall(parent.telnyxCallControlId, 'FORWARD_NO_ANSWER');
        }
      }

      // --- AUTOMATION BRIDGE : NO_ANSWER_AI ---
      if (finalStatus === 'NO_ANSWER' && callLog?.contactId && callLog?.phoneNumberId) {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { id: callLog.phoneNumberId },
          include: { aiEmployee: true }
        });

        if (phoneNumber?.aiEmployee) {
          const rule = await prisma.automationWorkflow.findFirst({
            where: {
              organizationId: callLog.organizationId,
              triggerType: 'NO_ANSWER_AI',
              isActive: true
            }
          });

          if (rule) {
            console.log(`[Automation] Triggering workflow ${rule.id} for NO_ANSWER_AI`);
          }
        }
      }

      // --- GENERIC AUTOMATION BRIDGE ---
      // We only handle CALL_MISSED here. CALL_COMPLETED will be handled by media-server.ts once AI processing is done.
      if (callLog?.contactId && finalStatus === 'NO_ANSWER') {
        const contactInfo = await prisma.contact.findUnique({ where: { id: callLog.contactId }});
        if (contactInfo) {
          await executeAutomation(callLog.organizationId, 'CALL_MISSED', { contact: contactInfo });
        }
      }

      // --- PHASE 3 : FACTURATION PSTN (uniquement pour un appel réellement facturable) ---
      // Un appel avec durée > 0 et un organization est facturé de façon idempotente.
      if (finalStatus === 'COMPLETED' && duration > 0 && callLog?.organizationId) {
        try {
          // Détermine le profil tarifaire : AI_AGENT si un agent IA actif est assigné au numéro.
          let rateProfile: 'STANDARD' | 'AI_AGENT' = 'STANDARD';
          const hangupClientState = decodeClientState(event.payload?.client_state);
          if (hangupClientState.rateProfile === 'AI_AGENT') rateProfile = 'AI_AGENT';
          if (callLog.phoneNumberId) {
            const pn = await prisma.phoneNumber.findUnique({
              where: { id: callLog.phoneNumberId },
              select: { aiEmployee: { select: { isActive: true } } },
            });
            if (pn?.aiEmployee?.isActive) rateProfile = 'AI_AGENT';
          }

          const providerCostRaw = event.payload?.cost?.amount ?? event.payload?.cost;
          const parsedProviderCost = typeof providerCostRaw === 'string' || typeof providerCostRaw === 'number'
            ? Number(providerCostRaw)
            : null;
          const providerCost = parsedProviderCost !== null && Number.isFinite(parsedProviderCost) && parsedProviderCost >= 0
            ? parsedProviderCost
            : null;
          const providerBilledSecondsRaw = event.payload?.billed_sec ?? event.payload?.billed_secs;
          const providerBilledSeconds = Number.isFinite(Number(providerBilledSecondsRaw))
            ? Math.max(0, Math.round(Number(providerBilledSecondsRaw)))
            : null;

          await settlePstnCall({
            callControlId,
            organizationId: callLog.organizationId,
            callLogId: callLog.id,
            durationSeconds: duration,
            rateProfile,
            providerCost,
            providerCurrency: typeof event.payload?.cost?.currency === 'string'
              ? event.payload.cost.currency
              : (typeof event.payload?.currency === 'string' ? event.payload.currency : null),
            providerBilledSeconds,
          });
        } catch (billingErr) {
          console.error('[Telnyx Webhook] settlePstnCall failed', billingErr);
          throw billingErr;
        }
      } else if (callLog?.organizationId && callLog?.id) {
        // Appel non facturable (NO_ANSWER / BUSY / FAILED / CANCELLED / durée 0) :
        // on libère la réservation (remboursement idempotent du hold, PENDING → RELEASED).
        try {
          await releasePstnReservation({
            organizationId: callLog.organizationId,
            callControlId,
            callLogId: callLog.id,
            reason: 'NO_ANSWER',
          });
        } catch (relErr) {
          console.error('[Telnyx Webhook] releasePstnReservation failed', relErr);
          throw relErr;
        }
      }

      // ── Fin d'appel humain → notifier pstn:ended ─────────────────────────
      // Si `pstn:incoming` avait été envoyé à un utilisateur (pas d'agent IA),
      // on ferme l'UI côté client (sonnerie infinie, ou état actif) dès que
      // Telnyx confirme le hangup. Idempotent côté client (comparaison du
      // callControlId). Les appels APP_TO_APP ne passent jamais ici.
      const pn = callLog?.phoneNumber;
      if (pn && !(pn.aiEmployee && pn.aiEmployee.isActive)) {
        try {
          const notifyUser = await resolveNotifyUser(pn);
          if (notifyUser) {
            const pusher = getPusherServer();
            if (!pusher) throw new Error('PUSHER_NOT_CONFIGURED');
            await pusher.trigger(
              appCallChannels.user(notifyUser.id),
              PSTN_EVENTS.ENDED,
              { callControlId, status: finalStatus },
            );
            console.log(`[CALL_INCOMING_PUSHER_SENT] ${callControlId} user=${notifyUser.id} event=${PSTN_EVENTS.ENDED}`);
          }
        } catch (notifyErr) {
          console.error(`[Telnyx Webhook] pstn:ended failed for ${callControlId}`, notifyErr);
          throw notifyErr;
        }
      }
    }

    else if (eventType === 'call.recording.saved') {
      const callControlId = event.payload.call_control_id;
      const recordingUrls = event.payload.recording_urls;
      const url = recordingUrls?.wav || recordingUrls?.mp3;
      if (url) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { recordingUrl: url }
        });
        console.log(`[Telnyx Webhook] Recording saved for ${callControlId}`);
      }
    }

    else if (eventType === 'call.transcription') {
      const callControlId = event.payload.call_control_id;
      const transcript = event.payload.transcription_data?.transcript;
      if (transcript) {
        // Append transcript in case there are multiple chunks
        const existingCall = await prisma.callLog.findUnique({
          where: { telnyxCallControlId: callControlId },
          select: { transcriptionText: true }
        });
        const newText = existingCall?.transcriptionText 
          ? existingCall.transcriptionText + '\n' + transcript 
          : transcript;
          
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { transcriptionText: newText }
        });
        console.log(`[Telnyx Webhook] Transcription appended for ${callControlId}`);
      }
    }

    else if (eventType === 'call.machine.premium.detection.ended') {
      const callControlId = event.payload.call_control_id;
      const result = event.payload.result;
      if (result) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { amdResult: result }
        });
        console.log(`[Telnyx Webhook] AMD Result for ${callControlId}: ${result}`);
      }
    }

    else if (eventType === 'call.conversation_insights.generated') {
      const callControlId = event.payload.call_control_id;
      const summary = event.payload.insights?.summary;
      if (summary) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { aiSummary: summary }
        });
        console.log(`[Telnyx Webhook] AI Summary saved for ${callControlId}`);
      }
    }

    else if (eventType === 'call.conversation.ended') {
      const callControlId = event.payload.call_control_id;
      const reason = event.payload.reason;
      console.log(`[Telnyx Webhook] AI Conversation ended for ${callControlId} (Reason: ${reason})`);
    }

    // Handle incoming SMS/MMS messages
    else if (eventType === 'message.received') {
      const fromNumber = typeof event.payload.from === 'string' ? event.payload.from : event.payload.from?.phone_number;
      const toArray = event.payload.to;
      let toNumber = null;
      if (typeof toArray === 'string') {
        toNumber = toArray;
      } else if (Array.isArray(toArray) && toArray.length > 0) {
        toNumber = typeof toArray[0] === 'string' ? toArray[0] : toArray[0].phone_number;
      }

      const text = event.payload.text || event.payload.postback_data || '';
      const messageId = event.payload.id;
      const media = event.payload.media || [];
      const mediaUrls = media.map((m: any) => m.url);
      
      let msgType = mediaUrls.length > 0 ? 'MMS' : 'SMS';
      if (event.payload.type === 'whatsapp') {
        msgType = 'WHATSAPP';
      } else if (event.payload.type === 'RCS' || event.payload.type === 'rcs') {
        msgType = 'RCS';
      }

      console.log(`[Telnyx Webhook] ${msgType} Received from ${fromNumber} to ${toNumber}`);

      if (toNumber) {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { number: toNumber }
        });

        if (phoneNumber) {
          const smsMessage = await prisma.smsMessage.create({
            data: {
              telnyxMessageId: messageId,
              direction: 'INBOUND',
              body: text || '',
              fromNumber: fromNumber,
              toNumber: toNumber,
              organizationId: phoneNumber.organizationId,
              phoneNumberId: phoneNumber.id,
              status: 'DELIVERED',
              type: msgType,
              mediaUrls: mediaUrls
            }
          });

          // Try to link to contact
          const contact = await prisma.contact.findFirst({
            where: {
              organizationId: phoneNumber.organizationId,
              phone: fromNumber
            }
          });

          if (contact) {
            await prisma.smsMessage.update({
              where: { id: smsMessage.id },
              data: { contactId: contact.id }
            });
          }
        }
      }
    }

    // Handle outbound message updates
    else if (eventType === 'message.sent') {
      const messageId = event.payload.id;
      console.log(`[Telnyx Webhook] Message ${messageId} sent to carrier`);
      await prisma.smsMessage.updateMany({
        where: { telnyxMessageId: messageId },
        data: { status: 'SENT' }
      });
    }

    else if (eventType === 'message.finalized') {
      const messageId = event.payload.id;
      const toArray = event.payload.to;
      const status = toArray && toArray.length > 0 ? toArray[0].status : null; // 'delivered' or 'delivery_failed'
      const cost = event.payload.cost?.amount ? parseFloat(event.payload.cost.amount) : 0;
      
      console.log(`[Telnyx Webhook] Message ${messageId} finalized with status: ${status}`);
      
      const newStatus = status === 'delivered' ? 'DELIVERED' : (status === 'delivery_failed' ? 'FAILED' : 'FINALIZED');

      await prisma.smsMessage.updateMany({
        where: { telnyxMessageId: messageId },
        data: { 
          status: newStatus,
          cost: cost
        }
      });

      // Campaign Tracking: If this message belongs to a CampaignRecipient, update it
      const recipient = await prisma.campaignRecipient.findFirst({
        where: { messageId: messageId }
      });

      if (recipient) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: newStatus }
        });

        if (newStatus === 'DELIVERED') {
          await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { deliveredCount: { increment: 1 } }
          });
        }
      }
    }
  } catch (error: any) {
    // A failed claim is removed so Telnyx can safely retry the event. All
    // monetary mutations themselves are idempotent by callControlId.
    if (claimed && eventId) {
      await prisma.webhookEvent.deleteMany({
        where: { provider: 'TELNYX', eventId },
      }).catch(() => undefined);
    }
    console.error('[Telnyx Webhook Async Error]', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let event;

    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    const publicKey = process.env.TELNYX_PUBLIC_KEY;

    if (!publicKey) {
      console.error('[Telnyx Webhook] TELNYX_PUBLIC_KEY is not configured');
      return new NextResponse('Webhook verification is not configured', { status: 503 });
    }
    if (!signature || !timestamp) {
      return new NextResponse('Missing Telnyx signature', { status: 401 });
    }
    try {
      const telnyx = await getConfiguredTelnyxClient();
      event = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey).data;
    } catch (err: any) {
      console.error('[Telnyx Webhook] Signature verification failed:', err.message);
      return new NextResponse('Invalid signature', { status: 401 });
    }
    if (!event || typeof event.id !== 'string' || !event.id ||
        typeof event.event_type !== 'string' || !event.event_type) {
      return new NextResponse('Invalid Telnyx event', { status: 400 });
    }

    // Acknowledge only after durable processing. Returning an error lets
    // Telnyx retry; the WebhookEvent claim makes successful retries idempotent.
    await processEvent(event);

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Telnyx Webhook Error]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
