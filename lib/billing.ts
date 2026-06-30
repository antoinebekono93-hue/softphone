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
 * Débite le portefeuille (Wallet) d'une organisation
 * @param organizationId L'ID de l'organisation
 * @param amount Le montant à débiter (doit être positif)
 * @param description Description de la transaction
 * @returns L'organisation mise à jour ou throw une erreur si solde insuffisant
 */
export async function chargeWallet(organizationId: string, amount: number, description: string) {
  if (amount <= 0) throw new Error("Amount must be positive");

  // Utilisation d'une transaction Prisma pour garantir la cohérence des données
  return await prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { walletBalance: true }
    });

    if (!org) throw new Error("Organization not found");
    if (org.walletBalance < amount) {
      throw new Error("Insufficient funds in wallet");
    }

    // Débiter l'organisation
    const updatedOrg = await tx.organization.update({
      where: { id: organizationId },
      data: { walletBalance: { decrement: amount } }
    });

    // Enregistrer la transaction
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: -amount, // Négatif pour un débit
        type: "DEBIT",
        description
      }
    });

    return updatedOrg;
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
  const amount = rates.smsRate * count;
  return await chargeWallet(organizationId, amount, `Facturation de ${count} SMS`);
}

export async function chargeForWhatsApp(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.whatsappRate * count;
  return await chargeWallet(organizationId, amount, `Facturation de ${count} message(s) WhatsApp`);
}

export async function chargeForAiCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = rates.aiAgentRatePerMinute * minutes;
  return await chargeWallet(organizationId, amount, `Facturation de ${minutes} min d'appel IA`);
}

export async function chargeForStandardCall(organizationId: string, minutes: number) {
  const rates = await getSystemRates();
  const amount = rates.callRatePerMinute * minutes;
  return await chargeWallet(organizationId, amount, `Facturation de ${minutes} min d'appel standard`);
}

export async function chargeForPhoneNumber(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.phoneNumberRate * count;
  return await chargeWallet(organizationId, amount, `Facturation abonnement ${count} Numéro(s)`);
}

export async function chargeForESim(organizationId: string, count: number = 1) {
  const rates = await getSystemRates();
  const amount = rates.eSimRate * count;
  return await chargeWallet(organizationId, amount, `Facturation abonnement ${count} e-SIM(s)`);
}
