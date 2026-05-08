"use client";

import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import { projectSectorEmoji, projectSectorHex, projectSectorLabel } from "@/lib/public/project-sector-display";
import type { PublicProject } from "@/lib/supabase/queries/projects-public";
import Link from "next/link";

function ProjectCard({
  project,
  cardCtaLabel,
}: {
  project: PublicProject;
  cardCtaLabel: string;
}) {
  const col = projectSectorHex(project.sector);
  const emoji = projectSectorEmoji(project.sector);
  const sectorLbl = projectSectorLabel(project.sector);

  const inner = (
    <>
      <div
        className="relative aspect-[3/4] overflow-hidden transition duration-200 ease-out group-hover:shadow-[inset_0_0_60px_rgba(255,255,255,0.12)] motion-reduce:transition-none"
        style={{
          backgroundColor: col,
          boxShadow: `inset 0 0 80px ${col}cc`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(circle at 50% 40%, #ffffff55 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full items-center justify-center text-7xl transition duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <span aria-hidden>{emoji}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span
          className="mb-3 w-fit rounded-md px-2 py-1 font-sans text-[10px] font-medium uppercase tracking-wide text-white"
          style={{ backgroundColor: col }}
        >
          {sectorLbl}
        </span>
        <h2 className="font-[family-name:var(--font-fraunces)] mb-1 text-lg font-semibold text-[#1a1a2e]">
          {project.title}
        </h2>
        {project.location ? (
          <p className="mb-1 font-sans text-xs text-[#888888]">{project.location}</p>
        ) : null}
        {project.client_name ? (
          <p className="mb-4 flex-1 font-sans text-[13px] text-[#555555]">Client: {project.client_name}</p>
        ) : (
          <div className="mb-4 flex-1" />
        )}
        {project.is_case_study ? (
          <span
            className="font-sans text-sm font-medium transition duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            style={{ color: col }}
          >
            {cardCtaLabel}
          </span>
        ) : (
          <span className="font-sans text-sm font-medium text-[#AAAAAA]">{cardCtaLabel}</span>
        )}
      </div>
    </>
  );

  const cardClass =
    "group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-2 hover:border hover:border-[#E8A020] hover:shadow-[0_12px_40px_rgba(232,160,32,0.2)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm";

  if (project.is_case_study) {
    return (
      <Link href={`/projects/${project.slug}`} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <article className={cardClass}>{inner}</article>;
}

export interface ProjectsListingGridProps {
  projects: PublicProject[];
  cardCtaLabel: string;
}

export function ProjectsListingGrid({ projects, cardCtaLabel }: ProjectsListingGridProps) {
  return (
    <section className="bg-[#F5F0E8] py-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ScrollReveal key={p.id} style={{ transitionDelay: `${(i % 6) * 75}ms` }}>
              <ProjectCard project={p} cardCtaLabel={cardCtaLabel} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
