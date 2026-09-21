import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendWhatsAppForOrganization, WhatsAppSendError } from '@/lib/whatsapp';

function legacyContent(body: Record<string, unknown>) {
  if (body.whatsappMessage) return body.whatsappMessage;
  if (typeof body.templateId === 'string' && body.templateId.trim()) {
    return {
      type: 'template',
      template: { template_id: body.templateId, components: body.components || [] },
    };
  }
  if (typeof body.templateName === 'string' && body.templateName.trim()) {
    return {
      type: 'template',
      template: {
        name: body.templateName,
        language: { code: body.templateLanguage || 'fr', policy: 'deterministic' },
        components: body.components || [],
      },
    };
  }
  if (typeof body.text === 'string') {
    return { type: 'text', text: { body: body.text, preview_url: Boolean(body.previewUrl) } };
  }
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await sendWhatsAppForOrganization({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      to: body.to,
      content: legacyContent(body),
      agentMessage: Boolean(body.agentMessage),
    });
    return NextResponse.json({ success: true, data: result.message, provider: result.provider, chargedAmount: result.chargedAmount }, { status: 201 });
  } catch (error) {
    if (error instanceof WhatsAppSendError) {
      return NextResponse.json({ error: error.message, code: error.code, charged: error.charged }, { status: error.status });
    }
    console.error('[WhatsApp send]', error);
    return NextResponse.json({ error: 'Le service WhatsApp est momentanément indisponible.' }, { status: 500 });
  }
}
