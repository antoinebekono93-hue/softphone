import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Récupère les tarifs globaux du système
 * Si la table est vide, crée et renvoie les valeurs par défaut.
 */
export async function getSystemRates() {
  let settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default" }
    });
  }
  return settings;
}

/** Selling rate for a standard PSTN minute. Kept server-side so a browser
 * cannot forge a cheaper rate. */
export function getStandardCallRate(rates: {
  callBaseRatePerMinute: Prisma.Decimal;
  callMarkupPercent: Prisma.Decimal;
}): Prisma.Decimal {
  return rates.callBaseRatePerMinute.mul(
    new Prisma.Decimal(1).add(rates.callMarkupPercent.div(100)),
  );
}

/**
 * Débit wallet ATOMIQUE avec garde de solde.
 *
 * Effectue l'UPDATE conditionnel :
 *   SET walletBalance = walletBalance - amount
 *   WHERE id = organizationId AND walletBalance >= amount
 *
 * Retourne `true` si la ligne a été modifiée (débit effectué), `false` si le
 * solde est insuffisant (aucun débit). Sûr en concurrence : deux débits
 * simultanés ne peuvent pas faire passer le solde en négatif.
 *
 * À appeler DANS une transaction (`tx = Prisma.TransactionClient`) pour que
 * le débit et la création de ressource restent atomiques.
 */
export async function debitWalletAtomically(
  tx: Prisma.TransactionClient,
  organizationId: string,
  amount: number
): Promise<boolean> {
  const result = await tx.organization.updateMany({
    where: {
      id: organizationId,
      walletBalance: { gte: amount },
    },
    data: {
      walletBalance: { decrement: amount },
    },
  });
  return result.count === 1;
}

/**
 * Crédit wallet ATOMIQUE (remboursement) dans une transaction.
 * Utilisé par la libération/anulation de réservation (PSTN) et par la
 * réconciliation du settlement. Le crédit est inconditionnel (il remonte
 * toujours le solde) ; la protection contre le double-remboursement est
 * assurée par l'état de la réservation (PENDING) et l'index unique
 * `unique_billing_per_call` sur la WalletTransaction associée.
 */
export async function creditWalletAtomically(
  tx: Prisma.TransactionClient,
  organizationId: string,
  amount: number
): Promise<void> {
  await tx.organization.update({
    where: { id: organizationId },
    data: { walletBalance: { increment: amount } },
  });
}

/**
 * Débite le portefeuille (Wallet) d'une organisation
 * @param organizationId L'ID de l'organisation
 * @param amount Le montant à débiter (doit être positif)
 * @param description Description de la transaction
 * @returns L'organisation mise à jour ou throw une erreur si solde insuffisant
 */
export async function chargeWallet(organizationId: string, amount: number, description: string) {
  if (amount <= 0) throw new Error("Amount must be positive");

  // Utilisation d'une transaction Prisma pour garantir la cohérence des données.
  // Le débit est ATOMIQUE avec garde `walletBalance >= amount` (jamais négatif).
  return await prisma.$transaction(async (tx) => {
    const debited = await debitWalletAtomically(tx, organizationId, amount);
    if (!debited) {
      throw new Error("Insufficient funds in wallet");
    }

    // Enregistrer la transaction (seulement si le débit a réussi).
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: -amount, // Négatif pour un débit
        type: "DEBIT",
        description
      }
    });

    return await tx.organization.findUnique({ where: { id: organizationId } });
  });
}

/**
 * Crédite le portefeuille (Wallet) d'une organisation
 * @param organizationId L'ID de l'organisation
 * @param amount Le montant à créditer (doit être positif)
 * @param description Description de la transaction
 * @returns L'organisation mise à jour
 */
export async function creditWallet(organizationId: string, amount: number, description: string) {
  if (amount <= 0) throw new Error("Amount must be positive");

  return await prisma.$transaction(async (tx) => {
    const updatedOrg = await tx.organization.update({
      where: { id: organizationId },
      data: { walletBalance: { increment: amount } }
    });

    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: amount, // Positif pour un crédit
        type: "CREDIT",
        description
      }
    });

    return updatedOrg;
  });
}

// ==========================================
// Méthodes utilitaires de tarification
// ==========================================

export async function chargeForSms(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.smsRate.toNumber() * count;
  return await chargeWallet(organizationId, amount, `Facturation de ${count} SMS`);
}

/**
 * Réserve et débite réellement le prix d'un SMS avant de contacter Telnyx.
 * `reservationId` doit être unique par tentative d'envoi. La contrainte
 * existante (callControlId, type) rend l'opération idempotente.
 */
