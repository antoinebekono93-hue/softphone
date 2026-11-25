import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { messagingWebhookUrl } from '@/lib/sms-policy';
import {
  SmsProviderError,
  type SmsSenderPort,
} from '@/lib/ai-tools/sms';

/**
 * Adaptateur Telnyx du port `SmsSenderPort`. Logique d'envoi PARTAGÉE entre
 * `/api/sms/send` et l'outil IA `send_sms` : une seule construction de payload
 * Telnyx, aucun appel HTTP interne. Ce module vit HORS de `lib/ai-tools`
 * (pas d'appel sortant dans le noyau) et n'est jamais importé par les tests.
 *
 * `maxRetries: 0` : le SDK ne doit JAMAIS rejouer de lui-même — le rejeu est
 * gouverné par le claim d'idempotence applicatif.
 */
export function createTelnyxSmsSender(): SmsSenderPort {
  return {
    async send(input) {
      let telnyx: Awaited<ReturnType<typeof getConfiguredTelnyxClient>>;
      let webhookUrl: string;
      try {
        telnyx = await getConfiguredTelnyxClient();
        webhookUrl = messagingWebhookUrl();
      } catch {
        // Configuration/credentials absents : aucun envoi n'a eu lieu.
        throw new SmsProviderError('DEFINITIVE');
      }

      const payload: Record<string, unknown> = {
        from: input.from,
        to: input.to,
        messaging_profile_id: input.messagingProfileTelnyxId,
        webhook_url: webhookUrl,
        use_profile_webhooks: true,
      };
      if (input.text) payload.text = input.text;
      if (input.mediaUrls.length > 0) payload.media_urls = input.mediaUrls;

      let response: { data?: { id?: unknown; type?: unknown } };
      try {
        response = await telnyx.messages.send(payload, { maxRetries: 0 });
      } catch (error) {
        const apiError = error as { status?: unknown; statusCode?: unknown };
        const status = Number(apiError?.status ?? apiError?.statusCode);
        const definitive =
          Number.isFinite(status) && status >= 400 && status < 500;
        console.error('[Telnyx SMS Send Error]', status || 'unknown');
        throw new SmsProviderError(
          definitive ? 'DEFINITIVE' : 'AMBIGUOUS',
          Number.isFinite(status) ? status : undefined
        );
      }

      const providerMessageId = response?.data?.id;
      if (typeof providerMessageId !== 'string' || !providerMessageId) {
        throw new SmsProviderError('AMBIGUOUS');
      }
      const type =
        typeof response.data?.type === 'string'
          ? response.data.type
          : input.mediaUrls.length > 0
            ? 'MMS'
            : 'SMS';

      return { providerMessageId, type };
    },
  };
}
