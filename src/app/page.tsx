"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/hooks/useFirestore";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RetroTunnelScene } from "@/components/retro-tunnel-scene";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ExternalLink } from "lucide-react";

interface Company {
  id: string;
  company_name: string;
  location_city: string;
  location_country: string;
  full_location: string;
  company_description: string;
  mission_statement: string;
  catalyst_program: string;
  image_url?: string;
  relevant_sectors?: string[];
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time?: string;
}

interface Supporter {
  id: string;
  company_name: string;
  logo: string;
}

interface ScheduleDocument {
  file_name: string;
  download_url: string;
  storage_path: string;
}

interface HeroImage {
  image_url: string;
  storage_path: string;
  order: number;
}

const programSections = [
  {
    name: "Cyber Challenge Program",
    description:
      "The Cyber Challenge empowers technology startups in Ontario to solve industry-specific challenges in seven key sectors. Cyber Challenge startups gain access to new markets, client product testing, and trust-building opportunities while working with seasoned organizations within each sector.",
  },
  {
    name: "RBC FinSec Incubator",
    description:
      "The RBC FinSec Incubator helps early-stage companies transform the financial ecosystem by enhancing product security and resilience. The program allows startups to demonstrate their technologies to industry experts and potential investors, establish connections within the finance sector, and understand industry procurement requirements - bolstered by the robust support of RBC.",
  },
  {
    name: "Law Enforcement Market Access Program",
    description:
      "The Law Enforcement Market Access Program empowers Canadian technology companies looking to provide solutions to law enforcement. These companies validate their market readiness, gain foundational procurement knowledge to bolster sales, and align their solution with legal and regulatory frameworks.",
  },
];

