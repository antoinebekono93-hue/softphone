import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronSecret } from '@/lib/security';
import { canonicalizePhoneNumber } from '@/lib/phone-number';
import { preAuthorizeCall, releasePstnReservation } from '@/lib/pstn-billing';
import {
  CAMPAIGN_DIALER_STATUSES,
  nextCampaignDialerRetry,
  campaignDialerRetryRank,
  extractStoredAttemptId,
  newDialerAttemptId,
  buildCampaignDialCommandId,
  isTransientDialFailure,
} from '@/lib/campaign-dialer-policy';

export const maxDuration = 60;
const API_BASE = 'https://api.telnyx.com/v2';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
      select: { telnyxApiKey: true, telnyxConnectionId: true },
    });
    const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
    const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
    if (!apiKey || !connectionId) {
      return NextResponse.json({ error: 'TELNYX_VOICE_NOT_CONFIGURED' }, { status: 503 });
    }

    // PENDING + états de retry transitoire : un recipient en backoff est
    // re-sélectionné, réutilisant le même attemptId → même command_id.
    const pendingRecipients = await prisma.campaignRecipient.findMany({
      where: { status: { in: [...CAMPAIGN_DIALER_STATUSES] }, campaign: { status: 'RUNNING', channel: 'VOICE' } },
      include: { campaign: { include: { phoneNumber: true } }, contact: true },
      take: 10,
    });
    const results: Array<{ recipientId: string; status: string; callControlId?: string }> = [];

    for (const recipient of pendingRecipients) {
      const claimed = await prisma.campaignRecipient.updateMany({
        where: { id: recipient.id, status: { in: [...CAMPAIGN_DIALER_STATUSES] } },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count !== 1) continue;

      const destination = canonicalizePhoneNumber(recipient.contact.phone);
      const campaignNumber = recipient.campaign.phoneNumber;
      const caller = campaignNumber?.status === 'ACTIVE'
        ? campaignNumber
        : await prisma.phoneNumber.findFirst({
            where: { organizationId: recipient.campaign.organizationId, status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' },
          });

      if (!destination || !caller) {
        await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'FAILED' } });
        results.push({ recipientId: recipient.id, status: 'FAILED' });
        continue;
      }

      // IDEMPOTENCE : l'attemptId (et donc le command_id) est PERSISTÉ dans
      // messageId. Un retry transitoire réutilise le même attemptId ; seul un
      // nouvel essai volontaire en génère un nouveau.
      const storedAttemptId = extractStoredAttemptId(recipient.messageId);
      const attemptId = storedAttemptId ?? newDialerAttemptId();
      if (!storedAttemptId) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { messageId: attemptId },
        });
      }
      const commandId = buildCampaignDialCommandId({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        attemptId,
      });

      const provisionalControlId = `pending:${attemptId}`;
      const callLog = await prisma.callLog.create({
        data: {
          telnyxCallControlId: provisionalControlId,
          direction: 'OUTBOUND',
          status: 'PREAUTHORIZING',
          fromNumber: caller.number,
          toNumber: destination,
          organizationId: recipient.campaign.organizationId,
          phoneNumberId: caller.id,
          contactId: recipient.contactId,
        },
      });

      let dialFailure: { status: number; body: { errors?: Array<{ detail?: string; code?: string }> } | null } | null = null;

      try {
        const authorization = await preAuthorizeCall({
          organizationId: recipient.campaign.organizationId,
          callControlId: provisionalControlId,
          callLogId: callLog.id,
          rateProfile: 'AI_AGENT',
        });
        if (!authorization.authorized) {
          await prisma.callLog.update({ where: { id: callLog.id }, data: { status: 'DENIED', endedAt: new Date() } });
          await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'FAILED', messageId: null } });
          results.push({ recipientId: recipient.id, status: 'DENIED' });
          continue;
        }
        await prisma.callLog.update({ where: { id: callLog.id }, data: { status: 'PREAUTHORIZED' } });

        const clientState = Buffer.from(JSON.stringify({
          outboundAttemptId: attemptId,
          campaignId: recipient.campaignId,
          contactId: recipient.contactId,
          rateProfile: 'AI_AGENT',
        })).toString('base64');
        const response = await fetch(`${API_BASE}/calls`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            to: destination,
            from: caller.number,
            connection_id: connectionId,
            answering_machine_detection: 'premium',
            time_limit_secs: authorization.maxDurationSeconds ?? 3600,
            client_state: clientState,
            // Dédup Telnyx 60 s : un retry du même appel logique ne crée
            // qu'une seule jambe.
            command_id: commandId,
          }),
        });
        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok || !responseBody?.data?.call_control_id) {
          dialFailure = { status: response.status, body: responseBody as { errors?: Array<{ detail?: string; code?: string }> } | null };
          throw new Error(responseBody?.errors?.[0]?.detail || `TELNYX_DIAL_FAILED_${response.status}`);
        }
        const callControlId = responseBody.data.call_control_id as string;
        await prisma.callLog.update({
          where: { id: callLog.id },
          data: { telnyxCallControlId: callControlId, status: 'INITIATED' },
        }).catch(async () => {
          // The initiated webhook may have reconciled the provisional row first.
          const existing = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } });
          if (!existing) throw new Error('CALL_LOG_RECONCILIATION_FAILED');
        });
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'CALLED', messageId: callControlId },
        });
        results.push({ recipientId: recipient.id, status: 'CALLED', callControlId });
      } catch (error) {
        await releasePstnReservation({
          organizationId: recipient.campaign.organizationId,
          callControlId: provisionalControlId,
          callLogId: callLog.id,
          reason: 'DIAL_FAILED',
        }).catch(() => undefined);
        await prisma.callLog.update({
          where: { id: callLog.id },
          data: { status: 'FAILED', endedAt: new Date() },
        }).catch(() => undefined);

        // Échec transitoire (429 / 5xx / 90103 DPS) → requeue borné avec le
        // MÊME attemptId (messageId conservé) pour garder un seul command_id.
        // 4xx autres / exhaustion → FAILED permanent (messageId réinitialisé).
        if (dialFailure && isTransientDialFailure(dialFailure.status, dialFailure.body)) {
          const currentStatus = recipient.status as string;
          const nextStatus = nextCampaignDialerRetry(currentStatus);
          if (nextStatus) {
            await wait(campaignDialerRetryRank(currentStatus) * 400 + Math.random() * 800);
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: { status: nextStatus },
            });
            console.warn(`[Dialer] ${recipient.id} transitoire (${dialFailure.status}) → ${nextStatus}, attemptId=${attemptId} conservé`);
            results.push({ recipientId: recipient.id, status: nextStatus });
            continue;
          }
        }

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', messageId: null },
        });
        console.error(`[Dialer] ${recipient.id}`, error);
        results.push({ recipientId: recipient.id, status: 'FAILED' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('[Dialer] Global error:', error);
    return NextResponse.json({ error: 'DIALER_FAILED' }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;