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
    const { name, language, sms, call, dtmf_confirm } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const payload: any = {
      name,
      language: language || 'en-US'
    };
    if (sms) payload.sms = sms;
    if (call) payload.call = call;
    if (dtmf_confirm) payload.dtmf_confirm = dtmf_confirm;

    const apiKey = process.env.TELNYX_API_KEY;
    const response = await fetch(`https://api.telnyx.com/v2/verify_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Create Verify Profile Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to create verify profile' }, { status: response.status });
    }

    const data = await response.json();
    const profile = data.data;

    // Save to our DB
    await prisma.verifyProfile.create({
      data: {
        id: profile.id,
        name: profile.name,
        language: profile.language,
        settings: JSON.stringify({
          sms: profile.sms,
          call: profile.call,
          dtmf_confirm: profile.dtmf_confirm
        }),
        organizationId: organizationId
      }
    });

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Verify Profile Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We can fetch from local DB for speed, or from Telnyx.
    // Fetching from local DB
    const profiles = await prisma.verifyProfile.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: profiles }, { status: 200 });
  } catch (error: any) {
    console.error('[List Verify Profiles Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
