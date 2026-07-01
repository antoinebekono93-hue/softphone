import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';

// @ts-ignore
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageNumber = url.searchParams.get('page_number') || '1';
    const pageSize = url.searchParams.get('page_size') || '20';

    const response = await telnyxClient.outboundVoiceProfiles.list({
      page_number: parseInt(pageNumber, 10),
      page_size: parseInt(pageSize, 10)
    } as any);
    
    return NextResponse.json({ success: true, profiles: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx outbound voice profiles:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, max_destination_rate, daily_spend_limit } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    const response = await telnyxClient.outboundVoiceProfiles.create({
      name,
      max_destination_rate: max_destination_rate || '0.10', // Bloque les destinations > 0.10$
      daily_spend_limit: daily_spend_limit || '10.00',      // Limite par défaut 10$ / jour
      billing_group_id: null
    });

    return NextResponse.json({ success: true, profile: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx outbound voice profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create profile' },
      { status: 500 }
    );
  }
}
