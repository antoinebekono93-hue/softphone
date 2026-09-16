import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { messagingProfileId } = await request.json();
    const number = await prisma.phoneNumber.findFirst({ where: { id: (await params).id, organizationId: session.user.organizationId } });
    if (!number) return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 });
    let providerProfileId = '';
    if (messagingProfileId) {
      const profile = await prisma.messagingProfile.findFirst({ where: { id: messagingProfileId, organizationId: number.organizationId } });
      if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
      providerProfileId = profile.telnyxId;
    }
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.phoneNumbers.messaging.update(number.telnyxId, { messaging_profile_id: providerProfileId });
    const updated = await prisma.phoneNumber.update({ where: { id: number.id }, data: { messagingProfileId: messagingProfileId || null } });
    return NextResponse.json({ number: updated });
  } catch (error) {
    console.error('[SMS number association]', error);
    return NextResponse.json({ error: 'Association non confirmée. Actualisez avant de réessayer.' }, { status: 502 });
  }
}
