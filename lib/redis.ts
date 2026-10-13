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

// 3. Generic Caching Utilities for Database Queries and API responses
/**
 * Wraps a fetcher function with Redis caching.
 * @param key Unique cache key
 * @param fetcher Function that returns the data if not in cache
 * @param ttl Time to live in seconds (default: 3600s = 1h)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (!redis) {
    return await fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    
    // Only cache non-null/undefined valid data
    if (data !== null && data !== undefined) {
      await redis.set(key, data, { ex: ttl });
    }
    
    return data;
  } catch (error) {
    console.error(`[Redis] Cache error for key ${key}:`, error);
    // Fallback to fetcher if Redis fails
    return await fetcher();
  }
}

/**
 * Manually invalidate a specific cache key
 */
export async function invalidateCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] Invalidate error for key ${key}:`, error);
  }
}

/**
 * Invalidate all cache keys matching a specific prefix (Requires SCAN)
 */
export async function invalidateCacheByPrefix(prefix: string) {
  if (!redis) return;
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
      // Upstash redis.scan returns [cursor, [keys]]
      cursor = typeof result[0] === 'string' ? parseInt(result[0], 10) : result[0];
      const keys = result[1] as string[];
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.error(`[Redis] Prefix invalidate error for prefix ${prefix}:`, error);
  }
}
