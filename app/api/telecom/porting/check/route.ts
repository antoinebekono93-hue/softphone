import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { phone_numbers } = body;

    if (!phone_numbers || !Array.isArray(phone_numbers) || phone_numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'phone_numbers array is required (E.164 format)' },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE}/portability_checks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_numbers: phone_numbers.map((n: string) => ({ phone_number: n })),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to check portability');
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting Check Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check portability' },
      { status: 500 }
    );
  }
}
