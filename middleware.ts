import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths - no auth required
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

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (
    isPublic ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sounds") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Plan status check for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const planStatus = req.auth.user?.planStatus as string | undefined;

    // Allow billing page always
    if (pathname === "/dashboard/billing") {
      return NextResponse.next();
    }

    // Block if plan is inactive
    if (planStatus && planStatus !== "ACTIVE" && planStatus !== "TRIALING") {
      return NextResponse.redirect(new URL("/dashboard/billing", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sounds|sw.js).*)",
  ],
};