export async function reserveSmsCharge(organizationId: string, reservationId: string) {
  if (!reservationId) throw new Error('SMS reservation ID is required');
  const reference = `sms:${reservationId}`;
  return prisma.$transaction(async tx => {
    const existing = await tx.walletTransaction.findFirst({
      where: { callControlId: reference, type: 'SMS' },
    });
    if (existing) return { amount: existing.amount.toNumber(), reference };

    const rates = await tx.systemSettings.findUnique({ where: { id: 'default' } });
    const amount = rates?.smsRate ?? new Prisma.Decimal('0.05');
    if (amount.lte(0)) throw new Error('Le tarif SMS doit être supérieur à zéro.');
    const debited = await debitWalletAtomically(tx, organizationId, amount.toNumber());
    if (!debited) throw new Error('Insufficient funds in wallet');
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: amount.neg(),
        type: 'SMS',
        callControlId: reference,
        description: 'Réservation pour envoi SMS Telnyx',
      },
    });
    return { amount: amount.toNumber(), reference };
  });
}

export async function confirmSmsCharge(reference: string, telnyxMessageId: string) {
  await prisma.walletTransaction.updateMany({
    where: { callControlId: reference, type: 'SMS' },
    data: { description: `Facturation SMS Telnyx ${telnyxMessageId}` },
  });
}

/** Rembourse une réservation refusée avec certitude par le fournisseur. */
export async function refundSmsCharge(organizationId: string, reference: string, reason: string) {
  return prisma.$transaction(async tx => {
    const debit = await tx.walletTransaction.findFirst({
      where: { organizationId, callControlId: reference, type: 'SMS' },
    });
    if (!debit) return false;
    const existing = await tx.walletTransaction.findFirst({
      where: { callControlId: reference, type: 'SMS_REFUND' },
    });
    if (existing) return false;
    const amount = debit.amount.abs();
    await creditWalletAtomically(tx, organizationId, amount.toNumber());
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount,
        type: 'SMS_REFUND',
        callControlId: reference,
        description: `Remboursement SMS : ${reason.slice(0, 160)}`,
      },
    });
    return true;
  });
}

export async function chargeForWhatsApp(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.whatsappRate.toNumber() * count;
  return await chargeWallet(organizationId, amount, `Facturation de ${count} message(s) WhatsApp`);
}

/**
 * Réserve le prix God Mode d'un message WhatsApp avant tout appel Telnyx.
 * La référence unique protège contre un double débit lors d'une nouvelle
 * soumission HTTP.
 */
export async function reserveWhatsAppCharge(organizationId: string, reservationId: string) {
  if (!reservationId) throw new Error('WhatsApp reservation ID is required');
  const reference = `wa:${reservationId}`;
  return prisma.$transaction(async tx => {
    const existing = await tx.walletTransaction.findFirst({
      where: { callControlId: reference, type: 'WHATSAPP' },
    });
    if (existing) return { amount: existing.amount.abs().toNumber(), reference };

    const rates = await tx.systemSettings.findUnique({ where: { id: 'default' } });
    const amount = rates?.whatsappRate ?? new Prisma.Decimal('0.02');
    if (amount.lte(0)) throw new Error('Le tarif WhatsApp doit être supérieur à zéro.');
    const debited = await debitWalletAtomically(tx, organizationId, amount.toNumber());
    if (!debited) throw new Error('Insufficient funds in wallet');
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: amount.neg(),
        type: 'WHATSAPP',
        callControlId: reference,
        description: 'Réservation pour envoi WhatsApp Telnyx',
      },
    });
    return { amount: amount.toNumber(), reference };
  });
}

export async function confirmWhatsAppCharge(reference: string, telnyxMessageId: string) {
  await prisma.walletTransaction.updateMany({
    where: { callControlId: reference, type: 'WHATSAPP' },
    data: { description: `Facturation WhatsApp Telnyx ${telnyxMessageId}` },
  });
}

/** Rembourse uniquement un refus fournisseur certain (4xx hors 408/429). */
export async function refundWhatsAppCharge(organizationId: string, reference: string, reason: string) {
  return prisma.$transaction(async tx => {
    const debit = await tx.walletTransaction.findFirst({
      where: { organizationId, callControlId: reference, type: 'WHATSAPP' },
    });
    if (!debit) return false;
    const existing = await tx.walletTransaction.findFirst({
      where: { callControlId: reference, type: 'WHATSAPP_REFUND' },
    });
    if (existing) return false;
    const amount = debit.amount.abs();
    await creditWalletAtomically(tx, organizationId, amount.toNumber());
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount,
        type: 'WHATSAPP_REFUND',
        callControlId: reference,
        description: `Remboursement WhatsApp : ${reason.slice(0, 160)}`,
      },
    });
    return true;
  });
}

export async function chargeForAiCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = rates.aiAgentRatePerMinute.toNumber() * minutes;
  return await chargeWallet(organizationId, amount, `Facturation de ${minutes} min d'appel IA`);
}

export async function chargeForStandardCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = getStandardCallRate(rates).toNumber() * minutes;
  return await chargeWallet(organizationId, amount, `Facturation de ${minutes} min d'appel standard`);
}

export async function chargeForPhoneNumber(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.phoneNumberRate.toNumber() * count;
  return await chargeWallet(organizationId, amount, `Facturation abonnement ${count} Numéro(s)`);
}

export async function chargeForESim(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.eSimRate.toNumber() * count;
  return await chargeWallet(organizationId, amount, `Facturation abonnement ${count} e-SIM(s)`);
}
