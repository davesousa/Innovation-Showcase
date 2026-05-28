export const SEO_SETTINGS_COLLECTION = "site_settings";
export const SEO_SETTINGS_DOC_ID = "seo";

export interface SeoSettings {
  siteName: string;
  title: string;
  titleTemplate: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogImageAlt: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteName: "Catalyst Innovation Showcase",
  title: "Catalyst Innovation Showcase | Rogers Cybersecure Catalyst",
  titleTemplate: "%s | Catalyst Innovation Showcase",
  description:
    "Join Rogers Cybersecure Catalyst for the Catalyst Innovation Showcase, featuring startups from leading cyber, finance, and law enforcement innovation programs.",
  keywords:
    "Catalyst Innovation Showcase, Rogers Cybersecure Catalyst, cybersecurity startups, innovation showcase, Cyber Challenge Program, RBC FinSec Incubator, Law Enforcement Market Access Program",
  canonicalUrl: "",
  ogTitle: "Catalyst Innovation Showcase",
  ogDescription:
    "Meet startups from Rogers Cybersecure Catalyst innovation programs and discover emerging technologies across cybersecurity, finance, and public safety.",
  ogImageUrl: "",
  ogImageAlt: "Catalyst Innovation Showcase event preview",
  twitterTitle: "Catalyst Innovation Showcase",
  twitterDescription:
    "Discover startups presenting emerging technologies at the Catalyst Innovation Showcase.",
  twitterImageUrl: "",
  robotsIndex: true,
  robotsFollow: true,
};

export function mergeSeoSettings(settings?: Partial<SeoSettings> | null): SeoSettings {
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...Object.fromEntries(
      Object.entries(settings ?? {}).filter(([, value]) => value !== undefined && value !== null)
    ),
  };
}

export function splitKeywords(keywords: string) {
  return keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

