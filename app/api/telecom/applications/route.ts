import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';

// @ts-ignore
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageNumber = url.searchParams.get('page_number') || '1';
    const pageSize = url.searchParams.get('page_size') || '20';

    const response = await telnyxClient.callControlApplications.list({
      page_number: parseInt(pageNumber, 10),
      page_size: parseInt(pageSize, 10)
    } as any);
    
    return NextResponse.json({ success: true, applications: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { application_name, webhook_event_url } = body;

    if (!application_name || !webhook_event_url) {
      return NextResponse.json(
        { success: false, error: 'application_name and webhook_event_url are required' },
        { status: 400 }
      );
    }

    const response = await telnyxClient.callControlApplications.create({
      application_name,
      webhook_event_url,
      active: true,
      anchorsite_override: 'Latency',
      webhook_api_version: '2' // Recommandé par la V2
    });

    return NextResponse.json({ success: true, application: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx application:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create application' },
      { status: 500 }
    );
  }
}
