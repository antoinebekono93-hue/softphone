import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { walletBalance: true }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      balance: org.walletBalance,
      transactions: transactions
    });
  } catch (error: any) {
    console.error('[Billing Data] Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
