import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/features",
  "/api/auth",
  "/api/voice/webhook",
  "/api/voice/twiml",
  "/api/voice/status",
  "/api/stripe/webhook",
  "/api/webhooks",
  "/api/cron",
];

// Rate limit configuration per path
const rateLimitConfig: Record<string, { limit: number; window: number }> = {
  "/api/auth/signin": { limit: 5, window: 900 }, // 5 per 15 min
  "/api/auth/register": { limit: 3, window: 900 }, // 3 per 15 min
  "/api/inbox/send": { limit: 30, window: 60 }, // 30 per minute
  "/api/sms/send": { limit: 20, window: 60 }, // 20 per minute
  "/api/calls": { limit: 10, window: 60 }, // 10 per minute
};

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

async function checkRateLimit(pathname: string, identifier: string): Promise<NextResponse | null> {
  const config = rateLimitConfig[pathname];
  if (!config) return null;

  const key = `ratelimit:${pathname}:${identifier}`;
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

    const headers = {
      "X-RateLimit-Limit": config.limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    if (currentCount > config.limit) {
      const response = new NextResponse(JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...headers },
      });
      return response;
    }

    return null;
  } catch (error) {
    console.error("[RateLimit] Redis error:", error);
    // Fail open
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sounds") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Rate limiting for specific API endpoints (before auth)
  if (pathname.startsWith("/api/")) {
    const identifier = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimitResponse = await checkRateLimit(pathname, identifier);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET!;
  
  // NextAuth v5 uses "authjs.session-token" cookie name (not "next-auth.session-token")
  // On HTTPS (Vercel), it becomes "__Secure-authjs.session-token"
  const isSecure = req.url.startsWith("https://");
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await getToken({ 
    req, 
    secret,
    cookieName,
    salt: cookieName,
  });

  if (!token) {
    if (process.env.MOCK_AUTH !== "true") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Plan status check for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const planStatus = token?.planStatus as string | undefined;

    if (pathname === "/dashboard/billing") {
      return NextResponse.next();
    }

    if (planStatus && planStatus !== "ACTIVE" && planStatus !== "TRIALING") {
      return NextResponse.redirect(new URL("/dashboard/billing", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sounds|sw.js).*)",
  ],
};
