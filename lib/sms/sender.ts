import { prisma } from '@/lib/prisma';

/**
 * Résolution canonique de l'expéditeur SMS d'un tenant. Partage la MÊME logique
 * entre la route `/api/sms/send` et l'outil IA `send_sms` : jamais de
 * sélection d'expéditeur par l'appelant, toujours scopée par organisation.
 *
 * Le résultat est discriminé pour permettre aux appelants de distinguer
 * « numéro inconnu » de « numéro sans profil de messagerie » (le route HTTP
 * renvoie 403 vs 422) sans dupliquer la logique d'accès base.
 */
export interface ResolvedSmsSender {
  phoneNumberId: string;
  fromNumber: string;
  messagingProfileId: string;
  messagingProfileTelnyxId: string;
}

export type SmsSenderResolution =
  | { status: 'OK'; sender: ResolvedSmsSender }
  | { status: 'NOT_FOUND' }
  | { status: 'NO_PROFILE' };

/**
 * Résout l'expéditeur actif du tenant.
 *
 * - `requestedFrom` fourni (route existante) : exige le numéro exact, actif et
 *   appartenant au tenant ; l'absence de profil est distinguée (`NO_PROFILE`).
 * - `requestedFrom` absent (outil IA) : premier numéro actif doté d'un profil,
 *   par ordre de création déterministe.
 */
export async function resolveActiveSmsSender(
  organizationId: string,
  requestedFrom?: string | null
): Promise<SmsSenderResolution> {
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      status: 'ACTIVE',
      ...(requestedFrom
        ? { number: requestedFrom }
        : { messagingProfileId: { not: null } }),
    },
    include: { messagingProfile: true },
    orderBy: requestedFrom ? undefined : { createdAt: 'asc' },
  });

  if (!phoneNumber) return { status: 'NOT_FOUND' };

  const profile = phoneNumber.messagingProfile;
  if (!profile || profile.organizationId !== organizationId) {
    return { status: 'NO_PROFILE' };
  }

  return {
    status: 'OK',
    sender: {
      phoneNumberId: phoneNumber.id,
      fromNumber: phoneNumber.number,
      messagingProfileId: profile.id,
      messagingProfileTelnyxId: profile.telnyxId,
    },
  };
}
