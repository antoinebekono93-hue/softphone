import { NextResponse } from 'next/server';

// We will use native fetch since we're not 100% sure if the Node SDK 
// fully exposes `.mobilePushCredentials` in the current version installed.
const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(request: Request) {
  try {
    const res = await fetch(`${API_BASE}/mobile_push_credentials`, {
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
      }
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to fetch mobile push credentials');

    return NextResponse.json({ success: true, credentials: data.data, meta: data.meta });
  } catch (error: any) {
    console.error('Error fetching Telnyx mobile push credentials:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch mobile push credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Payload depends on the type. 
    // iOS: type='ios', certificate='...', private_key='...'
    // Android: type='android', push_account_json='...'
    const res = await fetch(`${API_BASE}/mobile_push_credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to create mobile push credential');

    return NextResponse.json({ success: true, credential: data.data });
  } catch (error: any) {
    console.error('Error creating Telnyx mobile push credential:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create mobile push credential' },
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

    const res = await fetch(`${API_BASE}/mobile_push_credentials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.errors?.[0]?.detail || 'Failed to delete mobile push credential');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting Telnyx mobile push credential:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete mobile push credential' },
      { status: 500 }
    );
  }
}
