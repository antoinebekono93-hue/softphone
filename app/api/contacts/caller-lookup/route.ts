import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { phoneNumberLookupCandidates } from '@/lib/phone-number';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user?.id || !organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const raw = new URL(request.url).searchParams.get('phone');
  const candidates = phoneNumberLookupCandidates(raw);
  if (candidates.length === 0) {
    return NextResponse.json({ contact: null });
  }
  const contact = await prisma.contact.findFirst({
    where: { organizationId, phone: { in: candidates } },
    select: {
      id: true,
      name: true,
      company: true,
      isVip: true,
      totalSpent: true,
      purchaseCount: true,
      lastPurchaseAt: true,
    },
  });
  return NextResponse.json(
    { contact },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
