import type { MetadataRoute } from "next";
import { getSeoSettings, getSiteUrl, toAbsoluteUrl } from "@/lib/seo-metadata";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [seoSettings, siteUrl] = await Promise.all([getSeoSettings(), Promise.resolve(getSiteUrl())]);
  const allowCrawling = seoSettings.robotsIndex && seoSettings.robotsFollow;

  return {
    rules: {
      userAgent: "*",
      allow: allowCrawling ? "/" : undefined,
      disallow: allowCrawling ? ["/admin", "/admin/"] : "/",
    },
    sitemap: siteUrl ? toAbsoluteUrl("/sitemap.xml", siteUrl) : undefined,
  };
}

