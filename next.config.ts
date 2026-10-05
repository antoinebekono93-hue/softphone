import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/api/voice/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
      {
        source: "/api/stripe/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheStartUrl: false,
  fallbacks: { document: "/~offline" },
  reloadOnOnline: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  customWorkerSrc: "worker", // Injecte le contenu de worker/index.ts dans le sw généré
  workboxOptions: {
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      { urlPattern: /\/api\//, handler: "NetworkOnly" },
      { urlPattern: ({ request }) => request.mode === "navigate", handler: "NetworkOnly" },
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/_next/static/"),
        handler: "CacheFirst",
        options: { cacheName: "app-static-v1", expiration: { maxEntries: 160, maxAgeSeconds: 2592000 } },
      },
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/icon-\d+x\d+\.png$/.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: { cacheName: "app-assets-v1", expiration: { maxEntries: 80, maxAgeSeconds: 604800 } },
      },
    ],
    skipWaiting: false,
    clientsClaim: false,
  },
})(withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
}));