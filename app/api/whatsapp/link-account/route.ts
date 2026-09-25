import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json({
    error: 'Cette route d’inscription non vérifiée a été retirée. Utilisez God Mode → WhatsApp pour attribuer une ressource confirmée par le SDK Telnyx.',
    code: 'USE_TELNYX_WHATSAPP_CONTROL',
  }, { status: 410 });
}
