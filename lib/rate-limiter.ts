import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
  keyPrefix?: string;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `ratelimit:${config.keyPrefix || "default"}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.window;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    pipeline.zcard(key);
    pipeline.expire(key, config.window);
    const results = await pipeline.exec();

    const currentCount = results[2] as number;
    const remaining = Math.max(0, config.limit - currentCount);
    const reset = now + config.window;

    return {
      success: currentCount <= config.limit,
      limit: config.limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error:", error);
    // Fail open - allow request if Redis is unavailable
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: now + config.window,
    };
  }
}

export function getRateLimitHeaders(result: { limit: number; remaining: number; reset: number }) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}