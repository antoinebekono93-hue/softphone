import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { creditWalletAtomically } from '@/lib/billing';
import { constantTimeCompare } from '@/lib/security';

const FLUTTERWAVE_PROVIDER = "FLUTTERWAVE";

function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * POST /api/flutterwave/webhook
 *
 * Seul endpoint Flutterwave canonique (l'ancien /api/webhooks/flutterwave a été
 * consolidé ici). Résumé :
 *  - Signature `verif-hash` exigée (fail-closed) et comparée à temps constant.
 *  - Vérification bancaire réelle côté Flutterwave (/v3/transactions/{id}/verify).
 *  - Idempotence ATOMIQUE : le `transactionId` est revendiqué dans la même
 *    transaction que le crédit (contrainte unique provider+eventId).
 *    Un webhook dupliqué (retry/concurrent) ne crée AUCUN second crédit.
 *  - Le wallet n'est crédité qu'une seule fois.
 */
export async function POST(req: Request) {
  try {
    const signature = req.headers.get('verif-hash');
    const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

    if (!signature || !expectedHash || !constantTimeCompare(signature, expectedHash)) {
      console.warn('[Flutterwave Webhook] Hash signature manquante ou invalide.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
      return NextResponse.json({ status: 'ignored' });
    }

    const transactionId = String(payload.data.id);
    const txRef = String(payload.data.tx_ref ?? "");

    // Formats acceptés : WALLET_TOPUP_{orgId}_{timestamp}_{hash} ou topup-{orgId}-{timestamp}
    if (!txRef.startsWith('WALLET_TOPUP_') && !txRef.startsWith('topup-')) {
      return NextResponse.json({ status: 'ignored', message: 'Not a wallet topup' });
    }

    // Vérification bancaire côté Flutterwave (ne JAMAIS faire confiance au payload seul).
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
      console.error('[Flutterwave Webhook] Verification failed', verifyData);
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const amount = verifyData.data.amount;
    const orgId =
      verifyData.data.meta?.organizationId ||
      (txRef.startsWith('topup-')
        ? txRef.split('-')[1]
        : txRef.split('_')[2]);

    if (!orgId) {
      console.error('[Flutterwave Webhook] Organization ID missing', verifyData.data);
      return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });
    }

    let duplicate = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Claim atomique de la transaction (contrainte unique provider+eventId).
        await tx.webhookEvent.create({
          data: {
            provider: FLUTTERWAVE_PROVIDER,
            eventId: transactionId,
            type: 'charge.completed',
            organizationId: orgId,
          },
        });

        await creditWalletAtomically(tx, orgId, amount);
        await tx.walletTransaction.create({
          data: {
            organizationId: orgId,
            amount,
            type: 'CREDIT',
            description: `Recharge Wallet via Flutterwave (Tx: ${transactionId})`,
          },
        });
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        // Déjà traité (transaction id bereits stocké) : aucun second crédit.
        duplicate = true;
      } else {
        throw err;
      }
    }

    if (duplicate) {
      console.log(`[Flutterwave Webhook] Transaction ${transactionId} already processed.`);
    } else {
      console.log(`[Flutterwave Webhook] Credited organization ${orgId} with ${amount}`);
    }

    return NextResponse.json({ status: 'success', duplicate });
  } catch (error: any) {
    console.error('[Flutterwave Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}