import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const { aiEmployeeId } = body;
    
    if (!aiEmployeeId) return NextResponse.json({ error: 'aiEmployeeId is required' }, { status: 400 });

    // Mock OAuth connection
    const account = await prisma.socialAccount.create({
      data: {
        provider: 'TIKTOK',
        accountId: 'mock-tk-' + Date.now(),
        accountName: 'Compte TikTok (Mock)',
        accessToken: 'mock_tk_token_abc123',
        status: 'ACTIVE',
        organizationId: session.user.organizationId,
        aiEmployeeId: aiEmployeeId
      }
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error('TikTok Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
