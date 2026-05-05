import type { HomepageContent } from "@/lib/content/homepage";
import type { ProjectRow } from "@/types/project";
import Link from "next/link";

export type ProjectsSectionProps = {
  content: Pick<HomepageContent, "projects_label" | "projects_heading">;
  projects: ProjectRow[];
};

type ProjectListPlaceholder = {
  title: string;
  sector: string;
  location: string;
  slug: string;
  description: string;
};

const PLACEHOLDER_PROJECTS: ProjectListPlaceholder[] = [
  {
    title: "Lagos Port Authority Berth Protection",
    sector: "offshore",
    location: "Lagos, Nigeria",
    slug: "lagos-port",
    description:
      "Anti-corrosion coating system for steel berth structures in saltwater environment.",
  },
  {
    title: "Eko Atlantic Tower Exterior",
    sector: "construction",
    location: "Lagos, Nigeria",
    slug: "eko-atlantic",
    description:
      "Architectural coating system for luxury high-rise exterior with weather-resistant topcoat.",
  },
  {
    title: "Fleet Refinish — Dangote Transport",
    sector: "automotive",
    location: "Lagos, Nigeria",
    slug: "dangote-fleet",
    description:
      "Full fleet refinish for logistics fleet with colour-matched corporate livery.",
  },
];

function sectorAccent(sectorRaw: string | null): { emoji: string; color: string; label: string } {
  const s = (sectorRaw ?? "").toLowerCase();
  if (s.includes("marine") || s.includes("offshore")) {
    return { emoji: "⚓", color: "#0F6E56", label: "Marine" };
  }
  if (s.includes("auto")) {
    return { emoji: "🚗", color: "#993C1D", label: "Automotive" };
  }
  if (s.includes("construct") || s.includes("arch")) {
    return { emoji: "🏗️", color: "#BA7517", label: "Construction" };
  }
  if (s.includes("infra")) {
    return { emoji: "🏛️", color: "#185FA5", label: "Infrastructure" };
  }
  return { emoji: "⚙️", color: "#185FA5", label: "Industrial" };
}

export function ProjectsSection({ content, projects }: ProjectsSectionProps) {
  const list: { title: string; sector: string | null; location: string | null; slug: string }[] =
    projects.length >= 3
      ? projects.slice(0, 3).map((p) => ({
          title: p.title,
          sector: p.sector,
          location: p.location,
          slug: p.slug,
        }))
      : PLACEHOLDER_PROJECTS.map((p) => ({
          title: p.title,
          sector: p.sector,
          location: p.location,
          slug: p.slug,
        }));

  return (
    <section className="bg-[#2D2D3E] py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-white/50">
              {content.projects_label}
            </p>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white md:text-4xl">
              {content.projects_heading}
            </h2>
          </div>
          <Link
            href="/projects"
            className="shrink-0 font-sans text-sm font-medium text-white/50 transition hover:text-white motion-reduce:transition-none"
          >
            View all projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {list.map((p) => {
            const acc = sectorAccent(p.sector);
            return (
              <article
                key={p.slug}
                className="group overflow-hidden rounded-xl transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
                style={
                  {
                    ["--glow" as string]: acc.color,
                  }
                }
              >
                <div
                  className="relative flex h-48 items-center justify-center bg-[#1a1a2e] transition duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 100%, ${acc.color}55 0%, transparent 55%)`,
                  }}
                >
                  <span className="text-5xl transition group-hover:scale-110 motion-reduce:transition-none" aria-hidden>
                    {acc.emoji}
                  </span>
                </div>
                <div className="bg-[#1a1a2e] p-5">
                  <span
                    className="inline-block rounded-full px-3 py-1 font-sans text-[11px] font-medium text-white"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.label}
                  </span>
                  <h3 className="mt-3 font-sans text-[15px] font-semibold text-white">{p.title}</h3>
                  {p.location ? (
                    <p className="mt-1 font-sans text-[12px] text-white/50">{p.location}</p>
                  ) : null}
                  <Link
                    href="/projects"
                    className="mt-4 inline-block font-sans text-sm font-medium transition hover:underline motion-reduce:transition-none"
                    style={{ color: acc.color }}
                  >
                    View case study →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
