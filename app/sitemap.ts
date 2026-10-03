import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/ia", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/receptionniste-ia", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/integrations", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/secteurs", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/etudes-de-cas", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/refund-policy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/acceptable-use", priority: 0.4, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");

  return PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
