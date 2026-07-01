import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';

// @ts-ignore
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connection_id');
    const status = url.searchParams.get('status');
    const tag = url.searchParams.get('tag');
    
    let filter: any = {};
    if (connectionId) filter['resource_id'] = `connection:${connectionId}`;
    if (status) filter['status'] = status;
    if (tag) filter['tag'] = tag;

    const response = await telnyxClient.telephonyCredentials.list({ filter } as any);
    
    return NextResponse.json({ success: true, credentials: response.data, meta: response.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx telephony credentials:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch telephony credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connection_id, expires_at, name, tag } = body;

    if (!connection_id) {
      return NextResponse.json(
        { success: false, error: 'connection_id is required' },
        { status: 400 }
      );
    }

    const payload: any = {
      connection_id,
    };

    if (expires_at) payload.expires_at = expires_at;
    if (name) payload.name = name;
    if (tag) payload.tag = tag;

    const response = await telnyxClient.telephonyCredentials.create(payload);

    return NextResponse.json({ success: true, credential: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx telephony credential:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create telephony credential' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
       return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const { expires_at, name, tag } = body;
    
    const payload: any = {};
    if (expires_at) payload.expires_at = expires_at;
    if (name) payload.name = name;
    if (tag) payload.tag = tag;

    const response = await telnyxClient.telephonyCredentials.update(id, payload);

    return NextResponse.json({ success: true, credential: response.data });
  } catch (error: any) {
    console.error('Error updating Telnyx telephony credential:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update telephony credential' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
       return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 });
    }

    // @ts-ignore
    const response = await telnyxClient.telephonyCredentials.del(id);

    return NextResponse.json({ success: true, credential: response.data });
  } catch (error: any) {
    console.error('Error deleting Telnyx telephony credential:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete telephony credential' },
      { status: 500 }
    );
  }
}
