"use server";

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/security';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { canonicalizePhoneNumber } from '@/lib/phone-number';
import { whatsappWebhookUrl } from '@/lib/whatsapp';

async function collect(page: AsyncIterable<any>) {
  const items: any[] = [];
  for await (const item of page) items.push(item);
  return items;
}

function message(error: unknown) {
  const e = error as any;
  return e?.raw?.errors?.[0]?.detail || e?.message || 'Opération Telnyx non confirmée.';
}

export async function loadWhatsAppControl() {
  await requireSuperAdmin();
  const telnyx = await getConfiguredTelnyxClient();
  const [businessAccounts, phoneNumbers, organizations, mappings, userData] = await Promise.all([
    collect(telnyx.whatsapp.businessAccounts.list()),
    collect(telnyx.whatsapp.phoneNumbers.list()),
    prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.whatsAppAccount.findMany({ include: { organization: { select: { name: true } } } }),
    telnyx.whatsapp.userData.retrieve().then((r: any) => r.data || null).catch(() => null),
  ]);
  const settings = await Promise.all(businessAccounts.map(async account => {
    if (!account.id) return null;
    try { return (await telnyx.whatsapp.businessAccounts.settings.retrieve(account.id)).data || null; }
    catch { return null; }
  }));
  const phoneDetails = await Promise.all(phoneNumbers.map(async phone => {
    const number = canonicalizePhoneNumber(phone.phone_number);
    if (!number) return { ...phone, profile: null, calling: null };
    const [profile, calling, photo] = await Promise.all([
      telnyx.whatsapp.phoneNumbers.profile.retrieve(number).then((r: any) => r.data || null).catch(() => null),
      telnyx.whatsapp.phoneNumbers.callingSettings.retrieve(number).then((r: any) => r.data || null).catch(() => null),
      telnyx.whatsapp.phoneNumbers.profile.photo.retrieve(number).then((r: any) => r.data || null).catch(() => null),
    ]);
    return { ...phone, phone_number: number, profile, calling, photo };
  }));
  return {
    businessAccounts: businessAccounts.map((account, index) => ({ ...account, settings: settings[index] })),
    phoneNumbers: phoneDetails,
    organizations,
    mappings,
    userData,
    productionWebhook: whatsappWebhookUrl(),
  };
}

export async function assignWhatsAppAccount(input: { organizationId: string; businessAccountId: string; phoneNumber: string; messagingProfileId?: string }) {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(input.phoneNumber);
  if (!input.organizationId || !input.businessAccountId || !phoneNumber) throw new Error('Organisation, compte Telnyx et numéro E.164 requis.');
  await prisma.organization.findUniqueOrThrow({ where: { id: input.organizationId } });
  const telnyx = await getConfiguredTelnyxClient();
  let account: any;
  let phones: any[];
  try {
    [account, phones] = await Promise.all([
      telnyx.whatsapp.businessAccounts.retrieve(input.businessAccountId).then((r: any) => r.data),
      collect(telnyx.whatsapp.businessAccounts.phoneNumbers.list(input.businessAccountId)),
    ]);
  } catch (error) { throw new Error(message(error)); }
  if (!account?.id || !account?.waba_id) throw new Error('Compte WhatsApp Telnyx introuvable.');
  const phone = phones.find(item => canonicalizePhoneNumber(item.phone_number) === phoneNumber);
  if (!phone?.phone_number_id) throw new Error('Ce numéro n’appartient pas au compte WhatsApp sélectionné.');
  const webhook = whatsappWebhookUrl();
  await telnyx.whatsapp.businessAccounts.settings.update(account.id, {
    webhook_enabled: true,
    webhook_url: webhook,
  });
  const result = await prisma.whatsAppAccount.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      telnyxId: account.id,
      wabaId: account.waba_id,
      phoneNumberId: phone.phone_number_id,
      phoneNumber,
      status: phone.status || account.status || 'PENDING',
      accountReviewStatus: account.account_review_status,
      businessVerificationStatus: account.business_verification_status,
      qualityRating: phone.quality_rating,
      enabled: Boolean(phone.enabled),
      callingEnabled: Boolean(phone.calling_enabled),
      webhookEnabled: true,
      messagingProfileId: input.messagingProfileId?.trim() || null,
    },
    update: {
      telnyxId: account.id,
      wabaId: account.waba_id,
      phoneNumberId: phone.phone_number_id,
      phoneNumber,
      status: phone.status || account.status || 'PENDING',
      accountReviewStatus: account.account_review_status,
      businessVerificationStatus: account.business_verification_status,
      qualityRating: phone.quality_rating,
      enabled: Boolean(phone.enabled),
      callingEnabled: Boolean(phone.calling_enabled),
      webhookEnabled: true,
      messagingProfileId: input.messagingProfileId?.trim() || null,
      accessToken: null,
    },
  });
  return { id: result.id };
}