function formatEventTime(time: string) {
  const [hourValue, minuteValue = "00"] = time.split(":");
  const hour = Number(hourValue);

  if (Number.isNaN(hour)) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minuteValue} ${period}`;
}

function getProgramSlug(programName: string) {
  return programName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function scrollProgramCarousel(carouselId: string, direction: "left" | "right") {
  const carousel = document.getElementById(carouselId);

  if (!carousel) return;

  carousel.scrollBy({
    left: direction === "left" ? -500 : 500,
    behavior: "smooth",
  });
}

function isSupporterGridCellWhite(index: number) {
  const hash = Math.imul(index ^ 0x45d9f3b, 0x45d9f3b) ^ Math.imul(index + 97, 0x27d4eb2d);

  return (hash >>> 0) % 100 < 18;
}

function isSupporterGridCellAnimated(index: number) {
  const hash = Math.imul(index + 31, 0x9e3779b1) ^ Math.imul(index ^ 127, 0x85ebca6b);

  return (hash >>> 0) % 100 < 46;
}

function getSupporterGridCellAnimationStyle(index: number) {
  return {
    animationDelay: `${((index * 53) % 360) / 10}s`,
    animationDuration: `${13 + ((index * 29) % 90) / 10}s`,
  };
}

function PixelArrowIcon({ direction }: { direction: "left" | "right" }) {
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

function PixelDownloadIcon() {
  const blockSize = 3;
  const blocks = [
    [3, 1],
    [3, 2],
    [3, 3],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [2, 5],
    [3, 5],
    [4, 5],
    [3, 6],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
  ];

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 21 30"
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      {blocks.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x * blockSize}
          y={y * blockSize}
          width={blockSize}
          height={blockSize}
        />
      ))}
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

export default function Home() {
  const { data: companies, loading: companiesLoading } = useFirestore<Company>("companies");
  const { data: events, loading: eventsLoading } = useFirestore<Event>("schedule");
  const { data: supporters, loading: supportersLoading } = useFirestore<Supporter>("supporters");
  const { data: heroImages } = useFirestore<HeroImage>("hero_images");
  const [scheduleDocument, setScheduleDocument] = useState<ScheduleDocument | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "schedule_documents", "current"), (snapshot) => {
      setScheduleDocument(snapshot.exists() ? (snapshot.data() as ScheduleDocument) : null);
    });

    return () => unsubscribe();
  }, []);

  const handleScheduleDownload = () => {
    if (!scheduleDocument) return;

    window.open("/schedule-download", "_blank", "noopener,noreferrer");
  };

  const orderedHeroImages = [...heroImages]
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white font-sans text-[#303030]">
      {/* Hero Section Container */}
      <section id="home" className="relative min-h-[720px] overflow-hidden bg-[#dfebf7] lg:min-h-screen">
        {/* Hero-only inset frame. Lines intentionally overlap to form corner squares. */}
        <div className="pointer-events-none absolute left-0 right-0 top-8 z-40 h-[2px] bg-[#303030] md:top-10" />
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-40 h-[2px] bg-[#303030] md:bottom-10" />
        <div className="pointer-events-none absolute bottom-0 left-8 top-0 z-40 w-[2px] bg-[#303030] md:left-10" />
        <div className="pointer-events-none absolute bottom-0 right-8 top-0 z-40 w-[2px] bg-[#303030] md:right-10" />

        {/* Corner Icons */}
        <div className="absolute left-0 top-0 z-50 flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
          <Image src="/assets/images/iris_black.webp" alt="Iris" width={32} height={32} className="size-6 opacity-80 md:size-8" />
        </div>
        <div className="absolute bottom-0 right-0 z-50 flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
          <Image src="/assets/images/iris_black.webp" alt="Iris" width={32} height={32} className="size-6 opacity-80 md:size-8" />
        </div>

        {/* Header / Top Bar */}
        <header className="relative z-50 flex h-8 items-center justify-end px-9 md:h-10 md:px-14">
          <a
            href="https://cybersecurecatalyst.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel flex items-center gap-1.5 text-[7px] uppercase tracking-normal transition-opacity hover:opacity-60 sm:text-[8px] md:gap-2.5 md:text-[10px]"
          >
            Return to main site <PixelExternalArrowIcon />
          </a>
        </header>

        <div className="relative flex min-h-[calc(720px-32px)] flex-col pb-16 pt-10 lg:min-h-[calc(100vh-40px)] lg:pb-24 lg:pt-16">
        {/* Navigation - Moved inside hero, above title */}
        <nav className="container relative z-50 mx-auto mb-14 flex flex-wrap gap-x-5 gap-y-3 px-10 text-[9px] font-black uppercase tracking-[0.16em] md:px-12 md:text-[11px] lg:mb-24 lg:gap-10 lg:px-24">
          <a href="#home" className="border-b-2 border-[#0c7bc6] pb-1">Home</a>
          <a href="#agenda" className="hover:text-[#0c7bc6] transition-colors">Agenda</a>
          <a href="#participants" className="hover:text-[#0c7bc6] transition-colors">Participants</a>
          <a href="#supporters" className="hover:text-[#0c7bc6] transition-colors">Supporters</a>
        </nav>

        <div className="container relative z-10 mx-auto grid flex-1 grid-cols-1 items-center gap-12 px-10 md:px-12 lg:grid-cols-[0.7fr_1.3fr] lg:px-24">
          <div className="max-w-2xl">
            <h1 className="mb-5 text-[48px] font-black leading-[0.9] tracking-[-0.055em] sm:text-[58px] md:mb-6 md:text-[74px] xl:text-[94px]">
              Catalyst<br />Innovation<br />Showcase
            </h1>
            <p className="mb-6 max-w-md text-[14px] font-bold leading-snug tracking-tight opacity-70 md:mb-7 md:text-[15px]">
              Join us at the Catalyst Innovation Showcase, where startups from three leading innovation programs will present their technologies.
            </p>
            <div className="font-pixel flex flex-wrap items-center gap-x-3 gap-y-2 text-[8px] uppercase tracking-normal sm:text-[9px] md:text-[10px]">
              <span>THURSDAY, JUNE 11</span>
              <span className="text-[#0c7bc6] text-xl">/</span>
              <span className="opacity-80">3:00 PM - 7:00 PM</span>
            </div>
          </div>
          
          {/* Reactive retro tunnel */}
          <div className="hidden h-[450px] w-full items-center justify-end lg:flex xl:h-[500px] 2xl:h-[550px]">
            <div className="relative h-[500px] w-[1400px] origin-right scale-50 xl:scale-75 2xl:scale-100 2xl:w-full">
              <RetroTunnelScene className="h-full w-full">
                {/* Floating Frames - Matching Master (Rounded, Light Blue Borders) */}
                <div className="absolute top-0 right-10 z-20 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-a-x,0px),var(--tunnel-parallax-a-y,0px),0)]">
                  <div className="flex h-48 w-64 items-center justify-center overflow-hidden border-2 border-[#303030] bg-white shadow-[8px_8px_0_#0c7bc6] origin-center">
                    {orderedHeroImages[0] ? (
                      <Image
                        src={orderedHeroImages[0].image_url}
                        alt="Innovation Showcase hero image 1"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 opacity-20">
                        <Image src="/file.svg" alt="icon" width={64} height={64} className="grayscale" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="absolute -left-64 top-24 z-30 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-b-x,0px),var(--tunnel-parallax-b-y,0px),0)]">
                  <div className="flex h-60 w-80 items-center justify-center overflow-hidden border-2 border-[#303030] bg-white shadow-[8px_8px_0_#0c7bc6] origin-center">
                    {orderedHeroImages[1] ? (
                      <Image
                        src={orderedHeroImages[1].image_url}
                        alt="Innovation Showcase hero image 2"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 opacity-20">
                        <Image src="/file.svg" alt="icon" width={80} height={80} className="grayscale" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 right-20 z-20 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-c-x,0px),var(--tunnel-parallax-c-y,0px),0)]">
                  <div className="flex h-52 w-72 items-center justify-center overflow-hidden border-2 border-[#303030] bg-white shadow-[8px_8px_0_#0c7bc6] origin-center">
                    {orderedHeroImages[2] ? (
                      <Image
                        src={orderedHeroImages[2].image_url}
                        alt="Innovation Showcase hero image 3"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 opacity-20">
                        <Image src="/file.svg" alt="icon" width={64} height={64} className="grayscale" />
                      </div>
                    )}
                  </div>
                </div>
              </RetroTunnelScene>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* REST OF THE SECTIONS (Agenda, Participants, Supporters) */}
      {/* ... keeping them for now but they are below the main hero area ... */}
      
      {/* Agenda Section */}
      <section id="agenda" className="relative z-10 border-t-2 border-[#303030] bg-white py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="mb-10 flex flex-col items-start gap-7 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-pixel mb-0.5 ml-[3px] text-[10px] uppercase tracking-normal text-[#0c7bc6] md:text-[11px]">
                Agenda
              </div>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#303030] sm:text-5xl md:text-6xl">
                Event Highlights
              </h2>
            </div>
            <Button
              variant="outline"
              type="button"
              disabled={!scheduleDocument}
              onClick={handleScheduleDownload}
              className="h-12 cursor-pointer rounded-none border-2 border-[#303030] bg-white px-5 text-sm font-medium text-[#303030] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6] md:h-14 md:px-8 md:text-lg"
              title={scheduleDocument ? `Download ${scheduleDocument.file_name}` : "No schedule PDF has been uploaded yet"}
            >
              Download PDF version <PixelDownloadIcon />
            </Button>
          </div>

          <div className="space-y-3">
            {eventsLoading ? (
              <p>Loading agenda...</p>
            ) : (
              events
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex min-h-28 flex-col gap-3 bg-[#dfebf7] p-3 md:flex-row md:items-stretch md:gap-6"
                  >
                    <div className="flex min-h-20 items-center justify-center bg-[#303030] px-6 text-white md:min-h-24 md:w-44 md:px-8">
                      <span className="font-pixel whitespace-nowrap text-[13px] tracking-normal md:text-[16px]">
                        {formatEventTime(event.start_time)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5 md:py-4">
                      <div className="max-w-md md:w-1/3">
                        <h3 className="text-lg font-black uppercase leading-tight tracking-[-0.02em] text-[#303030] md:text-xl">
                          {event.title}
                        </h3>
                      </div>
                      <p className="max-w-xl text-sm font-medium leading-snug text-[#303030] md:w-1/2 md:text-base">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Participants */}
      <section id="participants" className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="mb-12 md:mb-20">
            <div className="font-pixel mb-0.5 text-[10px] uppercase tracking-normal text-[#0c7bc6] md:text-[11px]">
              The future innovators
            </div>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#303030] sm:text-5xl md:text-6xl">Participants</h2>
          </div>

          {programSections.map((program, index) => {
            const programCompanies = companies.filter(
              (company) => company.catalyst_program === program.name
            );
            const programCarouselId = `program-carousel-${getProgramSlug(program.name)}`;

            return (
            <div
              key={program.name}
              className={`mb-20 last:mb-0 md:mb-32 ${
                index > 0 ? "border-t-2 border-[#303030] pt-16 md:pt-20" : ""
              }`}
            >
              <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-[#303030]/10 pb-8 md:mb-12 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <h3 className="mb-4 text-3xl font-black tracking-[-0.04em] text-[#303030] md:text-4xl">{program.name}</h3>
                  <p className="text-[14px] font-medium leading-relaxed tracking-tight text-[#303030] opacity-70 md:text-[15px]">
                    {program.description}
                  </p>
                </div>
                <div className="flex gap-4 self-end md:self-auto">
                   <button
                     type="button"
                     aria-label={`Scroll ${program.name} companies left`}
                     className="flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white text-[#0c7bc6] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6] md:h-12 md:w-12"
                     onClick={() => scrollProgramCarousel(programCarouselId, "left")}
                   >
                     <PixelArrowIcon direction="left" />
                   </button>
                   <button
                     type="button"
                     aria-label={`Scroll ${program.name} companies right`}
                     className="flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white text-[#0c7bc6] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6] md:h-12 md:w-12"
                     onClick={() => scrollProgramCarousel(programCarouselId, "right")}
                   >
                     <PixelArrowIcon direction="right" />
                   </button>
                </div>
              </div>

              <div id={programCarouselId} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-12 no-scrollbar scroll-smooth md:gap-8">
                {companiesLoading ? (
                  <div className="min-w-[min(340px,calc(100vw-48px))] border-2 border-dashed border-[#303030]/20 bg-white p-8 text-[#303030]/60 md:min-w-[380px] md:p-10">
                    Loading companies...
                  </div>
                ) : programCompanies.length === 0 ? (
                  <div className="min-w-[min(340px,calc(100vw-48px))] border-2 border-dashed border-[#303030]/20 bg-white p-8 md:min-w-[380px] md:p-10">
                    <p className="text-xl font-black tracking-[-0.03em] text-[#303030]">
                      More updates coming soon
                    </p>
                    <p className="mt-3 text-sm font-medium text-[#303030]/60">
                      Companies for this program will appear here once they are added.
                    </p>
                  </div>
                ) : (
                  programCompanies.map((company) => (
                    <Link href={`/company/${company.id}`} key={company.id} className="group w-[min(340px,calc(100vw-48px))] flex-none snap-start md:w-[456px]">
                      <div className="flex h-[540px] w-full flex-col overflow-hidden border-2 border-[#303030] bg-white transition-all group-hover:bg-[#dfebf7] md:h-[610px]">
                        <div className="relative flex min-h-0 flex-1 flex-col">
                          {/* Inset frame: the top/side lines overlap the outer border to create corner squares. */}
                          <div className="pointer-events-none absolute left-0 right-0 top-6 h-[2px] bg-[#303030] md:top-8" />
                          <div className="pointer-events-none absolute bottom-0 left-6 top-0 w-[2px] bg-[#303030] md:left-8" />
                          <div className="pointer-events-none absolute bottom-0 right-6 top-0 w-[2px] bg-[#303030] md:right-8" />

                          <div className="relative z-10 flex h-full flex-col px-10 pb-7 pt-20 md:px-16 md:pb-8 md:pt-28">
                            <div className="relative mb-8 flex size-24 shrink-0 items-center justify-center border-2 border-[#303030] bg-white p-4 shadow-[4px_4px_0_#0c7bc6] md:mb-9 md:size-28">
                              {company.image_url ? (
                                <Image
                                  src={company.image_url}
                                  alt={company.company_name}
                                  fill
                                  className="object-contain p-4"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-[#303030]/5">
                                  <div className="size-10 border-2 border-[#303030]/20" />
                                </div>
                              )}
                            </div>

                            <h4 className="mb-4 text-2xl font-black leading-none tracking-[-0.04em] text-[#303030] group-hover:text-[#0c7bc6] md:text-3xl">
                              {company.company_name}
                            </h4>

                            <p className="mb-6 line-clamp-6 text-[14px] font-medium leading-snug text-[#303030] md:text-[15px]">
                              {company.mission_statement || company.company_description}
                            </p>

                            <ExternalLink className="mt-auto h-7 w-7 shrink-0 text-[#303030]" strokeWidth={2} />
                          </div>
                        </div>

                        <div className="relative z-10 h-[150px] shrink-0 bg-[#030707] px-6 py-5 text-white md:px-8">
                          <div className="font-pixel mb-5 text-[9px] uppercase tracking-normal text-[#89d9dd]">
                            Relevant Sectors
                          </div>
                          <div className="-mx-6 mb-5 h-px bg-[#89d9dd] md:-mx-8" />
                          <div className="flex max-h-[72px] flex-wrap gap-2 overflow-y-auto pr-1 no-scrollbar">
                            {(company.relevant_sectors?.length
                              ? company.relevant_sectors
                              : ["More soon"]
                            ).map((sector) => (
                              <span
                                key={sector}
                                className="bg-[#89d9dd] px-3 py-1.5 text-[11px] font-bold text-[#303030]"
                              >
                                {sector}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Supporters */}
      <section id="supporters" className="relative z-10 bg-white">
        <div className="border-y-2 border-[#303030]">
          <div className="container mx-auto grid px-6 md:grid-cols-[2px_minmax(0,1.3fr)_2px_minmax(0,0.7fr)] md:px-12 lg:px-24">
            <div className="hidden bg-[#303030] md:block" />

            <div className="py-8 md:py-10 md:pl-8 md:pr-10">
              <div className="font-pixel mb-0.5 text-[10px] uppercase tracking-normal text-[#0c7bc6] md:text-[11px]">
                Thank You
              </div>
              <h2 className="whitespace-nowrap text-4xl font-black tracking-[-0.04em] text-[#303030] sm:text-5xl md:text-6xl lg:text-7xl">
                Our Supporters
              </h2>
            </div>

            <div className="hidden bg-[#303030] md:block" />

            <div className="flex items-center justify-start pb-8 md:justify-end md:py-10 md:pl-10">
              <p className="max-w-[520px] text-left text-[14px] font-medium leading-snug text-[#303030] md:text-[15px]">
                <span className="block">
                  The Catalyst Innovation Showcase is made possible
                </span>
                <span className="block">through the generous support of</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[420px] w-full overflow-hidden bg-[#c9c9c9] md:min-h-[520px]">
          <div className="absolute left-0 top-0 grid min-h-full w-full grid-cols-[repeat(auto-fill,16px)] auto-rows-[16px] content-start">
            {Array.from({ length: 9000 }).map((_, i) => {
              const isWhite = isSupporterGridCellWhite(i);
              const shouldAnimate = isWhite && isSupporterGridCellAnimated(i);

              return (
                <div
                  key={i}
                  className={`border-[0.5px] border-[#c9c9c9] ${
                    isWhite ? "bg-white" : ""
                  } ${shouldAnimate ? "supporter-grid-pulse" : ""}`}
                  style={shouldAnimate ? getSupporterGridCellAnimationStyle(i) : undefined}
                />
              );
            })}
          </div>

          <div className="relative z-10 mx-auto flex min-h-[420px] max-w-6xl items-center justify-center px-6 py-16 md:min-h-[520px] md:px-12 lg:px-24">
            {supportersLoading ? (
              <div className="bg-white px-8 py-5 text-sm font-bold text-[#303030]">
                Loading supporters...
              </div>
            ) : supporters.length === 0 ? (
              <div className="border-2 border-[#303030] bg-white px-10 py-8 text-xl font-black text-[#303030]">
                Supporter logos coming soon
              </div>
            ) : (
              <div className="flex w-full max-w-6xl flex-wrap items-center justify-center gap-6 md:gap-8">
                {supporters.slice(0, 4).map((supporter) => (
                    <div
                      key={supporter.id}
                      className="flex size-40 items-center justify-center border-2 border-[#303030] bg-white p-7 shadow-[4px_4px_0_#0c7bc6] sm:size-48 md:size-52 md:p-9 lg:size-56 lg:p-10"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={supporter.logo}
                          alt={supporter.company_name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
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

            <div className="flex gap-4">
              <a
                href="https://cybersecurecatalyst.ca/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white px-6 text-[13px] font-medium text-[#303030] shadow-[4px_4px_0_#0c7bc6] transition-all hover:bg-[#303030] hover:text-[#dfebf7]"
              >
                Contact us
              </a>
            </div>
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
              <span className="text-[#0c7bc6] text-2xl">/</span>
              <span>3:00 PM - 7:00 PM</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-[#303030] bg-[#dfebf7]">
          <div className="container mx-auto flex min-h-24 flex-col justify-between gap-6 px-6 py-8 text-[11px] font-bold text-[#030707] md:flex-row md:items-center md:px-12 lg:px-24">
            <div>© Rogers Cybersecure Catalyst</div>
            <nav className="flex flex-wrap gap-x-6 gap-y-3 md:gap-x-8">
              <a
                href="https://cybersecurecatalyst.ca/accessibility/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0c7bc6] transition-colors"
              >
                Accessibility
              </a>
              <a
                href="https://cybersecurecatalyst.ca/terms/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0c7bc6] transition-colors"
              >
                Terms Of Service
              </a>
              <a
                href="https://cybersecurecatalyst.ca/notice-of-collection/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0c7bc6] transition-colors"
              >
                Notice of Collection
              </a>
            </nav>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .supporter-grid-pulse {
          animation-name: supporterGridPulse;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        @keyframes supporterGridPulse {
          0%,
          42% {
            background-color: #ffffff;
          }
          50% {
            background-color: #c9c9c9;
          }
          92%,
          100% {
            background-color: #c9c9c9;
          }
        }
      `}</style>
    </div>
  );
}
