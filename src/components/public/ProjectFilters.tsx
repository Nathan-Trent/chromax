"use client";

import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import { SECTOR_HEX, type ProjectSector } from "@/lib/design/category-theme";
import { useMemo, useState } from "react";

export type { ProjectSector };

export interface ProjectListItem {
  id: string;
  title: string;
  sector: ProjectSector;
  location: string;
  description: string;
}

const FILTERS: { label: string; value: ProjectSector | null }[] = [
  { label: "All", value: null },
  { label: "Offshore", value: "offshore" },
  { label: "Construction", value: "construction" },
  { label: "Automotive", value: "automotive" },
  { label: "Marine", value: "marine" },
  { label: "Infrastructure", value: "infrastructure" },
];

const sectorEmoji: Record<ProjectSector, string> = {
  offshore: "🛢️",
  construction: "🏗️",
  automotive: "🚗",
  marine: "⚓",
  infrastructure: "🏛️",
};

const sectorLabel: Record<ProjectSector, string> = {
  offshore: "Offshore",
  construction: "Construction",
  automotive: "Automotive",
  marine: "Marine",
  infrastructure: "Infrastructure",
};

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#2D2D3E] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555555] transition-colors duration-150 hover:border-[#2D2D3E] motion-reduce:transition-none";
}

export interface ProjectFiltersProps {
  projects: ProjectListItem[];
}

export function ProjectFilters({ projects }: ProjectFiltersProps) {
  const [active, setActive] = useState<ProjectSector | null>(null);

  const filtered = useMemo(() => {
    if (active === null) return projects;
    return projects.filter((p) => p.sector === active);
  }, [projects, active]);

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-[#E0DED4] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-3">
          <div className="flex flex-row gap-2 overflow-x-auto pb-1">
            {FILTERS.map(({ label, value }) => {
              const isActive =
                value === null ? active === null : active === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActive(value)}
                  className={chipClass(isActive)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="bg-[#F5F0E8] py-16">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => {
              const col = SECTOR_HEX[p.sector];
              return (
                <ScrollReveal key={p.id} style={{ transitionDelay: `${(i % 6) * 75}ms` }}>
                  <article
                    className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-2 hover:shadow-2xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <div
                      className="relative aspect-[3/4] overflow-hidden"
                      style={{
                        backgroundColor: col,
                        boxShadow: `inset 0 0 80px ${col}cc`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-50"
                        style={{
                          background: `radial-gradient(circle at 50% 40%, #ffffff55 0%, transparent 55%)`,
                        }}
                        aria-hidden
                      />
                      <div className="relative flex h-full items-center justify-center text-7xl transition duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                        <span aria-hidden>{sectorEmoji[p.sector]}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <span
                        className="mb-3 w-fit rounded-md px-2 py-1 font-sans text-[10px] font-medium uppercase tracking-wide text-white"
                        style={{ backgroundColor: col }}
                      >
                        {sectorLabel[p.sector]}
                      </span>
                      <h2 className="font-[family-name:var(--font-fraunces)] mb-1 text-lg font-semibold text-[#1a1a2e]">
                        {p.title}
                      </h2>
                      <p className="mb-3 font-sans text-xs text-[#888888]">{p.location}</p>
                      <p className="mb-4 line-clamp-3 flex-1 font-sans text-[13px] leading-relaxed text-[#555555]">
                        {p.description}
                      </p>
                      <span
                        className="font-sans text-sm font-medium transition duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: col }}
                      >
                        View case study →
                      </span>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
