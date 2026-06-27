import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    if (session.metadata?.type === 'wallet_topup') {
      const orgId = session.metadata.orgId;
      const amountPaid = session.amount_total / 100; // cents to USD

      if (orgId && amountPaid > 0) {
        // Update organization wallet
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            walletBalance: { increment: amountPaid }
          }
        });

        // Record transaction
        await prisma.walletTransaction.create({
          data: {
            amount: amountPaid,
            type: 'CREDIT',
            description: 'Stripe Wallet Top-up',
            organizationId: orgId
          }
        });
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}
