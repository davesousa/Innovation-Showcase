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

  return (
    <div className="min-h-screen bg-white font-sans text-[#303030]">
      {/* Hero Section Container */}
      <section id="home" className="relative min-h-screen overflow-hidden bg-[#dfebf7]">
        {/* Hero-only inset frame. Lines intentionally overlap to form corner squares. */}
        <div className="pointer-events-none absolute top-10 left-0 right-0 h-[2px] bg-[#303030] z-40" />
        <div className="pointer-events-none absolute bottom-10 left-0 right-0 h-[2px] bg-[#303030] z-40" />
        <div className="pointer-events-none absolute left-10 top-0 bottom-0 w-[2px] bg-[#303030] z-40" />
        <div className="pointer-events-none absolute right-10 top-0 bottom-0 w-[2px] bg-[#303030] z-40" />

        {/* Corner Icons */}
        <div className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center z-50">
          <Image src="/assets/images/iris_black.webp" alt="Iris" width={32} height={32} className="opacity-80" />
        </div>
        <div className="absolute bottom-0 right-0 w-10 h-10 flex items-center justify-center z-50">
          <Image src="/assets/images/iris_black.webp" alt="Iris" width={32} height={32} className="opacity-80" />
        </div>

        {/* Header / Top Bar */}
        <header className="h-10 flex items-center justify-end px-14 relative z-50">
          <a
            href="https://cybersecurecatalyst.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel flex items-center gap-2.5 text-[10px] uppercase tracking-normal hover:opacity-60 transition-opacity"
          >
            Return to main site <PixelExternalArrowIcon />
          </a>
        </header>

        <div className="relative flex min-h-[calc(100vh-40px)] flex-col pt-16 pb-24">
        {/* Navigation - Moved inside hero, above title */}
        <nav className="container mx-auto px-6 md:px-12 lg:px-24 flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] mb-24 relative z-50">
          <a href="#home" className="border-b-2 border-[#0c7bc6] pb-1">Home</a>
          <a href="#agenda" className="hover:text-[#0c7bc6] transition-colors">Agenda</a>
          <a href="#participants" className="hover:text-[#0c7bc6] transition-colors">Participants</a>
          <a href="#supporters" className="hover:text-[#0c7bc6] transition-colors">Supporters</a>
        </nav>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 grid flex-1 grid-cols-1 items-center gap-12 lg:grid-cols-2 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-[74px] md:text-[94px] font-black leading-[0.9] tracking-[-0.055em] mb-6">
              Catalyst<br />Innovation<br />Showcase
            </h1>
            <p className="max-w-md text-[15px] font-bold leading-snug mb-7 tracking-tight opacity-70">
              Join us at the Catalyst Innovation Showcase, where startups from three leading innovation programs will present their technologies.
            </p>
            <div className="font-pixel text-[10px] uppercase tracking-normal flex items-center gap-3">
              <span>THURSDAY, JUNE 11</span>
              <span className="text-[#0c7bc6] text-xl">/</span>
              <span className="opacity-80">3:00 PM - 7:00 PM</span>
            </div>
          </div>
          
          {/* Reactive retro tunnel */}
          <RetroTunnelScene className="hidden h-[500px] w-full lg:block">
            {/* Floating Frames - Matching Master (Rounded, Light Blue Borders) */}
            <div className="absolute top-0 right-10 w-64 h-48 bg-[#dfebf7]/80 border-[6px] border-[#0c7bc6]/30 rounded-[40px] shadow-2xl shadow-[#303030]/5 flex items-center justify-center z-20 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-a-x,0px),var(--tunnel-parallax-a-y,0px),0)]">
               <div className="w-16 h-16 opacity-20">
                 <Image src="/file.svg" alt="icon" width={64} height={64} className="grayscale" />
               </div>
            </div>
            
            <div className="absolute top-40 -left-10 w-80 h-60 bg-[#dfebf7]/90 border-[8px] border-[#0c7bc6]/30 rounded-[50px] shadow-2xl shadow-[#303030]/10 flex items-center justify-center z-30 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-b-x,0px),var(--tunnel-parallax-b-y,0px),0)]">
               <div className="w-20 h-20 opacity-20">
                 <Image src="/file.svg" alt="icon" width={80} height={80} className="grayscale" />
               </div>
            </div>

            <div className="absolute bottom-0 right-20 w-72 h-52 bg-[#dfebf7]/80 border-[7px] border-[#0c7bc6]/30 rounded-[45px] shadow-2xl shadow-[#303030]/5 flex items-center justify-center z-20 transition-transform duration-75 [transform:translate3d(var(--tunnel-parallax-c-x,0px),var(--tunnel-parallax-c-y,0px),0)]">
               <div className="w-16 h-16 opacity-20">
                 <Image src="/file.svg" alt="icon" width={64} height={64} className="grayscale" />
               </div>
            </div>
          </RetroTunnelScene>
        </div>
        </div>
      </section>

      {/* REST OF THE SECTIONS (Agenda, Participants, Supporters) */}
      {/* ... keeping them for now but they are below the main hero area ... */}
      
      {/* Agenda Section */}
      <section id="agenda" className="relative z-10 bg-white py-24 border-t-2 border-[#303030]">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="font-pixel mb-0.5 ml-[3px] text-[11px] uppercase tracking-normal text-[#0c7bc6]">
                Agenda
              </div>
              <h2 className="text-6xl font-black tracking-[-0.04em] text-[#303030]">
                Event Highlights
              </h2>
            </div>
            <Button
              variant="outline"
              type="button"
              disabled={!scheduleDocument}
              onClick={handleScheduleDownload}
              className="h-14 cursor-pointer rounded-none border-2 border-[#303030] bg-white px-8 text-lg font-medium text-[#303030] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6]"
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
                    className="flex min-h-28 flex-col gap-6 bg-[#dfebf7] p-3 md:flex-row md:items-stretch"
                  >
                    <div className="flex min-h-24 items-center justify-center bg-[#303030] px-8 text-white md:w-44">
                      <span className="font-pixel whitespace-nowrap text-[16px] tracking-normal">
                        {formatEventTime(event.start_time)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-6 px-5 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="max-w-md md:w-1/3">
                        <h3 className="text-xl font-black uppercase leading-tight tracking-[-0.02em] text-[#303030]">
                          {event.title}
                        </h3>
                      </div>
                      <p className="max-w-xl text-base font-medium leading-snug text-[#303030] md:w-1/2">
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
      <section id="participants" className="py-24 relative z-10">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="mb-20">
            <div className="font-pixel mb-0.5 text-[11px] uppercase tracking-normal text-[#0c7bc6]">
              The future innovators
            </div>
            <h2 className="text-6xl font-black tracking-[-0.04em] text-[#303030]">Participants</h2>
          </div>

          {programSections.map((program) => {
            const programCompanies = companies.filter(
              (company) => company.catalyst_program === program.name
            );
            const programCarouselId = `program-carousel-${getProgramSlug(program.name)}`;

            return (
            <div key={program.name} className="mb-32 last:mb-0">
              <div className="flex justify-between items-end mb-12 border-b border-[#303030]/10 pb-8">
                <div className="max-w-2xl">
                  <h3 className="text-4xl font-black tracking-[-0.04em] mb-4 text-[#303030]">{program.name}</h3>
                  <p className="text-[15px] font-medium leading-relaxed opacity-70 tracking-tight text-[#303030]">
                    {program.description}
                  </p>
                </div>
                <div className="flex gap-4">
                   <button
                     type="button"
                     aria-label={`Scroll ${program.name} companies left`}
                     className="flex h-12 w-12 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white text-[#0c7bc6] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6]"
                     onClick={() => scrollProgramCarousel(programCarouselId, "left")}
                   >
                     <PixelArrowIcon direction="left" />
                   </button>
                   <button
                     type="button"
                     aria-label={`Scroll ${program.name} companies right`}
                     className="flex h-12 w-12 cursor-pointer items-center justify-center border-2 border-[#303030] bg-white text-[#0c7bc6] shadow-[4px_4px_0_#0c7bc6] transition-all hover:border-[#303030] hover:bg-[#303030] hover:text-[#dfebf7] hover:shadow-[4px_4px_0_#0c7bc6]"
                     onClick={() => scrollProgramCarousel(programCarouselId, "right")}
                   >
                     <PixelArrowIcon direction="right" />
                   </button>
                </div>
              </div>

              <div id={programCarouselId} className="flex overflow-x-auto gap-8 pb-12 no-scrollbar scroll-smooth">
                {companiesLoading ? (
                  <div className="min-w-[380px] border-2 border-dashed border-[#303030]/20 bg-white p-10 text-[#303030]/60">
                    Loading companies...
                  </div>
                ) : programCompanies.length === 0 ? (
                  <div className="min-w-[380px] border-2 border-dashed border-[#303030]/20 bg-white p-10">
                    <p className="text-xl font-black tracking-[-0.03em] text-[#303030]">
                      More updates coming soon
                    </p>
                    <p className="mt-3 text-sm font-medium text-[#303030]/60">
                      Companies for this program will appear here once they are added.
                    </p>
                  </div>
                ) : (
                  programCompanies.map((company) => (
                    <Link href={`/company/${company.id}`} key={company.id} className="group w-[456px] flex-none">
                      <div className="flex h-[610px] w-full flex-col overflow-hidden border-2 border-[#303030] bg-white transition-all group-hover:bg-[#dfebf7]">
                        <div className="relative flex min-h-0 flex-1 flex-col">
                          {/* Inset frame: the top/side lines overlap the outer border to create corner squares. */}
                          <div className="pointer-events-none absolute left-0 right-0 top-8 h-[2px] bg-[#303030]" />
                          <div className="pointer-events-none absolute bottom-0 left-8 top-0 w-[2px] bg-[#303030]" />
                          <div className="pointer-events-none absolute bottom-0 right-8 top-0 w-[2px] bg-[#303030]" />

                          <div className="relative z-10 flex h-full flex-col px-16 pb-8 pt-28">
                            <div className="relative mb-7 h-20 w-48 shrink-0">
                              {company.image_url ? (
                                <Image
                                  src={company.image_url}
                                  alt={company.company_name}
                                  fill
                                  className="object-contain object-left"
                                />
                              ) : (
                                <div className="flex h-20 w-20 items-center justify-center bg-[#303030]/5">
                                  <div className="h-10 w-10 border-2 border-[#303030]/20" />
                                </div>
                              )}
                            </div>

                            <h4 className="mb-4 text-3xl font-black leading-none tracking-[-0.04em] text-[#303030] group-hover:text-[#0c7bc6]">
                              {company.company_name}
                            </h4>

                            <p className="mb-6 line-clamp-6 text-[15px] font-medium leading-snug text-[#303030]">
                              {company.mission_statement || company.company_description}
                            </p>

                            <ExternalLink className="mt-auto h-7 w-7 shrink-0 text-[#303030]" strokeWidth={2} />
                          </div>
                        </div>

                        <div className="relative z-10 h-[150px] shrink-0 bg-[#030707] px-8 py-5 text-white">
                          <div className="font-pixel mb-5 text-[9px] uppercase tracking-normal text-[#89d9dd]">
                            Relevant Sectors
                          </div>
                          <div className="-mx-8 mb-5 h-px bg-[#89d9dd]" />
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
          <div className="container mx-auto grid px-6 md:grid-cols-[2px_1fr_2px_1fr] md:px-12 lg:px-24">
            <div className="hidden bg-[#303030] md:block" />

            <div className="py-10 pl-8 pr-10">
              <div className="font-pixel mb-0.5 text-[11px] uppercase tracking-normal text-[#0c7bc6]">
                Thank You
              </div>
              <h2 className="text-7xl font-black tracking-[-0.04em] text-[#303030]">
                Our Supporters
              </h2>
            </div>

            <div className="hidden bg-[#303030] md:block" />

            <div className="flex items-center justify-end py-10 pl-10">
              <p className="max-w-[520px] text-left text-[15px] font-medium leading-snug text-[#303030]">
                <span className="block">
                  The Catalyst Innovation Showcase is made possible
                </span>
                <span className="block">through the generous support of</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[680px] w-full overflow-hidden border-b-2 border-[#303030] bg-[#c9c9c9]">
          <div className="absolute left-0 top-0 grid min-h-full w-full grid-cols-[repeat(auto-fill,16px)] auto-rows-[16px] content-start">
            {Array.from({ length: 9000 }).map((_, i) => (
              <div
                key={i}
                className={`border-[0.5px] border-[#c9c9c9] ${
                  isSupporterGridCellWhite(i) ? "bg-white" : ""
                }`}
              />
            ))}
          </div>

          <div className="relative z-10 mx-auto flex h-[680px] max-w-6xl items-center justify-center">
            {supportersLoading ? (
              <div className="bg-white px-8 py-5 text-sm font-bold text-[#303030]">
                Loading supporters...
              </div>
            ) : supporters.length === 0 ? (
              <div className="border-2 border-[#303030] bg-white px-10 py-8 text-xl font-black text-[#303030]">
                Supporter logos coming soon
              </div>
            ) : (
              <div className="relative h-[450px] w-[760px]">
                {supporters.slice(0, 4).map((supporter, index) => {
                  const cardPositions = [
                    { left: "0px", top: "44px" },
                    { left: "330px", top: "12px" },
                    { left: "180px", top: "258px" },
                    { left: "510px", top: "230px" },
                  ];

                  return (
                    <div
                      key={supporter.id}
                      className="absolute flex size-56 items-center justify-center border-2 border-[#303030] bg-white p-10"
                      style={cardPositions[index]}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-[#dfebf7] relative z-10">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#303030] flex items-center justify-center text-white font-black text-2xl">IS</div>
                <span className="font-black uppercase tracking-tighter text-2xl">Innovation Showcase</span>
              </div>
              <p className="text-[12px] font-bold leading-relaxed opacity-50 uppercase tracking-tight max-w-xs">
                The premier event for technology and innovation in the security and critical infrastructure sectors.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="text-[11px] font-black uppercase tracking-widest mb-8 opacity-40">Legal Disclaimer</div>
              <p className="text-[11px] font-bold leading-relaxed opacity-30 uppercase tracking-tight">
                All information provided during the Innovation Showcase is for informational purposes only. The organizers do not endorse any specific company or technology presented. Participation in the event does not constitute a partnership or financial agreement between the organizers and the participants.
              </p>
            </div>
          </div>
          
          <div className="pt-16 border-t-2 border-[#303030] flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-[11px] font-black uppercase tracking-widest opacity-30">
              © 2026 Innovation Showcase. Designed for the future.
            </div>
            <div className="flex gap-12 text-[11px] font-black uppercase tracking-widest">
              <a href="#" className="hover:text-[#0c7bc6] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#0c7bc6] transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-[#0c7bc6] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#0c7bc6] transition-colors">Accessibility</a>
            </div>
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
      `}</style>
    </div>
  );
}
