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

    const payload = await req.json();
    
    // We expect payload to match Telnyx Inexplicit Number Order structure
    // e.g. { "ordering_groups": [ { "country_iso": "US", "count_requested": 5, "phone_number_type": "local" } ] }

    const apiKey = process.env.TELNYX_API_KEY;
    const response = await fetch(`https://api.telnyx.com/v2/inexplicit_number_orders`, {
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
      console.error('[Bulk Order Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to place bulk order' }, { status: response.status });
    }

    const data = await response.json();

    // Create a local NumberOrder tracking record
    if (data.data?.id) {
      await prisma.numberOrder.create({
        data: {
          telnyxOrderId: data.data.id,
          type: 'BULK',
          status: data.data.status || 'pending',
          phoneNumbers: JSON.stringify(payload.ordering_groups),
          organizationId: organizationId
        }
      });
    }

    return NextResponse.json({ success: true, data: data.data }, { status: 201 });
  } catch (error: any) {
    console.error('[Bulk Order Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    const response = await fetch(`https://api.telnyx.com/v2/inexplicit_number_orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    console.error('[List Bulk Orders Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
