import type { MetadataRoute } from "next";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase-app";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo-metadata";

const db = getFirestore(app);

async function getCompanySitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getDocs(collection(db, "companies"));

    return snapshot.docs.map((company) => ({
      url: toAbsoluteUrl(`/company/${company.id}`, siteUrl),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to build company sitemap entries", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return [];
  }

  return [
    {
      url: toAbsoluteUrl("/", siteUrl),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(await getCompanySitemapEntries(siteUrl)),
  ];
}

