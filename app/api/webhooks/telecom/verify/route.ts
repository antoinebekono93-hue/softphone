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

    if (eventType.startsWith('verification.')) {
      // E.g., verification.accepted, verification.rejected, verification.expired
      // Usually, telnyx sends verification.status_update or similar. Let's handle status if present.
      
      const verificationId = payload.id;
      const status = payload.status || payload.response_code || eventType.split('.')[1]; // Fallback to event suffix if status not explicitly in payload

      if (verificationId) {
        console.log(`[Webhook] Verification ${verificationId} status update: ${status}`);

        await prisma.verificationLog.updateMany({
          where: { id: verificationId },
          data: { status: status }
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Telnyx Verify Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