export async function saveWabaSettings(input: { businessAccountId: string; name: string; timezone: string; webhookEnabled: boolean; webhookEvents: string; failoverUrl: string }) {
  await requireSuperAdmin();
  if (!input.businessAccountId) throw new Error('Compte WhatsApp requis.');
  if (input.timezone && !/^[A-Za-z_+\-/]+$/.test(input.timezone)) throw new Error('Fuseau IANA invalide.');
  if (input.failoverUrl && new URL(input.failoverUrl).protocol !== 'https:') throw new Error('Le webhook de secours doit être HTTPS.');
  const events = [...new Set(input.webhookEvents.split(/[\s,;]+/).map(v => v.trim()).filter(Boolean))];
  const telnyx = await getConfiguredTelnyxClient();
  let response: any;
  try {
    response = await telnyx.whatsapp.businessAccounts.settings.update(input.businessAccountId, {
      name: input.name.trim() || undefined,
      timezone: input.timezone.trim() || undefined,
      webhook_enabled: input.webhookEnabled,
      webhook_events: events,
      webhook_url: whatsappWebhookUrl(),
      webhook_failover_url: input.failoverUrl.trim() || undefined,
    });
  } catch (error) { throw new Error(message(error)); }
  await prisma.whatsAppAccount.updateMany({
    where: { telnyxId: input.businessAccountId },
    data: { webhookEnabled: input.webhookEnabled, timezone: input.timezone.trim() || null },
  });
  return response.data;
}

export async function saveWhatsAppProfile(phoneNumberRaw: string, input: { about: string; address: string; category: string; description: string; displayName: string; email: string; website: string; messagingProfileId: string }) {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(phoneNumberRaw);
  if (!phoneNumber) throw new Error('Numéro E.164 invalide.');
  if (input.website && !['http:', 'https:'].includes(new URL(input.website).protocol)) throw new Error('Site web invalide.');
  const telnyx = await getConfiguredTelnyxClient();
  let response: any;
  try {
    response = await telnyx.whatsapp.phoneNumbers.profile.update(phoneNumber, {
      about: input.about.trim() || undefined,
      address: input.address.trim() || undefined,
      category: input.category.trim() || undefined,
      description: input.description.trim() || undefined,
      display_name: input.displayName.trim() || undefined,
      email: input.email.trim() || undefined,
      website: input.website.trim() || undefined,
      profile_id: input.messagingProfileId.trim() || undefined,
    });
  } catch (error) { throw new Error(message(error)); }
  await prisma.whatsAppAccount.updateMany({
    where: { phoneNumber },
    data: { messagingProfileId: input.messagingProfileId.trim() || null },
  });
  return response.data;
}

export async function setWhatsAppCalling(phoneNumberRaw: string, enabled: boolean) {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(phoneNumberRaw);
  if (!phoneNumber) throw new Error('Numéro E.164 invalide.');
  const telnyx = await getConfiguredTelnyxClient();
  try { await telnyx.whatsapp.phoneNumbers.callingSettings.update(phoneNumber, { enabled }); }
  catch (error) { throw new Error(message(error)); }
  await prisma.whatsAppAccount.updateMany({ where: { phoneNumber }, data: { callingEnabled: enabled } });
}

export async function initializeWhatsAppVerification(input: { businessAccountId: string; phoneNumber: string; displayName: string; language: string; method: 'sms' | 'voice' }) {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(input.phoneNumber);
  if (!input.businessAccountId || !phoneNumber || !input.displayName.trim()) throw new Error('Compte, numéro et nom d’affichage requis.');
  const telnyx = await getConfiguredTelnyxClient();
  try {
    await telnyx.whatsapp.businessAccounts.phoneNumbers.initializeVerification(input.businessAccountId, {
      phone_number: phoneNumber,
      display_name: input.displayName.trim(),
      language: input.language.trim() || 'fr',
      verification_method: input.method,
    });
  } catch (error) { throw new Error(message(error)); }
}

export async function resendWhatsAppVerification(phoneNumberRaw: string, method: 'sms' | 'voice') {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(phoneNumberRaw);
  if (!phoneNumber) throw new Error('Numéro E.164 invalide.');
  const telnyx = await getConfiguredTelnyxClient();
  try { await telnyx.whatsapp.phoneNumbers.resendVerification(phoneNumber, { verification_method: method }); }
  catch (error) { throw new Error(message(error)); }
}

export async function verifyWhatsAppNumber(phoneNumberRaw: string, code: string) {
  await requireSuperAdmin();
  const phoneNumber = canonicalizePhoneNumber(phoneNumberRaw);
  if (!phoneNumber || !/^\d{4,10}$/.test(code.trim())) throw new Error('Numéro ou code de vérification invalide.');
  const telnyx = await getConfiguredTelnyxClient();
  try { await telnyx.whatsapp.phoneNumbers.verify(phoneNumber, { code: code.trim() }); }
  catch (error) { throw new Error(message(error)); }
}

export async function configureWhatsAppSignupWebhook(failoverUrl: string) {
  await requireSuperAdmin();
  if (failoverUrl && new URL(failoverUrl).protocol !== 'https:') throw new Error('Le webhook de secours doit être HTTPS.');
  const telnyx = await getConfiguredTelnyxClient();
  try {
    return (await telnyx.whatsapp.userData.update({
      webhook_url: whatsappWebhookUrl(),
      webhook_failover_url: failoverUrl.trim() || undefined,
    })).data;
  } catch (error) { throw new Error(message(error)); }
}
