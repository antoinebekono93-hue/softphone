import { prisma } from './prisma';
import { debitWalletAtomically } from './billing';

export const SOCIAL_RATES = {
  POST_PUBLISHED: 0.15,
  COMMENT_REPLIED: 0.05,
  DM_REPLIED: 0.05,
};

export async function chargeSocialAction(
  organizationId: string, 
  actionType: keyof typeof SOCIAL_RATES, 
  description?: string
) {
  const amount = SOCIAL_RATES[actionType];

  return await prisma.$transaction(async (tx) => {
    // Débit atomique avec garde de solde (jamais négatif).
    const debited = await debitWalletAtomically(tx, organizationId, amount);
    if (!debited) throw new Error("Insufficient funds in wallet");

    // Record the transaction
    await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: -amount,
        type: `SOCIAL_${actionType}`,
        description: description || `Action IA Sociale: ${actionType} (${amount}$)`
      }
    });

    return true;
  });
}
