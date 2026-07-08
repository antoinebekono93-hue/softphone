import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { creditWallet } from '@/lib/billing';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('verif-hash');
    if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
      console.warn('[Flutterwave Webhook] Hash signature manquant ou invalide. Assurez-vous de le configurer.');
    }

    const payload = await req.json();

    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const transactionId = payload.data.id;
      const txRef = payload.data.tx_ref;

      if (!txRef.startsWith('WALLET_TOPUP_')) {
        return NextResponse.json({ status: 'ignored', message: 'Not a wallet topup' });
      }

      const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyData = await verifyRes.json();

      if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
        const amount = verifyData.data.amount;
        const orgId = verifyData.data.meta?.organizationId;

        if (!orgId) {
          console.error('[Flutterwave Webhook] Meta organizationId missing', verifyData.data);
          return NextResponse.json({ error: 'Organization ID missing in meta' }, { status: 400 });
        }

        const existingTx = await prisma.walletTransaction.findFirst({
          where: {
            organizationId: orgId,
            description: {
              contains: `Flutterwave (Tx: ${transactionId})`
            }
          }
        });

        if (!existingTx) {
          await creditWallet(orgId, amount, `Recharge Wallet via Flutterwave (Tx: ${transactionId})`);
          console.log(`[Flutterwave Webhook] Credited organization ${orgId} with ${amount}`);
        } else {
          console.log(`[Flutterwave Webhook] Transaction ${transactionId} already processed.`);
        }

        return NextResponse.json({ status: 'success' });
      } else {
        console.error('[Flutterwave Webhook] Verification failed', verifyData);
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
      }
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error: any) {
    console.error('[Flutterwave Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
