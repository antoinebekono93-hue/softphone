import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronSecret } from '@/lib/security';
import { canonicalizePhoneNumber } from '@/lib/phone-number';
import { preAuthorizeCall, releasePstnReservation } from '@/lib/pstn-billing';

export const maxDuration = 60;
const API_BASE = 'https://api.telnyx.com/v2';

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

    const pendingRecipients = await prisma.campaignRecipient.findMany({
      where: { status: 'PENDING', campaign: { status: 'RUNNING', channel: 'VOICE' } },
      include: { campaign: { include: { phoneNumber: true } }, contact: true },
      take: 10,
    });
    const results: Array<{ recipientId: string; status: string; callControlId?: string }> = [];

    for (const recipient of pendingRecipients) {
      const claimed = await prisma.campaignRecipient.updateMany({
        where: { id: recipient.id, status: 'PENDING' },
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

      const attemptId = randomUUID();
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

      try {
        const authorization = await preAuthorizeCall({
          organizationId: recipient.campaign.organizationId,
          callControlId: provisionalControlId,
          callLogId: callLog.id,
          rateProfile: 'AI_AGENT',
        });
        if (!authorization.authorized) {
          await prisma.callLog.update({ where: { id: callLog.id }, data: { status: 'DENIED', endedAt: new Date() } });
          await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'FAILED' } });
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
          }),
        });
        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok || !responseBody?.data?.call_control_id) {
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
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED' },
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
