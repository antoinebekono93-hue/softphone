import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
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

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "f62a4b8cd9a714e897b2354c86e0fc21568b209a3c94d12b";
  
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
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
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
