"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RetroTunnelScene } from "@/components/retro-tunnel-scene";
import Image from "next/image";
import Link from "next/link";

interface Company {
  company_name: string;
  linkedin_url: string;
  website_url: string;
  location_city: string;
  location_province_state: string;
  location_country: string;
  full_location: string;
  year_founded: string;
  company_description: string;
  mission_statement: string;
  catalyst_program: string;
  image_url?: string;
  relevant_sectors?: string[];
}

function PixelArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  const blockSize = 4;
  const blocks =
    direction === "left"
      ? [
          [2, 1],
          [1, 2],
          [0, 3],
          [1, 4],
          [2, 5],
          [2, 3],
          [3, 3],
          [4, 3],
          [5, 3],
        ]
      : [
          [3, 1],
          [4, 2],
          [5, 3],
          [4, 4],
          [3, 5],
          [0, 3],
          [1, 3],
          [2, 3],
          [3, 3],
        ];

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <g transform="translate(0 -2)">
        {blocks.map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x * blockSize}
            y={y * blockSize}
            width={blockSize}
            height={blockSize}
          />
        ))}
      </g>
    </svg>
  );
}

function PixelExternalArrowIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-4 items-center justify-center text-[#0c7bc6]"
    >
      <span className="inline-flex scale-75 rotate-[-45deg]">
        <PixelArrowIcon direction="right" />
      </span>
    </span>
  );
}

function getCompanyLink(company: Company) {
  return company.website_url || company.linkedin_url || "";
}

