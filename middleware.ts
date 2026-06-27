import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Paths that don't require authentication.
 */
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
];

/**
 * Check if the current path matches any public path.
 */
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static files
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

  // Temporarily bypassed for UI Demo
  // const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  // if (!token) {
  //   const loginUrl = new URL("/login", req.url);
  //   loginUrl.searchParams.set("callbackUrl", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // We need to fetch the token if they are on a protected dashboard route
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
    const planStatus = token?.planStatus as string | undefined;

    // Allow access to billing page even with inactive plan (so they can reactivate)
    if (pathname === "/dashboard/billing") {
      return NextResponse.next();
    }

    // Block access if plan is not active or trialing
    if (planStatus && planStatus !== "ACTIVE" && planStatus !== "TRIALING") {
      return NextResponse.redirect(new URL("/dashboard/billing", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|sounds|sw.js).*)",
  ],
};
