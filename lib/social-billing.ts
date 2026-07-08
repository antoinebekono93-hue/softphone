import { prisma } from './prisma';

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
    const org = await tx.organization.findUnique({
      where: { id: organizationId }
    });

    if (!org) throw new Error("Organization not found");
    if (org.walletBalance < amount) throw new Error("Insufficient funds in wallet");

    // Deduct from wallet
    await tx.organization.update({
      where: { id: organizationId },
      data: { walletBalance: { decrement: amount } }
    });

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
