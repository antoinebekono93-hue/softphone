import Telnyx from 'telnyx';
import { prisma } from '@/lib/prisma';

let telnyxInstance: any = null;
let configuredTelnyxInstance: any = null;
let configuredTelnyxApiKey: string | null = null;

function createClient(apiKey: string) {
  // Telnyx SDK >= 7 uses an options object. Passing the key positionally
  // silently leaves apiKey unset because the constructor destructures it.
  return new Telnyx({ apiKey });
}

export function getTelnyxClient() {
  if (!telnyxInstance) {
    const telnyxApiKey = process.env.TELNYX_API_KEY;
    if (!telnyxApiKey) {
      throw new Error('TELNYX_API_KEY is not defined in environment variables');
    }
    telnyxInstance = createClient(telnyxApiKey);
  }
  return telnyxInstance;
}

/**
 * Operational Telnyx client. God Mode is the source of truth; the environment
 * remains a deployment fallback. The cache is rotated automatically when an
 * administrator replaces the key in God Mode.
 */
export async function getConfiguredTelnyxApiKey() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: { telnyxApiKey: true },
  });
  const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
  if (!apiKey) throw new Error('Telnyx API key is not configured');
  return apiKey;
}

/** Public Ed25519 key used to authenticate Telnyx webhooks. God Mode is the
 * source of truth and TELNYX_PUBLIC_KEY remains a deployment fallback. */
export async function getConfiguredTelnyxPublicKey() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: { telnyxPublicKey: true },
  });
  const publicKey = settings?.telnyxPublicKey?.trim() || process.env.TELNYX_PUBLIC_KEY?.trim();
  if (!publicKey) throw new Error('Telnyx public key is not configured');
  return publicKey;
}

export async function getConfiguredTelnyxClient() {
  const apiKey = await getConfiguredTelnyxApiKey();
  if (!configuredTelnyxInstance || configuredTelnyxApiKey !== apiKey) {
    configuredTelnyxInstance = createClient(apiKey);
    configuredTelnyxApiKey = apiKey;
  }
  return configuredTelnyxInstance;
}

// For backward compatibility - lazily evaluated
export const telnyx = new Proxy({} as any, {
  get(_, prop) {
    return getTelnyxClient()[prop];
  },
});
