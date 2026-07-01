import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // The Telnyx Node SDK might not have a direct helper for `extend`, 
    // so we can use standard fetch using our API key, or try the SDK if it exists.
    const apiKey = process.env.TELNYX_API_KEY;
    
    const response = await fetch(`https://api.telnyx.com/v2/number_reservations/${id}/actions/extend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Number Reservation Extend Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to extend reservation' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: any) {
    console.error('[Number Reservation Extend Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
