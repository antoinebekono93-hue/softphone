// @ts-ignore
import Telnyx from 'telnyx';
import { prisma } from '@/lib/prisma';

let telnyxInstance: any = null;
let configuredTelnyxInstance: any = null;
let configuredTelnyxApiKey: string | null = null;

function createClient(apiKey: string) {
  return new (Telnyx as any)(apiKey);
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
export async function getConfiguredTelnyxClient() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: { telnyxApiKey: true },
  });
  const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
  if (!apiKey) throw new Error('Telnyx API key is not configured');
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
