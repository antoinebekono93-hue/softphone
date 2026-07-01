import { NextResponse } from 'next/server';

const API_BASE = 'https://api.telnyx.com/v2';

// List all porting orders
export async function GET(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const params = new URLSearchParams();

    const status = url.searchParams.get('status');
    const phoneNumber = url.searchParams.get('phone_number');
    const pageNumber = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '20';

    if (status) params.set('filter[status]', status);
    if (phoneNumber) params.set('filter[phone_number]', phoneNumber);
    params.set('page[number]', pageNumber);
    params.set('page[size]', pageSize);

    const res = await fetch(`${API_BASE}/porting_orders?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to list porting orders');

    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    console.error('[Porting Orders List Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create a draft porting order
export async function POST(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json();

    const res = await fetch(`${API_BASE}/porting_orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to create porting order');

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting Order Create Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update a porting order (fulfill requirements, set FOC date, etc.)
export async function PATCH(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 });
    }

    const body = await request.json();

    const res = await fetch(`${API_BASE}/porting_orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to update porting order');

    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Porting Order Update Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete a draft porting order
export async function DELETE(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/porting_orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.errors?.[0]?.detail || 'Failed to delete porting order');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Porting Order Delete Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
