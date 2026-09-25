import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendWhatsAppForOrganization, WhatsAppSendError } from '@/lib/whatsapp';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const { to, text, channel, messageType, buttons, catalogId, productRetailerId } = await req.json();
    if (!to || !channel) return NextResponse.json({ error: 'Destination et canal requis.' }, { status: 400 });
    if (channel !== 'WHATSAPP') return NextResponse.json({ error: 'Ce canal ne dispose pas encore d’un fournisseur de production.' }, { status: 501 });
    let content: any = { type: 'text', text: { body: text, preview_url: false } };
    if (messageType === 'button' && Array.isArray(buttons) && buttons.length) content = {
      type: 'interactive', interactive: { type: 'button', body: { text }, action: { buttons: buttons.map((button: any, index: number) => ({ type: 'reply', reply: { id: button.id || `btn_${index}`, title: button.title } })) } },
    };
    if (messageType === 'product' && catalogId && productRetailerId) content = {
      type: 'interactive', interactive: { type: 'product', body: { text: text || 'Découvrez notre produit :' }, action: { catalog_id: catalogId, product_retailer_id: productRetailerId } },
    };
    const sent = await sendWhatsAppForOrganization({ organizationId: session.user.organizationId, userId: session.user.id, to, content, agentMessage: true });
    return NextResponse.json({ success: true, messageId: sent.message.telnyxMessageId, chargedAmount: sent.chargedAmount }, { status: 201 });
  } catch (error) {
    if (error instanceof WhatsAppSendError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('[Omnichannel send]', error);
    return NextResponse.json({ error: 'Service indisponible.' }, { status: 500 });
  }
}
