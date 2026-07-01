import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the WABA ID for the organization
    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!account?.wabaId) {
      return NextResponse.json({ error: 'WhatsApp Business Account not connected' }, { status: 400 });
    }

    const body = await req.json();
    const { name, category, language, components } = body;

    const apiKey = process.env.TELNYX_API_KEY;
    const response = await fetch('https://api.telnyx.com/v2/whatsapp/message_templates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        category,
        language,
        waba_id: account.wabaId,
        components
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Create WhatsApp Template Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to create template' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data }, { status: 201 });
  } catch (error: any) {
    console.error('[Create WhatsApp Template Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
