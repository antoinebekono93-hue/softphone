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
    const { waba_id, phone_number_id } = body;

    if (!waba_id || !phone_number_id) {
      return NextResponse.json({ error: 'waba_id and phone_number_id are required' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || "123456789012345"; // Placeholder

    // Register WABA with Telnyx (Tech Provider Flow)
    const response = await fetch('https://api.telnyx.com/v2/whatsapp/business_accounts/tech_provider', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        waba_id,
        phone_number_id,
        app_id: metaAppId,
        customer_id: organizationId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Telnyx WhatsApp Tech Provider Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to register WhatsApp account with Telnyx' }, { status: response.status });
    }

    const data = await response.json();
    const registeredWaba = data.data;

    // Save in our database
    await prisma.whatsAppAccount.upsert({
      where: {
        organizationId: organizationId
      },
      update: {
        wabaId: waba_id,
        phoneNumberId: phone_number_id,
        status: registeredWaba.status || 'registered'
      },
      create: {
        wabaId: waba_id,
        phoneNumberId: phone_number_id,
        phoneNumber: "", // Will be filled later or by fetching from Telnyx
        accessToken: "", // Not strictly needed for Telnyx flow, but field is required
        status: registeredWaba.status || 'registered',
        organizationId: organizationId
      }
    });

    return NextResponse.json({ success: true, data: registeredWaba }, { status: 201 });
  } catch (error: any) {
    console.error('[WhatsApp Tech Provider Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
