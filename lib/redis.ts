import { Redis } from '@upstash/redis';

// Provide a mock client or a real client depending on env variables.
// If not configured, we'll use a local in-memory Map for testing, 
// though Upstash is required for production serverless environments.

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const redis = (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null; // Fallback to be handled by the consumer if null

/**
 * Multi-Tenant Redis Routing & Session Memory
 * Keys use Hash Tags `{tenant_id}` to ensure all keys for a tenant map to the same Redis cluster node.
 * Format: `tenant:{tenant_id}:{category}:{identifier}`
 */

// 1. Dynamic Routing: Map a phone number to a Tenant ID
export async function cacheTenantRouting(phone: string, tenantId: string) {
  if (!redis) return;
  // Use a global mapping key: `routing:phone:{phone}` -> tenantId
  // This allows O(1) lookup of tenantId from an incoming webhook
  await redis.set(`routing:phone:${phone}`, tenantId);
}

export async function getTenantFromPhone(phone: string): Promise<string | null> {
  if (!redis) return null;
  return await redis.get(`routing:phone:${phone}`);
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
  return await redis.get(key);
}
