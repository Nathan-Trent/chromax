"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface ProjectFiltersProps {
  /** Distinct sector values from live projects (non-empty). */
  sectors: string[];
}

function buildProjectsHref(searchParams: URLSearchParams, nextSector: string | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (nextSector === null) {
    params.delete("sector");
  } else {
    params.set("sector", nextSector);
  }
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#2D2D3E] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555555] transition-colors duration-150 hover:border-[#2D2D3E] motion-reduce:transition-none";
}

function formatSectorLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function ProjectFilters({ sectors }: ProjectFiltersProps) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("sector");
  const activeSector =
    raw && sectors.some((s) => s === raw) ? raw : null;

  return (
    <div className="sticky top-16 z-30 border-b border-[#E0DED4] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-2 overflow-x-auto pb-1">
          <Link
            href={buildProjectsHref(searchParams, null)}
            scroll={false}
            className={chipClass(activeSector === null)}
          >
            All
          </Link>
          {sectors.map((sec) => {
            const active = activeSector === sec;
            return (
              <Link
                key={sec}
                href={buildProjectsHref(searchParams, sec)}
                scroll={false}
                className={chipClass(active)}
              >
                {formatSectorLabel(sec)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
