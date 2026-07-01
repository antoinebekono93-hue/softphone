import { NextResponse } from 'next/server';
import { telnyx } from '@/lib/telnyx';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber query parameter is required' }, { status: 400 });
    }

    // Number Lookup via Telnyx SDK
    // Request carrier and caller-name information
    const response = await telnyx.numberLookup.retrieve(phoneNumber, {
      type: ['caller-name', 'carrier']
    });

    return NextResponse.json({ success: true, data: response.data }, { status: 200 });
  } catch (error: any) {
    console.error('[Number Lookup Error]', error);
    const errorMessage = error.raw?.errors?.[0]?.detail || 'Failed to lookup number';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
