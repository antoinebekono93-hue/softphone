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

export async function chargeForWhatsApp(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.whatsappRate.toNumber() * count;
  return await chargeWallet(organizationId, amount, `Facturation de ${count} message(s) WhatsApp`);
}

export async function chargeForAiCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = rates.aiAgentRatePerMinute.toNumber() * minutes;
  return await chargeWallet(organizationId, amount, `Facturation de ${minutes} min d'appel IA`);
}

export async function chargeForStandardCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = rates.callRatePerMinute.toNumber() * minutes;
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
