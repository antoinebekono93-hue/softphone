import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';

// @ts-ignore
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function GET(request: Request) {
  try {
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
    const body = await request.json();
    const { connection_name, user_name, password, outbound_voice_profile_id } = body;

    if (!connection_name || !user_name || !password) {
      return NextResponse.json(
        { success: false, error: 'connection_name, user_name, and password are required' },
        { status: 400 }
      );
    }

    const payload: any = {
      connection_name,
      user_name,
      password,
      active: true,
      anchorsite_override: 'Latency',
      // Configuration par défaut issue des best practices Telnyx (Module 7)
      noise_suppression: {
        direction: 'both',
        noise_suppression_engine: 'Denoiser' // ou 'Krisp Viva Tel Lite'
      },
      jitter_buffer: {
        enable_jitter_buffer: true,
        jitterbuffer_msec_min: 60,
        jitterbuffer_msec_max: 200
      }
    };

    if (outbound_voice_profile_id) {
      payload.outbound = {
        outbound_voice_profile_id,
        localization: 'US' // E.164 validation logic
      };
    }

    const response = await telnyxClient.credentialConnections.create(payload);

    return NextResponse.json({ success: true, connection: response.data });
  } catch (error: any) {
    console.error('Error creating Telnyx SIP connection:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create SIP connection' },
      { status: 500 }
    );
  }
}
