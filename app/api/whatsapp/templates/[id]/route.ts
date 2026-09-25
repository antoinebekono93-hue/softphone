import { NextResponse } from 'next/server';
/* eslint-disable @typescript-eslint/no-explicit-any -- Telnyx template components are a generated polymorphic union. */
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;

function providerError(error: any) {
  const status = Number(error?.status ?? error?.statusCode);
  const message = error?.raw?.errors?.[0]?.detail || error?.message || 'Erreur Telnyx';
  return NextResponse.json({ error: message, code: 'TELNYX_WHATSAPP_ERROR' }, { status: status >= 400 && status < 500 ? status : 502 });
}

async function context(id: string) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!organizationId) return { response: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
  const template = await prisma.whatsAppTemplate.findFirst({ where: { id, organizationId } });
  if (!template) return { response: NextResponse.json({ error: 'Modèle introuvable' }, { status: 404 }) };
  if (!template.telnyxId) return { response: NextResponse.json({ error: 'Ce modèle local n’est pas lié à Telnyx.' }, { status: 409 }) };
  return { organizationId, template };
}

async function syncTemplate(localId: string, item: any) {
  return prisma.whatsAppTemplate.update({
    where: { id: localId },
    data: {
      metaTemplateId: typeof item?.template_id === 'string' ? item.template_id : null,
      name: item?.name || undefined,
      category: item?.category || undefined,
      language: item?.language || undefined,
      status: item?.status || undefined,
      rejectionReason: item?.rejection_reason || null,
      content: Array.isArray(item?.components) ? JSON.stringify(item.components) : undefined,
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await context(id);
  if ('response' in result) return result.response;
  try {
    const telnyx = await getConfiguredTelnyxClient();
    const remote = await telnyx.whatsappMessageTemplates.retrieve(result.template.telnyxId);
    if (!remote.data) return NextResponse.json({ error: 'Telnyx n’a pas renvoyé le modèle.' }, { status: 502 });
    return NextResponse.json({ template: await syncTemplate(id, remote.data) });
  } catch (error) {
    console.error('[WhatsApp template retrieve]', error);
    return providerError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await context(id);
  if ('response' in result) return result.response;
  try {
    const body = await request.json() as { category?: string; components?: unknown };
    const category = body.category?.toUpperCase();
    if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return NextResponse.json({ error: 'Catégorie invalide.' }, { status: 400 });
    }
    if (body.components !== undefined && (!Array.isArray(body.components) || body.components.length === 0)) {
      return NextResponse.json({ error: 'Au moins un composant est requis.' }, { status: 400 });
    }
    if (!category && body.components === undefined) {
      return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 });
    }
    const telnyx = await getConfiguredTelnyxClient();
    const remote = await telnyx.whatsappMessageTemplates.update(result.template.telnyxId, {
      category: category as (typeof CATEGORIES)[number] | undefined,
      components: body.components as any,
    });
    if (!remote.data) return NextResponse.json({ error: 'Telnyx n’a pas confirmé la modification.' }, { status: 502 });
    return NextResponse.json({ success: true, template: await syncTemplate(id, remote.data) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
    console.error('[WhatsApp template update]', error);
    return providerError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await context(id);
  if ('response' in result) return result.response;
  try {
    const campaignCount = await prisma.campaign.count({ where: { templateId: id } });
    if (campaignCount > 0) {
      return NextResponse.json({ error: 'Ce modèle est utilisé par une campagne. Détachez-le avant de le supprimer.' }, { status: 409 });
    }
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.whatsappMessageTemplates.delete(result.template.telnyxId);
    await prisma.whatsAppTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp template delete]', error);
    return providerError(error);
  }
}
