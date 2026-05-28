import type { Metadata } from "next";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase-app";
import { getSeoSettings, getSiteUrl, toAbsoluteUrl } from "@/lib/seo-metadata";

interface Company {
  company_name?: string;
  company_description?: string;
  mission_statement?: string;
  catalyst_program?: string;
  image_url?: string;
  relevant_sectors?: string[];
}

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

const db = getFirestore(app);

function compactDescription(description: string) {
  return description.replace(/\s+/g, " ").trim().slice(0, 155);
}

export async function generateMetadata({
  params,
}: Omit<CompanyLayoutProps, "children">): Promise<Metadata> {
  const { id } = await params;
  const [seoSettings, companySnapshot] = await Promise.all([
    getSeoSettings(),
    getDoc(doc(db, "companies", id)),
  ]);

  if (!companySnapshot.exists()) {
    return {
      title: "Company Not Found",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const company = companySnapshot.data() as Company;
  const siteUrl = getSiteUrl();
  const canonicalUrl = siteUrl ? toAbsoluteUrl(`/company/${id}`, siteUrl) : "";
  const title = `${company.company_name || "Featured Company"} | ${seoSettings.siteName}`;
  const description = compactDescription(
    company.mission_statement ||
      company.company_description ||
      `Learn more about ${company.company_name || "this featured company"} at the Catalyst Innovation Showcase.`
  );
  const imageUrl = toAbsoluteUrl(company.image_url || seoSettings.ogImageUrl, siteUrl);
  const keywords = [
    company.company_name,
    company.catalyst_program,
    ...(company.relevant_sectors ?? []),
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      type: "article",
      siteName: seoSettings.siteName,
      title,
      description,
      url: canonicalUrl || undefined,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: company.company_name || seoSettings.ogImageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function CompanyLayout({ children }: CompanyLayoutProps) {
  return children;
}

