import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;

function providerError(error: any) {
  const status = Number(error?.status ?? error?.statusCode);
  const message = error?.raw?.errors?.[0]?.detail || error?.message || 'Erreur Telnyx';
  return NextResponse.json({ error: message, code: 'TELNYX_WHATSAPP_ERROR' }, { status: status >= 400 && status < 500 ? status : 502 });
}

function validRequest(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = String(body.category || 'MARKETING').toUpperCase();
  const language = typeof body.language === 'string' ? body.language.trim() : 'fr';
  const components = body.components;
  if (!/^[a-z0-9_]{1,512}$/.test(name)) throw new Error('Le nom doit contenir uniquement des minuscules, chiffres et underscores.');
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) throw new Error('Catégorie de modèle invalide.');
  if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language)) throw new Error('Code de langue invalide (exemple : fr ou fr_FR).');
  if (!Array.isArray(components) || !components.length) throw new Error('Au moins un composant est requis.');
  return { name, category: category as (typeof CATEGORIES)[number], language, components };
}

async function saveRemoteTemplate(organizationId: string, item: any) {
  const telnyxId = typeof item?.id === 'string' ? item.id : null;
  const data = {
    telnyxId,
    metaTemplateId: typeof item?.template_id === 'string' ? item.template_id : null,
    name: item?.name || 'unnamed_template',
    category: item?.category || 'MARKETING',
    language: item?.language || 'fr',
    status: item?.status || 'PENDING',
    rejectionReason: item?.rejection_reason || null,
    content: JSON.stringify(item?.components || []),
    organizationId,
  };
  if (telnyxId) {
    return prisma.whatsAppTemplate.upsert({
      where: { telnyxId },
      create: data,
      update: {
        metaTemplateId: data.metaTemplateId,
        name: data.name,
        category: data.category,
        language: data.language,
        status: data.status,
        rejectionReason: data.rejectionReason,
        content: data.content,
      },
    });
  }
  return prisma.whatsAppTemplate.create({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const input = validRequest(await req.json());
    const account = await prisma.whatsAppAccount.findUnique({ where: { organizationId: session.user.organizationId } });
    if (!account?.wabaId || !account.enabled) {
      return NextResponse.json({ error: 'Activez et attribuez d’abord un compte WhatsApp Telnyx.' }, { status: 422 });
    }
    const telnyx = await getConfiguredTelnyxClient();
    const response = await telnyx.whatsapp.templates.create({
      waba_id: account.wabaId,
      name: input.name,
      category: input.category,
      language: input.language,
      components: input.components,
    });
    if (!response?.data?.id) return NextResponse.json({ error: 'Telnyx n’a pas confirmé la création du modèle.' }, { status: 502 });
    const template = await saveRemoteTemplate(session.user.organizationId, response.data);
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
    if (error instanceof Error && !('status' in error)) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[WhatsApp template create]', error);
    return providerError(error);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const organizationId = session.user.organizationId;
  try {
    const account = await prisma.whatsAppAccount.findUnique({ where: { organizationId } });
    if (!account?.wabaId) return NextResponse.json({ templates: [], configured: false });
    const telnyx = await getConfiguredTelnyxClient();
    const remote: any[] = [];
    for await (const item of telnyx.whatsapp.templates.list({ 'filter[waba_id]': account.wabaId })) {
      remote.push(await saveRemoteTemplate(organizationId, item));
    }
    return NextResponse.json({ templates: remote, configured: true });
  } catch (error) {
    console.error('[WhatsApp template sync]', error);
    return providerError(error);
  }
}
