import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const { id } = await params;

    const res = await fetch(`${API_BASE}/porting_orders/${id}/allowed_foc_windows`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to list allowed FOC dates');

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting FOC Dates Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
