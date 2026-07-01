import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = process.env.TELNYX_API_KEY;
    
    // id here is the sub_number_order_id
    const response = await fetch(`https://api.telnyx.com/v2/sub_number_orders/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to retrieve sub-order requirements' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Get Sub-Order Requirements Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const payload = await req.json();
    const apiKey = process.env.TELNYX_API_KEY;
    
    // Expected payload: { regulatory_requirements: [...] } or { requirement_group_id: "..." }
    const response = await fetch(`https://api.telnyx.com/v2/sub_number_orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to update requirements' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Update Sub-Order Requirements Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
