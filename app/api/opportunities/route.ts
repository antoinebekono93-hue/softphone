import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.organizationId;
    
    const { name, expectedRevenue, contactId } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        expectedRevenue: expectedRevenue || 0,
        organizationId,
        contactId: contactId || null,
        stage: 'NEW'
      },
      include: {
        contact: true
      }
    });

    return NextResponse.json({ success: true, opportunity }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Opportunity Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
