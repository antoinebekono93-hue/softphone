import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';

// @ts-ignore
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageNumber = url.searchParams.get('page_number') || '1';
    const pageSize = url.searchParams.get('page_size') || '20';

    const response = await telnyxClient.uacConnections.list({
      page_number: parseInt(pageNumber, 10),
      page_size: parseInt(pageSize, 10)
    } as any);
    
    return NextResponse.json({ success: true, connections: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx UAC connections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch UAC connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connection_name, external_uac_settings, internal_uac_settings } = body;

    if (!connection_name) {
      return NextResponse.json(
        { success: false, error: 'connection_name is required' },
        { status: 400 }
      );
    }

    const payload: any = {
      connection_name,
    };

    if (external_uac_settings) {
      payload.external_uac_settings = external_uac_settings;
    }

    if (internal_uac_settings) {
      payload.internal_uac_settings = internal_uac_settings;
    }

    const response = await telnyxClient.uacConnections.create(payload);

    return NextResponse.json({ success: true, connection: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx UAC connection:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create UAC connection' },
      { status: 500 }
    );
  }
}
