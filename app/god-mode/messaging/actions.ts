"use server";

import { requireSuperAdmin } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { messagingWebhookUrl } from '@/lib/sms-policy';

export async function loadMessaging() {
  await requireSuperAdmin();
  const [profiles, organizations, sent, delivered, failed] = await Promise.all([
    prisma.messagingProfile.findMany({ include: { organization: { select: { name: true } }, _count: { select: { phoneNumbers: true } } } }),
    prisma.organization.findMany({ select: { id: true, name: true } }),
    prisma.smsMessage.count({ where: { direction: 'OUTBOUND', type: { in: ['SMS', 'MMS'] } } }),
    prisma.smsMessage.count({ where: { direction: 'OUTBOUND', type: { in: ['SMS', 'MMS'] }, status: 'DELIVERED' } }),
    prisma.smsMessage.count({ where: { direction: 'OUTBOUND', type: { in: ['SMS', 'MMS'] }, status: { in: ['FAILED', 'DELIVERY_FAILED', 'SENDING_FAILED'] } } }),
  ]);
  const telnyx = await getConfiguredTelnyxClient();
  const live = await Promise.all(profiles.map(async profile => {
    try {
      const response = await telnyx.messagingProfiles.retrieve(profile.telnyxId);
      const p = response.data;
      return { id: profile.id, name: p.name, organization: profile.organization.name, numbers: profile._count.phoneNumbers,
        enabled: p.enabled, smart_encoding: p.smart_encoding, daily_spend_limit: p.daily_spend_limit,
        daily_spend_limit_enabled: p.daily_spend_limit_enabled, whitelisted_destinations: p.whitelisted_destinations,
        webhook_url: p.webhook_url, error: null };
    } catch {
      return { id: profile.id, name: profile.name, organization: profile.organization.name, numbers: profile._count.phoneNumbers,
        error: 'Profil inaccessible chez Telnyx. Vérifiez la clé et le compte associés.' };
    }
  }));
  return { profiles: live, organizations, sent, delivered, failed };
}

export async function saveMessagingProfile(id: string, input: { name: string; enabled: boolean; smart_encoding: boolean; daily_spend_limit: string; daily_spend_limit_enabled: boolean; destinations: string }) {
  await requireSuperAdmin();
  if (!input.name?.trim() || input.name.length > 100) throw new Error('Nom requis (100 caractères maximum).');
  const countries = [...new Set(input.destinations.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  if (!countries.length || countries.some(c => !/^[A-Z]{2}$/.test(c))) throw new Error('Indiquez les codes pays, par exemple US, CA, FR.');
  if (!/^\d+(\.\d{1,4})?$/.test(input.daily_spend_limit) || Number(input.daily_spend_limit) <= 0) throw new Error('Le plafond doit être un montant positif en USD.');
  if ([input.enabled, input.smart_encoding, input.daily_spend_limit_enabled].some(v => typeof v !== 'boolean')) throw new Error('Options invalides.');
  const profile = await prisma.messagingProfile.findUniqueOrThrow({ where: { id } });
  const telnyx = await getConfiguredTelnyxClient();
  const webhook = messagingWebhookUrl();
  await telnyx.messagingProfiles.update(profile.telnyxId, {
    name: input.name.trim(), enabled: input.enabled, smart_encoding: input.smart_encoding,
    daily_spend_limit: input.daily_spend_limit, daily_spend_limit_enabled: input.daily_spend_limit_enabled,
    whitelisted_destinations: countries, webhook_url: webhook, webhook_api_version: '2',
  });
  await prisma.messagingProfile.update({ where: { id }, data: { name: input.name.trim(), webhookUrl: webhook } });
}

export async function createMessagingProfile(organizationId: string, name: string) {
  await requireSuperAdmin();
  if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new Error('Nom requis (100 caractères maximum).');
  await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const telnyx = await getConfiguredTelnyxClient();
  const webhookUrl = messagingWebhookUrl();
  const result = await telnyx.messagingProfiles.create({
    name: name.trim(), enabled: false, whitelisted_destinations: ['US'], webhook_url: webhookUrl, webhook_api_version: '2',
  }, { maxRetries: 0 });
  if (!result.data?.id) throw new Error('Création Telnyx non confirmée.');
  await prisma.messagingProfile.create({ data: { name: name.trim(), telnyxId: result.data.id, organizationId, webhookUrl } });
}
