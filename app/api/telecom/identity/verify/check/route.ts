import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumber, code, verifyProfileId } = body;

    if (!phoneNumber || !code || !verifyProfileId) {
      return NextResponse.json({ error: 'phoneNumber, code, and verifyProfileId are required' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    
    // Note: for DTMF, this endpoint is not used (handled via webhook).
    // This is only for SMS, Voice, and Flashcall where the user inputs the code.
    const url = `https://api.telnyx.com/v2/verifications/by_phone_number/${encodeURIComponent(phoneNumber)}/actions/verify`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code,
        verify_profile_id: verifyProfileId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Check Verification Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to check verification code' }, { status: response.status });
    }

    const data = await response.json();
    const result = data.data; // e.g. { phone_number: "+1...", response_code: "accepted" }

    // Update the latest verification log for this phone number and profile
    if (result.response_code) {
      // Find the most recent pending verification
      const latestLog = await prisma.verificationLog.findFirst({
        where: {
          phoneNumber: phoneNumber,
          verifyProfileId: verifyProfileId,
          organizationId: session.user.organizationId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (latestLog) {
        await prisma.verificationLog.update({
          where: { id: latestLog.id },
          data: { status: result.response_code }
        });
      }
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    console.error('[Check Verification Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
