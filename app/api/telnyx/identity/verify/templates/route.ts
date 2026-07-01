import { NextResponse } from 'next/server';
import { telnyx } from '@/lib/telnyx';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await telnyx.verifyProfiles.retrieveTemplates();

    return NextResponse.json({ success: true, data: response.data }, { status: 200 });
  } catch (error: any) {
    console.error('[Verify Templates Error]', error);
    const errorMessage = error.raw?.errors?.[0]?.detail || 'Failed to list verification templates';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
