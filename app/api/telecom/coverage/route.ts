import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const countryCode = url.searchParams.get('country_code');

    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    // If a specific country code is provided, fetch that country only
    const endpoint = countryCode
      ? `${API_BASE}/country_coverage/countries/${countryCode}`
      : `${API_BASE}/country_coverage`;

    const res = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to fetch country coverage');
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Coverage API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch coverage' },
      { status: 500 }
    );
  }
}
