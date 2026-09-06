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

// ═══════════════════════════════════════════════════════════════════════════════
// Gardes PURE anti-flood (complémentaires au rateLimit Redis ci-dessus).
//
// Pourquoi en plus du rateLimit Redis : le signaling APP_TO_APP est CHATY
// (un ICE_CANDIDATE par candidat, plusieurs dizaines par session/restart).
// Faire un round-trip Redis pour CHAQUE signal doublerait la latence du
// handshake WebRTC et multiplierait le coût Redis. La garde ci-dessous est
// donc :
//  - en mémoire (coût nul par signal, pas d'I/O) ;
//  - par SESSION d'appel (clé `session:<id>`), pas par IP ;
//  - fail-closed déterministe et testable en logique pure.
//
// Limite documentée : horodatage en mémoire par instance serverless. Sur une
// plateforme multi-instances la garde devient "best-effort" (chaque instance
// garde sa propre fenêtre). Elle freine le cas réel (un même client reste en
// pratique rattaché à la même instance chaude) et borne le coût Pusher par
// session ; un comptage PERSISTANT stricte peut être ajouté via
// `rateLimit(id, { limit, window: 60 })` (Redis) si le besoin de rigueur
// multi-instance devient prioritaire.
// ═══════════════════════════════════════════════════════════════════════════════

export type TokenBucket = {
  /** Consomme un jeton pour `key`. Renvoie true si autorisé (et consomme). */
  tryConsume: (key: string, now?: number) => boolean;
  /** Purge les horodatages expirés et les clés vides. */
  prune: (now?: number) => void;
  /** Nombre de clés suivies (diagnostic). */
  size: () => number;
};

/**
 * Fenêtre glissante : garde les `max` derniers horodatages par clé sur
 * `windowMs`. Une clé qui a déjà émis `max` requêtes dans la fenêtre se voit
 * refuser (~`max`/`windowMs` requêtes/seconde au régime durable).
 */
export function createTokenBucket(opts: {
  max: number;
  windowMs: number;
}): TokenBucket {
  const { max, windowMs } = opts;
  const buckets = new Map<string, number[]>();

  return {
    tryConsume(key: string, now: number = Date.now()): boolean {
      const recent = (buckets.get(key) ?? []).filter(
        (t) => now - t < windowMs
      );
      if (recent.length >= max) {
        buckets.set(key, recent);
        return false;
      }
      recent.push(now);
      buckets.set(key, recent);
      return true;
    },
    prune(now: number = Date.now()): void {
      for (const [key, stamps] of buckets) {
        const keep = stamps.filter((t) => now - t < windowMs);
        if (keep.length === 0) buckets.delete(key);
        else buckets.set(key, keep);
      }
    },
    size(): number {
      return buckets.size;
    },
  };
}

export type SignalRateGuard = {
  /**
   * true si la session `key` peut encore émettre un signal dans la fenêtre.
   * N'enregistre PAS la réjection elle-même (l'état est dérivé du bucket).
   */
  allow: (key: string, now?: number) => boolean;
  /**
   * true si cette réjection justifie un log ABUSE_DETECTED (bounded : au plus
   * un par session et par cooldown, après `logAfterRejections` refus consécutifs).
   * À appeler UNIQUEMENT après un retour false de `allow`.
   */
  shouldLogAbuse: (key: string, now?: number) => boolean;
  prune: (now?: number) => void;
};

/**
 * Garde anti-flood dédiée au signaling par session d'appel.
 * - `maxPerMinute` : budget de signaux par session (~3/s soutenus par défaut).
 * - `logAfterRejections` : nombre de refus consécutifs avant un log ABUSE_DETECTED.
 */
export function createSignalRateGuard(opts?: {
  maxPerMinute?: number;
  logAfterRejections?: number;
}): SignalRateGuard {
  const max =
    opts?.maxPerMinute && opts.maxPerMinute > 0 ? opts.maxPerMinute : 180;
  const logAfter =
    opts?.logAfterRejections && opts.logAfterRejections > 0
      ? opts.logAfterRejections
      : 5;
  const bucket = createTokenBucket({ max, windowMs: 60_000 });
  const streaks = new Map<
    string,
    { rejections: number; lastLogAt: number }
  >();
  const LOG_COOLDOWN_MS = 60_000;

  return {
    allow(key: string, now: number = Date.now()): boolean {
      const ok = bucket.tryConsume(key, now);
      if (ok) {
        streaks.delete(key);
        return true;
      }
      return false;
    },
    shouldLogAbuse(key: string, now: number = Date.now()): boolean {
      const prev = streaks.get(key) ?? { rejections: 0, lastLogAt: 0 };
      // lastLogAt === 0 == jamais loggé → pas de cooldown à prendre en compte.
      const inCooldown =
        prev.lastLogAt !== 0 && now - prev.lastLogAt < LOG_COOLDOWN_MS;
      if (inCooldown) return false;
      const rejections = prev.rejections + 1;
      if (rejections < logAfter) {
        streaks.set(key, { rejections, lastLogAt: prev.lastLogAt });
        return false;
      }
      streaks.set(key, { rejections: 0, lastLogAt: now });
      return true;
    },
    prune(now: number = Date.now()): void {
      bucket.prune(now);
      for (const [key, s] of streaks) {
        if (s.rejections === 0 && now - s.lastLogAt >= LOG_COOLDOWN_MS) {
          streaks.delete(key);
        }
      }
    },
  };
}