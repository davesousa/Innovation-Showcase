import type { Metadata } from "next";
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query } from "firebase/firestore";
import { app } from "@/lib/firebase-app";
import {
  DEFAULT_SEO_SETTINGS,
  SEO_SETTINGS_COLLECTION,
  SEO_SETTINGS_DOC_ID,
  type SeoSettings,
  mergeSeoSettings,
  splitKeywords,
} from "@/lib/seo-config";

const db = getFirestore(app);

interface HeroImage {
  image_url?: string;
  order?: number;
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "";
}

export function toAbsoluteUrl(url: string, siteUrl: string) {
  if (!url) return "";

  try {
    return new URL(url).toString();
  } catch {
    if (!siteUrl) return url;
    return new URL(url, siteUrl).toString();
  }
}

async function getFallbackHeroImageUrl() {
  try {
    const heroImagesQuery = query(collection(db, "hero_images"), orderBy("order", "asc"), limit(1));
    const snapshot = await getDocs(heroImagesQuery);
    const heroImage = snapshot.docs[0]?.data() as HeroImage | undefined;

    return heroImage?.image_url ?? "";
  } catch (error) {
    console.error("Failed to load fallback SEO image", error);
    return "";
  }
}

export async function getSeoSettings() {
  try {
    const snapshot = await getDoc(doc(db, SEO_SETTINGS_COLLECTION, SEO_SETTINGS_DOC_ID));

    return mergeSeoSettings(snapshot.exists() ? (snapshot.data() as Partial<SeoSettings>) : null);
  } catch (error) {
    console.error("Failed to load SEO settings", error);
    return DEFAULT_SEO_SETTINGS;
  }
}

export async function generateSiteMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  const siteUrl = getSiteUrl();
  const metadataBase = siteUrl ? new URL(siteUrl) : undefined;
  const fallbackImageUrl = settings.ogImageUrl ? "" : await getFallbackHeroImageUrl();
  const ogImageUrl = toAbsoluteUrl(settings.ogImageUrl || fallbackImageUrl, siteUrl);
  const twitterImageUrl = toAbsoluteUrl(settings.twitterImageUrl || settings.ogImageUrl || fallbackImageUrl, siteUrl);
  const canonicalUrl = toAbsoluteUrl(settings.canonicalUrl || siteUrl, siteUrl);

  return {
    metadataBase,
    applicationName: settings.siteName,
    title: {
      default: settings.title,
      template: settings.titleTemplate || DEFAULT_SEO_SETTINGS.titleTemplate,
    },
    description: settings.description,
    keywords: splitKeywords(settings.keywords),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.ogTitle || settings.title,
      description: settings.ogDescription || settings.description,
      url: canonicalUrl || undefined,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              alt: settings.ogImageAlt,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: twitterImageUrl ? "summary_large_image" : "summary",
      title: settings.twitterTitle || settings.ogTitle || settings.title,
      description: settings.twitterDescription || settings.ogDescription || settings.description,
      images: twitterImageUrl ? [twitterImageUrl] : undefined,
    },
    robots: {
      index: settings.robotsIndex,
      follow: settings.robotsFollow,
    },
  };
}

