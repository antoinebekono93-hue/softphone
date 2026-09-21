import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json({ error: 'La création simulée est désactivée. Attribuez un compte WhatsApp réel dans God Mode.', code: 'MOCK_ONBOARDING_REMOVED' }, { status: 410 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json({ error: 'La suppression fournisseur doit être effectuée explicitement depuis le contrôle administrateur.', code: 'PROVIDER_DELETE_REQUIRES_ADMIN' }, { status: 403 });
}
