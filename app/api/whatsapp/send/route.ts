import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, templateName, templateLanguage, components, text } = body;

    if (!to) {
      return NextResponse.json({ error: 'Destination number (to) is required' }, { status: 400 });
    }

    // Get the configured WhatsApp number for this organization
    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    // In a real scenario, the from number should be the verified WhatsApp number of the organization.
    // If not saved in DB yet, we would fetch it from Telnyx. Assuming it's in the DB.
    if (!account?.phoneNumber) {
      return NextResponse.json({ error: 'No active WhatsApp phone number found for this organization. Please complete Meta registration.' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    
    let whatsapp_message: any = {};
    if (templateName) {
      whatsapp_message = {
        type: 'template',
        template: {
          name: templateName,
          language: {
            policy: 'deterministic',
            code: templateLanguage || 'en_US'
          },
          components: components || []
        }
      };
    } else if (text) {
      whatsapp_message = {
        type: 'text',
        text: {
          body: text,
          preview_url: false
        }
      };
    } else {
      return NextResponse.json({ error: 'Either templateName or text is required' }, { status: 400 });
    }

    const response = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: account.phoneNumber,
        to,
        whatsapp_message
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Send WhatsApp Error]', errorData);
      return NextResponse.json({ error: errorData.errors?.[0]?.detail || 'Failed to send WhatsApp message' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data }, { status: 201 });
  } catch (error: any) {
    console.error('[Send WhatsApp Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
