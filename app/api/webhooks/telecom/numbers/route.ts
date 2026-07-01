import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const event = rawBody.data;

    if (!event || !event.event_type) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventType = event.event_type;
    const payload = event.payload;

    if (eventType === 'advanced_order.status_update') {
      const orderId = payload.order_id;
      const newStatus = payload.new_status;
      
      console.log(`[Webhook] Advanced Order ${orderId} status changed to ${newStatus}`);

      await prisma.numberOrder.updateMany({
        where: { telnyxOrderId: orderId },
        data: { status: newStatus }
      });
    }
    else if (eventType === 'advanced_order.new_comment') {
      console.log(`[Webhook] New comment on Advanced Order ${payload.advanced_order_id}: ${payload.comment}`);
      // In a full CRM, you might save this comment to a Notification table to alert the admin
    }
    else if (eventType === 'number_order.status_update' || eventType === 'inexplicit_number_order.status_update') {
      // For bulk orders (inexplicit) or standard orders
      const orderId = payload.order_id || payload.id;
      const newStatus = payload.new_status || payload.status;
      
      console.log(`[Webhook] Number Order ${orderId} status changed to ${newStatus}`);

      await prisma.numberOrder.updateMany({
        where: { telnyxOrderId: orderId },
        data: { status: newStatus }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Telnyx Numbers Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
