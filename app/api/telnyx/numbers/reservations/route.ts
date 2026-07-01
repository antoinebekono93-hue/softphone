import { NextResponse } from 'next/server';
import { telnyx } from '@/lib/telnyx';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumbers } = await req.json();

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: 'At least one phone number is required' }, { status: 400 });
    }

    // Prepare payload
    const payload = {
      phone_numbers: phoneNumbers.map((num: string) => ({ phone_number: num }))
    };

    // Make request via Telnyx Node SDK
    const response = await telnyx.numberReservations.create(payload);

    return NextResponse.json({ success: true, data: response.data }, { status: 201 });
  } catch (error: any) {
    console.error('[Number Reservation Error]', error);
    const errorMessage = error.raw?.errors?.[0]?.detail || 'Failed to reserve number';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL params for pagination if needed
    const { searchParams } = new URL(req.url);
    const pageNumber = searchParams.get('page[number]') || 1;
    const pageSize = searchParams.get('page[size]') || 20;

    const response = await telnyx.numberReservations.list({
      page: {
        number: Number(pageNumber),
        size: Number(pageSize)
      }
    });

    return NextResponse.json({ success: true, data: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('[List Reservations Error]', error);
    return NextResponse.json({ error: 'Failed to list reservations' }, { status: 500 });
  }
}
