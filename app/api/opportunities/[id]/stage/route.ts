import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.organizationId;
    
    // next15 requires await on params
    const resolvedParams = await params;
    const opportunityId = resolvedParams.id;

    const { stage } = await req.json();

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, organizationId }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const updated = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { stage }
    });

    return NextResponse.json({ success: true, opportunity: updated });
  } catch (error: any) {
    console.error('[Update Opportunity Stage Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
