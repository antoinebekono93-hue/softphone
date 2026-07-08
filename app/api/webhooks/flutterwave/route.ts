import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const signature = req.headers.get('verif-hash');
  
  if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const payload = await req.json();

  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    // tx_ref contains topup-{orgId}-{timestamp} or WALLET_TOPUP_{orgId}_{timestamp}_{hash}
    const txRef = payload.data.tx_ref;
    if (txRef && (txRef.startsWith('topup-') || txRef.startsWith('WALLET_TOPUP_'))) {
      let orgId = '';
      if (txRef.startsWith('topup-')) {
        const parts = txRef.split('-');
        orgId = parts[1];
      } else if (txRef.startsWith('WALLET_TOPUP_')) {
        const parts = txRef.split('_');
        orgId = parts[2];
      }
      
      const amountPaid = payload.data.amount;

      if (orgId && amountPaid > 0) {
        // Need to ensure idempotency to avoid double counting
        // Since we don't have a transaction ID unique field in WalletTransaction,
        // we'll just check if a transaction with this description/txRef exists (approximate)
        const existing = await prisma.walletTransaction.findFirst({
          where: { description: { contains: txRef } }
        });

        if (!existing) {
          const { creditWallet } = await import('@/lib/billing');
          await creditWallet(orgId, amountPaid, `Flutterwave Top-up: ${txRef}`);
        }
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}
