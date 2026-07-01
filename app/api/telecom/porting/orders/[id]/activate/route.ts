import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const { id } = await params;

    const res = await fetch(`${API_BASE}/porting_orders/${id}/actions/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to activate porting order');

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting Order Activate Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
