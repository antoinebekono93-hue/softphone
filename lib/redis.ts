import { Redis } from '@upstash/redis';

// Use the standard UPSTASH_REDIS_REST variables as the interface is compatible,
// even though this is now connecting to Redis Cloud's Agent Memory service.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const redis = (REDIS_URL && REDIS_TOKEN)
  ? new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })
  : null;

/**
 * Multi-Tenant Redis Routing & Session Memory
 * Keys use Hash Tags `{tenant_id}` to ensure all keys for a tenant map to the same Redis cluster node.
 * Format: `tenant:{tenant_id}:{category}:{identifier}`
 */

// 1. Dynamic Routing: Map a phone number to a Tenant ID
export async function cacheTenantRouting(phone: string, tenantId: string) {
  if (!redis) return;
  await redis.set(`routing:phone:${phone}`, tenantId);
}

export async function getTenantFromPhone(phone: string): Promise<string | null> {
  if (!redis) return null;
  return await redis.get(`routing:phone:${phone}`) as string | null;
}

// 2. Session Memory: Fast access to recent context
export async function cacheSessionContext(tenantId: string, phone: string, context: string) {
  if (!redis) return;
  const key = `tenant:{${tenantId}}:session:${phone}`;
  await redis.set(key, context, { ex: 86400 }); // Expire after 24h
}

export async function getSessionContext(tenantId: string, phone: string): Promise<string | null> {
  if (!redis) return null;
  const key = `tenant:{${tenantId}}:session:${phone}`;
  return await redis.get(key) as string | null;
}
