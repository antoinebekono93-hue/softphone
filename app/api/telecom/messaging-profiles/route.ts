import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { messagingWebhookUrl } from '@/lib/sms-policy';

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profiles = await prisma.messagingProfile.findMany({
    where: { organizationId: session.user.organizationId }, orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name } = await request.json();
    if (typeof name !== 'string' || !name.trim() || name.length > 100) return NextResponse.json({ error: 'Nom requis (100 caractères maximum).' }, { status: 400 });
    const webhookUrl = messagingWebhookUrl();
    const telnyx = await getConfiguredTelnyxClient();
    const response = await telnyx.messagingProfiles.create({
      name: name.trim(), webhook_url: webhookUrl, webhook_api_version: '2',
      whitelisted_destinations: ['US'], enabled: false,
    }, { maxRetries: 0 });
    if (!response.data?.id) throw new Error('Missing Telnyx profile ID');
    const profile = await prisma.messagingProfile.create({
      data: { telnyxId: response.data.id, name: name.trim(), webhookUrl, organizationId: session.user.organizationId },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[Messaging profile create]', error);
    return NextResponse.json({ error: 'Création non confirmée. Vérifiez les profils Telnyx avant de réessayer.' }, { status: 502 });
  }
}
