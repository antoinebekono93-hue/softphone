import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

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

export default auth((req) => {
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
  // if (!req.auth) {
  //   const loginUrl = new URL("/login", req.url);
  //   loginUrl.searchParams.set("callbackUrl", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // Check if user has an active organization for dashboard access
  if (pathname.startsWith("/dashboard")) {
    const planStatus = req.auth?.user?.planStatus;

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
});

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
