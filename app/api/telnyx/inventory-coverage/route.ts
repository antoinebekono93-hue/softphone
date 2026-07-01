import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    // Build filter params from query string
    const params = new URLSearchParams();
    const countryCode = url.searchParams.get('country_code');
    const phoneNumberType = url.searchParams.get('phone_number_type');
    const npa = url.searchParams.get('npa');
    const nxx = url.searchParams.get('nxx');
    const administrativeArea = url.searchParams.get('administrative_area');
    const groupBy = url.searchParams.get('group_by');
    const features = url.searchParams.getAll('features');
    const count = url.searchParams.get('count');

    if (countryCode) params.set('filter[country_code]', countryCode);
    if (phoneNumberType) params.set('filter[phone_number_type]', phoneNumberType);
    if (npa) params.set('filter[npa]', npa);
    if (nxx) params.set('filter[nxx]', nxx);
    if (administrativeArea) params.set('filter[administrative_area]', administrativeArea);
    if (groupBy) params.set('filter[groupBy]', groupBy);
    if (count) params.set('filter[count]', count);
    features.forEach(f => params.append('filter[features][]', f));

    const res = await fetch(`${API_BASE}/inventory_coverage?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to fetch inventory coverage');
    }

    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    console.error('[Inventory Coverage API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory coverage' },
      { status: 500 }
    );
  }
}
