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
    const { phoneNumber, verifyProfileId, method = 'sms' } = body;

    if (!phoneNumber || !verifyProfileId) {
      return NextResponse.json({ error: 'phoneNumber and verifyProfileId are required' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    
    // Determine the endpoint based on the method (sms, call, flashcall, dtmf_confirm)
    let url = '';
    let payload: any = {
      phone_number: phoneNumber,
      verify_profile_id: verifyProfileId
    };

    if (method === 'dtmf_confirm') {
      url = 'https://api.telnyx.com/v2/verifications/dtmf_confirm';
    } else if (method === 'call') {
      url = 'https://api.telnyx.com/v2/verifications/call';
    } else if (method === 'flashcall') {
      url = 'https://api.telnyx.com/v2/verifications/flashcall';
    } else {
      url = 'https://api.telnyx.com/v2/verifications/sms';
    }

    const response = await fetch(url, {
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
      console.error('[Trigger Verification Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || `Failed to trigger ${method} verification` }, { status: response.status });
    }

    const data = await response.json();
    const verification = data.data;

    // Save to VerificationLog
    if (verification?.id) {
      await prisma.verificationLog.create({
        data: {
          id: verification.id,
          phoneNumber: verification.phone_number,
          status: verification.status || 'pending',
          type: verification.type || method,
          verifyProfileId: verifyProfileId,
          organizationId: organizationId
        }
      });
    }

    return NextResponse.json({ success: true, data: verification }, { status: 201 });
  } catch (error: any) {
    console.error('[Trigger Verification Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
