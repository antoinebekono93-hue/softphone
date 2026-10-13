import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { parseNotification, verifyNotification, isFinalStatus } from "cinetpay-js";
import { prisma } from "@/lib/prisma";
import { creditWalletAtomically } from "@/lib/billing";
import { getCinetPayClient, getCinetPayCountry } from "@/lib/cinetpay";

const CINETPAY_PROVIDER = "CINETPAY";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** Sentinelle interne : l'intent a déjà été crédité (idempotence). */
class AlreadyProcessedError extends Error {}

/**
 * POST /api/cinetpay/webhook
 *
 * Notification CinetPay (API v1). Résumé :
 *  - Signature implicite : le `notify_token` reçu est comparé (timing-safe) à
 *    celui retourné à l'initialisation (stocké dans PaymentIntent).
 *  - Le statut réel est TOUJOURS reconfirmé via l'API CinetPay (getStatus) :
 *    on ne fait jamais confiance au payload seul.
 *  - Idempotence ATOMIQUE : le `transactionId` CinetPay est revendiqué dans la
 *    même transaction que le crédit (contrainte unique provider+eventId).
 *    Un doublon (retry / concurrence) ne crée AUCUN second crédit.
 *  - Le wallet est crédité du montant enregistré à l'initialisation.
 */
export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      raw = {};
    }

    let notification;
    try {
      notification = parseNotification(raw ?? {});
    } catch {
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { merchantTransactionId: notification.merchantTransactionId },
    });

    if (!intent) {
      return NextResponse.json({ status: "ignored", message: "Unknown transaction" });
    }

    if (
      !intent.notifyToken ||
      !verifyNotification(intent.notifyToken, notification.notifyToken)
    ) {
      console.warn("[CinetPay Webhook] notify_token invalide.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Déjà créditée : idempotent, on ne retraite jamais.
    if (intent.status === "SUCCESS") {
      return NextResponse.json({ status: "success", duplicate: true });
    }

    // Anti-swap : la transaction notifiée doit être celle émise à l'init
    // (identifiant connu côté serveur uniquement).
    if (
      intent.providerTransactionId &&
      notification.transactionId !== intent.providerTransactionId
    ) {
      console.warn("[CinetPay Webhook] transactionId inattendu pour cet intent.");
      return NextResponse.json({ error: "Transaction mismatch" }, { status: 400 });
    }

    // Reconfirmation du statut auprès de CinetPay (source de vérité).
    // On interroge un identifiant SERVEUR (transaction_id stocké à l'init, sinon
    // merchant_transaction_id) et jamais celui du payload : impossible de faire
    // confirmer le statut d'une autre transaction.
    // Le pays d'origine détermine les credentials (isolation des tokens).
    const client = getCinetPayClient();
    const status = await client.payment.getStatus(
      intent.providerTransactionId || intent.merchantTransactionId,
      intent.chargeCountry || getCinetPayCountry(),
    );

    // Le statut retourné doit concerner NOTRE intent (binding marchand).
    if (status.merchantTransactionId !== intent.merchantTransactionId) {
      console.warn("[CinetPay Webhook] merchantTransactionId non concordant.");
      return NextResponse.json({ error: "Transaction mismatch" }, { status: 400 });
    }

    if (status.status !== "SUCCESS") {
      // On mémorise l'échec final s'il l'est, sans jamais créditer.
      if (isFinalStatus(status.status) && intent.status === "PENDING") {
        await prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: status.status },
        });
      }
      return NextResponse.json({ status: "ignored", paymentStatus: status.status });
    }

    let duplicate = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Claim idempotent : on ne bascule PENDING → SUCCESS qu'UNE seule fois.
        // Un second appel (autre transactionId, concurrence, rejeu) ne crédite pas.
        const claimed = await tx.paymentIntent.updateMany({
          where: { id: intent.id, status: { not: "SUCCESS" } },
          data: {
            status: "SUCCESS",
            providerTransactionId:
              intent.providerTransactionId || notification.transactionId,
          },
        });
        if (claimed.count === 0) {
          throw new AlreadyProcessedError();
        }

        // Piste d'audit (2e barrière : contrainte unique provider+eventId).
        await tx.webhookEvent.create({
          data: {
            provider: CINETPAY_PROVIDER,
            eventId: notification.transactionId,
            type: "payment.success",
            organizationId: intent.organizationId,
          },
        });

        await creditWalletAtomically(tx, intent.organizationId, intent.amount.toNumber());

        await tx.walletTransaction.create({
          data: {
            organizationId: intent.organizationId,
            amount: intent.amount,
            type: "CREDIT",
            description: `Recharge Wallet via CinetPay (Tx: ${notification.transactionId})`,
          },
        });
      });
    } catch (err) {
      if (err instanceof AlreadyProcessedError || isUniqueConstraintError(err)) {
        duplicate = true;
      } else {
        throw err;
      }
    }

    if (duplicate) {
      console.log(
        `[CinetPay Webhook] Transaction ${notification.transactionId} déjà traitée.`,
      );
    } else {
      console.log(
        `[CinetPay Webhook] Organisation ${intent.organizationId} créditée de ${intent.amount.toString()}`,
      );
    }

    return NextResponse.json({ status: "success", duplicate });
  } catch (error) {
    console.error("[CinetPay Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
