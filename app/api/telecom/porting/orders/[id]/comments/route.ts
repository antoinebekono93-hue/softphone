import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

// List all comments for a porting order
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

    const res = await fetch(`${API_BASE}/porting_orders/${id}/comments`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to list comments');

    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    console.error('[Porting Comments List Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create a comment on a porting order
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
    const body = await request.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json({ success: false, error: 'comment body is required' }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/porting_orders/${id}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: comment }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to create comment');

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting Comment Create Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
