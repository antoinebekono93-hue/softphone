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

    const body = await req.json();
    const { name, category, language, components } = body;

    if (!name || !components) {
      return NextResponse.json({ error: 'Name and components are required' }, { status: 400 });
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId }
    });

    if (!account || !account.wabaId) {
      return NextResponse.json({ error: 'WhatsApp account not fully connected. Missing WABA ID.' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;

    // Call Telnyx API to create template
    const response = await fetch(`https://api.telnyx.com/v2/whatsapp/${account.wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        category: category || 'MARKETING',
        language: language || 'fr',
        components
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Create WhatsApp Template Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to create template on Meta' }, { status: response.status });
    }

    const telnyxData = await response.json();
    const metaTemplate = telnyxData.data;

    // Save to DB
    const template = await prisma.whatsAppTemplate.create({
      data: {
        name: metaTemplate.name || name,
        category: metaTemplate.category || category || 'MARKETING',
        language: metaTemplate.language || language || 'fr',
        status: metaTemplate.status || 'PENDING',
        content: JSON.stringify(components), // we store the components array
        organizationId
      }
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error: any) {
    console.error('[Create WhatsApp Template Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ideally we would fetch from Telnyx to get the latest status (APPROVED/REJECTED)
    // and sync our DB. For now, just return what's in DB.
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
