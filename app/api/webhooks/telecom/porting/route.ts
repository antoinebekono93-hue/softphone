import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let event;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload;

    if (!eventType || !payload) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`[Porting Webhook] ${eventType}`);

    switch (eventType) {
      case 'porting_order.status_changed':
        console.log(
          `[Porting] Order ${payload.id} status changed to: ${payload.status?.value}`,
          payload.status?.details?.length > 0
            ? `| Details: ${payload.status.details.map((d: any) => d.code).join(', ')}`
            : ''
        );
        // TODO: Emit real-time event to frontend via WebSocket/SSE
        // TODO: Send notification email to organization admin
        break;

      case 'porting_order.new_comment':
        console.log(
          `[Porting] New comment on order ${payload.porting_order_id}: "${payload.comment?.body}" (by ${payload.comment?.user_type})`
        );
        break;

      case 'porting_order.split':
        console.log(
          `[Porting] Order split: from ${payload.from?.id} to ${payload.to?.id}`
        );
        break;

      case 'porting_order.messaging_changed':
        console.log(
          `[Porting] Messaging status changed on order ${payload.id}: ${payload.messaging?.messaging_port_status}`
        );
        break;

      case 'porting_order.deleted':
        console.log(
          `[Porting] Draft order ${payload.id} deleted at ${payload.deleted_at}`
        );
        break;

      default:
        console.log(`[Porting Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Porting Webhook Error]', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 500 });
  }
}
