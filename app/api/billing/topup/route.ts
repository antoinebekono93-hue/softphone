import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Update wallet balance
    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { walletBalance: { increment: amount } },
    });

    return NextResponse.json({ 
      success: true, 
      newBalance: organization.walletBalance 
    });
  } catch (error: any) {
    console.error('[Billing TopUp]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
