import { canonicalizePhoneNumber } from './phone-number';

export function validateSms(input: Record<string, unknown>) {
  const from = canonicalizePhoneNumber(input.from);
  const to = canonicalizePhoneNumber(input.to);
  if (!from || !to) throw new Error('Les numéros doivent être au format international E.164.');
  const text = typeof input.text === 'string' ? input.text : '';
  if (text.length > 1600) throw new Error('Le texte est limité à 1600 caractères.');
  const mediaUrls = input.mediaUrls ?? [];
  if (!Array.isArray(mediaUrls) || mediaUrls.length > 10 || mediaUrls.some(url => {
    try { return typeof url !== 'string' || new URL(url).protocol !== 'https:'; } catch { return true; }
  })) throw new Error('Les médias doivent être des URL HTTPS (10 maximum).');
  if (!text.trim() && !mediaUrls.length) throw new Error('Ajoutez un texte ou un média.');
  if (input.channel && !['SMS', 'MMS'].includes(String(input.channel))) throw new Error('Cette route accepte uniquement les SMS et MMS.');
  return { from, to, text, mediaUrls: mediaUrls as string[] };
}

export function messagingWebhookUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (!base || new URL(base).protocol !== 'https:') throw new Error('Configurez NEXT_PUBLIC_APP_URL avec votre domaine HTTPS de production.');
  return new URL('/api/webhooks/telecom', base).toString();
}