function getDisplayLocation(company: Company) {
  return (
    company.full_location ||
    [company.location_city, company.location_province_state, company.location_country]
      .filter(Boolean)
      .join(", ")
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-y-2 border-[#303030] bg-white">
      <div className="container mx-auto grid gap-12 px-6 py-12 md:grid-cols-[0.82fr_1.28fr] md:gap-0 md:px-12 md:py-16 lg:px-24 lg:py-20">
        <div className="max-w-sm">
          <div className="mb-5">
            <Image
              src="/assets/images/TMU-RCC-Lockup Black.webp"
              alt="Toronto Metropolitan University and Rogers Cybersecure Catalyst"
              width={320}
              height={110}
              className="h-auto w-[220px] object-contain md:w-[260px]"
            />
          </div>

          <p className="mb-8 max-w-[270px] text-[13px] font-medium leading-tight text-[#303030] md:mb-9">
            Rogers Cybersecure Catalyst is Toronto Metropolitan University's national centre for
            training, innovation and collaboration in cybersecurity.
          </p>

          <a
            href="https://cybersecurecatalyst.ca/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white px-6 text-[13px] font-medium text-[#303030] shadow-[4px_4px_0_#0c7bc6] transition-all hover:bg-[#303030] hover:text-[#dfebf7]"
          >
            Contact us
          </a>
        </div>

        <div className="max-w-2xl md:pl-10 lg:pl-20">
          <h2 className="mb-5 text-[36px] font-black leading-[0.95] tracking-[-0.05em] text-[#030707] sm:text-[44px] md:text-[58px]">
            Catalyst Innovation
            <br />
            Showcase
          </h2>
          <p className="mb-8 max-w-[570px] text-[15px] font-medium leading-tight text-[#030707] md:text-[18px]">
            Join us at the Catalyst Innovation Showcase, where startups from three leading
            innovation programs will present their technologies.
          </p>
          <div className="font-pixel flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] uppercase tracking-normal text-[#030707] md:text-[12px]">
            <span>THURSDAY, JUNE 11</span>
            <span className="text-2xl text-[#0c7bc6]">/</span>
            <span>3:00 PM - 7:00 PM</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[#303030] bg-[#dfebf7]">
        <div className="container mx-auto flex min-h-24 flex-col justify-between gap-6 px-6 py-8 text-[11px] font-bold text-[#030707] md:flex-row md:items-center md:px-12 lg:px-24">
          <div>&copy; Rogers Cybersecure Catalyst</div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 md:gap-x-8">
            <a
              href="https://cybersecurecatalyst.ca/accessibility/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#0c7bc6]"
            >
              Accessibility
            </a>
            <a
              href="https://cybersecurecatalyst.ca/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#0c7bc6]"
            >
              Terms Of Service
            </a>
            <a
              href="https://cybersecurecatalyst.ca/notice-of-collection/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#0c7bc6]"
            >
              Notice of Collection
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default function CompanyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      if (!id) return;
      try {
        const docRef = doc(db, "companies", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompany(docSnap.data() as Company);
        } else {
          console.error("No such company!");
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dfebf7] font-sans text-[#303030]">
        Loading company...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#dfebf7] font-sans text-[#303030]">
        <h1 className="text-4xl font-black tracking-[-0.04em]">Company not found</h1>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex h-12 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white px-6 text-[15px] font-bold text-[#303030] shadow-[4px_4px_0_#0c7bc6] transition-all hover:bg-[#303030] hover:text-[#dfebf7]"
        >
          Back to main page
        </button>
      </div>
    );
  }

  const companyLink = getCompanyLink(company);
  const displayLocation = getDisplayLocation(company);

  return (
    <div className="min-h-screen bg-white font-sans text-[#303030]">
      <section className="relative overflow-hidden border-b-2 border-[#303030] bg-[#dfebf7]">
        <div className="pointer-events-none absolute left-0 right-0 top-8 z-40 h-[2px] bg-[#303030] md:top-10" />
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-40 h-[2px] bg-[#303030] md:bottom-10" />
        <div className="pointer-events-none absolute bottom-0 left-8 top-0 z-40 w-[2px] bg-[#303030] md:left-10" />
        <div className="pointer-events-none absolute bottom-0 right-8 top-0 z-40 w-[2px] bg-[#303030] md:right-10" />

        <div className="absolute left-0 top-0 z-50 flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
          <Image src="/assets/images/iris_black.webp" alt="" width={32} height={32} className="size-6 opacity-80 md:size-8" />
        </div>
        <div className="absolute bottom-0 right-0 z-50 flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
          <Image src="/assets/images/iris_black.webp" alt="" width={32} height={32} className="size-6 opacity-80 md:size-8" />
        </div>

        <header className="relative z-50 flex h-8 items-center justify-end px-9 md:h-10 md:px-14">
          <Link
            href="/"
            className="font-pixel flex items-center gap-1.5 text-[7px] uppercase tracking-normal transition-opacity hover:opacity-60 sm:text-[8px] md:gap-2.5 md:text-[10px]"
          >
            Return to main site <PixelExternalArrowIcon />
          </Link>
        </header>

        <div className="relative px-10 pb-16 pt-10 md:px-12 md:pb-20 md:pt-12 lg:px-24">
          <nav className="container relative z-50 mx-auto mb-12 flex flex-wrap gap-x-5 gap-y-3 text-[9px] font-black uppercase tracking-[0.16em] md:mb-16 md:gap-10 md:text-[11px]">
            <Link href="/" className="border-b-2 border-[#0c7bc6] pb-1">
              Home
            </Link>
            <Link href="/#agenda" className="transition-colors hover:text-[#0c7bc6]">
              Agenda
            </Link>
            <Link href="/#participants" className="transition-colors hover:text-[#0c7bc6]">
              Participants
            </Link>
            <Link href="/#supporters" className="transition-colors hover:text-[#0c7bc6]">
              Supporters
            </Link>
          </nav>

          <div className="container relative z-10 mx-auto grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="max-w-xl">
              <Image
                src="/assets/images/TMU-RCC-Lockup Black.webp"
                alt="Toronto Metropolitan University and Rogers Cybersecure Catalyst"
                width={260}
                height={90}
                className="mb-5 h-auto w-[180px] object-contain md:w-[210px]"
              />

              {company.catalyst_program && (
                <div className="font-pixel mb-6 inline-flex max-w-full bg-[#030707] px-3 py-2 text-[7px] uppercase tracking-[0.2em] text-[#dfebf7] md:text-[8px] md:tracking-[0.25em]">
                  {company.catalyst_program}
                </div>
              )}

              <div className="mb-7 flex items-center gap-5">
                <h1 className="text-[42px] font-black leading-[0.92] tracking-[-0.055em] text-[#030707] sm:text-[48px] md:text-[62px]">
                  {company.company_name}
                </h1>
                {company.image_url && (
                  <div className="relative flex size-20 shrink-0 items-center justify-center border-2 border-[#303030] bg-white p-3 shadow-[4px_4px_0_#0c7bc6] md:hidden">
                    <Image
                      src={company.image_url}
                      alt={company.company_name}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                )}
              </div>

              {companyLink && (
                <a
                  href={companyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-5 border-b-2 border-[#303030] pb-2 text-[12px] font-medium text-[#303030] transition-colors hover:text-[#0c7bc6] md:gap-8 md:text-[13px]"
                >
                  Learn more about this company
                  <span className="text-[#0c7bc6]">
                    <PixelArrowIcon />
                  </span>
                </a>
              )}
            </div>

            <RetroTunnelScene className="relative hidden h-[360px] w-full max-w-[560px] justify-self-end lg:block">
              <div className="absolute left-1/2 top-1/2 z-10 flex h-48 w-[260px] items-center justify-center border-2 border-[#303030] bg-white shadow-[8px_8px_0_#0c7bc6] transition-transform duration-75 [transform:translate3d(calc(-97%+var(--tunnel-parallax-b-x,0px)),calc(-105%+var(--tunnel-parallax-b-y,0px)),0)]">
                {company.image_url ? (
                  <Image
                    src={company.image_url}
                    alt={company.company_name}
                    fill
                    className="p-10 object-contain"
                  />
                ) : (
                  <div className="px-8 text-center text-3xl font-black tracking-[-0.04em] text-[#303030]">
                    {company.company_name}
                  </div>
                )}
              </div>
            </RetroTunnelScene>
          </div>
        </div>
      </section>

      <main className="relative grid pb-8 md:pb-10 lg:grid-cols-[35%_65%]">
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-20 h-[2px] bg-[#303030] md:bottom-10" />
        <div className="pointer-events-none absolute bottom-0 top-0 z-30 hidden w-[2px] bg-[#303030] lg:left-[35%] lg:block" />
        <aside className="border-b-2 border-[#303030] px-6 py-12 md:px-12 md:py-16 lg:border-b-0 lg:px-16 lg:py-20">
          <div className="lg:sticky lg:top-8">
            <h2 className="mb-4 hidden text-[38px] font-black leading-[0.95] tracking-[-0.05em] text-[#030707] lg:block">
              {company.company_name}
            </h2>

            {company.catalyst_program && (
              <div className="font-pixel mb-12 hidden max-w-full bg-[#030707] px-3 py-2 text-[8px] uppercase tracking-[0.25em] text-[#dfebf7] lg:inline-flex">
                {company.catalyst_program}
              </div>
            )}

            <div className="mb-10 grid max-w-sm grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 md:mb-12">
              {displayLocation && (
                <div>
                  <div className="font-pixel mb-2 text-[9px] uppercase tracking-[0.18em] text-[#0c7bc6]">
                    Location
                  </div>
                  <div className="text-[13px] font-medium leading-tight text-[#303030]">
                    {displayLocation}
                  </div>
                </div>
              )}

              {company.year_founded && (
                <div>
                  <div className="font-pixel mb-2 text-[9px] uppercase tracking-[0.18em] text-[#0c7bc6]">
                    Founded
                  </div>
                  <div className="text-[13px] font-medium leading-tight text-[#303030]">
                    {company.year_founded}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10 h-px max-w-sm bg-[#89d9dd] md:mb-12" />

            <div className="space-y-5 text-[13px] font-medium text-[#303030]">
              {company.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 transition-colors hover:text-[#0c7bc6]"
                >
                  <span className="flex size-5 items-center justify-center bg-[#303030] text-[10px] text-white">
                    W
                  </span>
                  Visit {company.company_name}
                </a>
              )}
              {company.linkedin_url && (
                <a
                  href={company.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 transition-colors hover:text-[#0c7bc6]"
                >
                  <span className="flex size-5 items-center justify-center bg-[#303030] text-[10px] text-white">
                    in
                  </span>
                  Visit {company.company_name} on LinkedIn
                </a>
              )}
            </div>
          </div>
        </aside>

        <section className="px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20">
          <div className="max-w-4xl">
            <h2 className="mb-8 text-3xl font-black tracking-[-0.04em] text-[#030707] md:text-4xl">
              Overview
            </h2>

            {company.mission_statement && (
              <div className="mb-8 bg-[#dfebf7] p-6 md:p-8">
                <div className="font-pixel mb-3 text-[10px] uppercase tracking-[0.2em] text-[#0c7bc6]">
                  Mission
                </div>
                <p className="text-[15px] font-medium leading-snug text-[#303030]">
                  {company.mission_statement}
                </p>
              </div>
            )}

            {company.company_description && (
              <div className="space-y-5 text-[15px] font-medium leading-relaxed text-[#303030] md:text-[16px]">
                {company.company_description
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
              </div>
            )}

            <h3 className="mb-8 mt-12 text-2xl font-black tracking-[-0.04em] text-[#030707] md:mt-14 md:text-3xl">
              Additional Details
            </h3>

            <div className="grid gap-10 md:grid-cols-[1fr_2px_1fr]">
              <div>
                <div className="font-pixel mb-5 text-[10px] uppercase tracking-[0.2em] text-[#0c7bc6]">
                  Company Details
                </div>
                <div className="space-y-4 text-[14px] font-medium leading-snug">
                  {company.catalyst_program && (
                    <div>
                      <span className="font-black">Program:</span> {company.catalyst_program}
                    </div>
                  )}
                  {displayLocation && (
                    <div>
                      <span className="font-black">Location:</span> {displayLocation}
                    </div>
                  )}
                  {company.year_founded && (
                    <div>
                      <span className="font-black">Founded:</span> {company.year_founded}
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden bg-[#303030]/20 md:block" />

              {company.relevant_sectors && company.relevant_sectors.length > 0 && (
                <div>
                  <div className="font-pixel mb-5 text-[10px] uppercase tracking-[0.2em] text-[#0c7bc6]">
                    Sectors Supported
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {company.relevant_sectors.map((sector) => (
                      <span
                        key={sector}
                        className="bg-[#89d9dd] px-3 py-1.5 text-[12px] font-bold text-[#303030]"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="mt-16 inline-flex items-center gap-8 border-b-2 border-[#303030] pb-2 text-[13px] font-medium text-[#303030] transition-colors hover:text-[#0c7bc6]"
            >
              Back to main page
              <span className="text-[#0c7bc6]">
                <PixelArrowIcon />
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
