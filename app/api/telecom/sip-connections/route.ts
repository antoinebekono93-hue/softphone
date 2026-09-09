import { NextResponse } from 'next/server';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { requireSuperAdminApi } from '@/lib/security';
import { credentialConnectionPayload } from '@/lib/telnyx-voice-settings';

export async function GET(request: Request) {
  try {
    const denied = await requireSuperAdminApi();
    if (denied) return denied;
    const telnyxClient = await getConfiguredTelnyxClient();
    const url = new URL(request.url);
    const pageNumber = url.searchParams.get('page_number') || '1';
    const pageSize = url.searchParams.get('page_size') || '20';

    const response = await telnyxClient.credentialConnections.list({
      page_number: parseInt(pageNumber, 10),
      page_size: parseInt(pageSize, 10)
    } as any);
    
    return NextResponse.json({ success: true, connections: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx SIP connections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SIP connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireSuperAdminApi();
    if (denied) return denied;
    const telnyxClient = await getConfiguredTelnyxClient();
    const response = await telnyxClient.credentialConnections.create(credentialConnectionPayload(await request.json(), true) as any);

    return NextResponse.json({ success: true, connection: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx SIP connection:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create SIP connection' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireSuperAdminApi();
    if (denied) return denied;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const client = await getConfiguredTelnyxClient();
    const response = await client.credentialConnections.update(id, credentialConnectionPayload(await request.json()) as any);
    return NextResponse.json({ success: true, connection: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update SIP connection' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireSuperAdminApi();
    if (denied) return denied;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const client = await getConfiguredTelnyxClient();
    const response = await client.credentialConnections.delete(id);
    return NextResponse.json({ success: true, connection: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete SIP connection' }, { status: 500 });
  }
}
