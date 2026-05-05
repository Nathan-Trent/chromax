"use client";

import { Badge } from "@/components/ui/Badge";
import { hasPermission } from "@/lib/auth/permissions";
import type { Role } from "@/types/role";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HELP_SECTIONS,
  type HelpSectionDefinition,
  sectionSearchBlob,
} from "./help-sections";

export interface HelpClientProps {
  roles: Role[];
  isSuperAdmin: boolean;
  permissions: Record<string, string[]>;
}

function isSectionVisible(
  s: HelpSectionDefinition,
  roles: Role[],
  superUser: boolean,
): boolean {
  if (s.access.kind === "always") return true;
  if (s.access.kind === "super_admin") return superUser;
  return hasPermission(roles, s.access.section, s.access.action);
}

function SectionCard({ section }: { section: HelpSectionDefinition }) {
  return (
    <article
      id={section.id}
      className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#E8E8E4]/80 scroll-mt-24"
    >
      <header className="border-b border-[#E8E8E4] pb-3">
        <h2 className="font-sans text-lg font-semibold text-[#1a1a2e]">
          <span className="mr-2" aria-hidden>
            {section.icon}
          </span>
          {section.title}
        </h2>
      </header>

      <div className="mt-4 space-y-5 font-sans text-sm leading-relaxed text-[#555555]">
        {section.intro ? <p>{section.intro}</p> : null}

        {section.whatYouCanDo && section.whatYouCanDo.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              What you can do
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {section.whatYouCanDo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.orderStatuses && section.orderStatuses.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              Order statuses explained
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {section.orderStatuses.map((row) => (
                <li key={row.term}>
                  <span className="font-medium text-[#1a1a2e]">{row.term}</span>
                  <span> → {row.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.offerStatuses && section.offerStatuses.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              Offer statuses explained
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {section.offerStatuses.map((row) => (
                <li key={row.term}>
                  <span className="font-medium text-[#1a1a2e]">{row.term}</span>
                  <span> → {row.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.leadStatuses && section.leadStatuses.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              Lead statuses
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {section.leadStatuses.map((row) => (
                <li key={row.term}>
                  <span className="font-medium text-[#1a1a2e]">{row.term}</span>
                  <span> → {row.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.syncStatuses && section.syncStatuses.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              Sync event statuses
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {section.syncStatuses.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.keyTasks.length > 0 ? (
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/70">
              How to do key tasks
            </h3>
            <div className="space-y-4">
              {section.keyTasks.map((group, gi) => (
                <div key={gi}>
                  {group.title ? (
                    <p className="mb-2 font-medium text-[#1a1a2e]">{group.title}</p>
                  ) : null}
                  <ol className="list-decimal space-y-1.5 pl-5">
                    {group.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {section.tips.map((tip) => (
          <aside
            key={tip}
            className="border-l-4 border-[#E8A020] py-1 pl-4 text-sm italic text-[#555555]"
          >
            <span className="font-medium not-italic text-[#633806]">Tip: </span>
            {tip}
          </aside>
        ))}

        <p className="text-sm text-[#888888]">
          <span className="font-medium text-[#1a1a2e]/80">Permissions: </span>
          {section.permissionsNote}
        </p>
      </div>
    </article>
  );
}

export function HelpClient({ roles, isSuperAdmin: superUser, permissions }: HelpClientProps) {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string>(HELP_SECTIONS[0]?.id ?? "help-dashboard");

  const standardSections = useMemo(
    () => HELP_SECTIONS.filter((s) => s.access.kind !== "super_admin"),
    [],
  );
  const superSections = useMemo(
    () => HELP_SECTIONS.filter((s) => s.access.kind === "super_admin"),
    [],
  );

  const visibleStandard = useMemo(
    () => standardSections.filter((s) => isSectionVisible(s, roles, superUser)),
    [standardSections, roles, superUser],
  );
  const visibleSuper = useMemo(
    () => (superUser ? superSections : []),
    [superSections, superUser],
  );

  const allVisible = useMemo(() => [...visibleStandard, ...visibleSuper], [visibleStandard, visibleSuper]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return allVisible;
    return allVisible.filter((s) => sectionSearchBlob(s).includes(query));
  }, [allVisible, query]);

  const sectionCount = allVisible.length;

  const navStandardItems = useMemo(
    () =>
      query
        ? filtered.filter((s) => s.access.kind !== "super_admin")
        : visibleStandard,
    [query, filtered, visibleStandard],
  );
  const navSuperItems = useMemo(
    () => (query ? filtered.filter((s) => s.access.kind === "super_admin") : visibleSuper),
    [query, filtered, visibleSuper],
  );

  const modulesWithGrants = useMemo(
    () => Object.keys(permissions).filter((k) => (permissions[k]?.length ?? 0) > 0).length,
    [permissions],
  );

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }, []);

  const observeIdsKey = filtered.map((s) => s.id).join(",");

  useEffect(() => {
    if (!filtered.length) return;
    setActiveId((prev) => (filtered.some((s) => s.id === prev) ? prev : filtered[0]!.id));
  }, [observeIdsKey, filtered]);

  useEffect(() => {
    const nodes = filtered
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    let frame = 0;
    const update = () => {
      let best: { id: string; ratio: number } | null = null;
      for (const el of nodes) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        const ratio = r.height > 0 ? vis / r.height : 0;
        if (ratio >= 0.5 && (!best || ratio > best.ratio)) {
          best = { id: el.id, ratio };
        }
      }
      if (best) setActiveId((prev) => (prev === best!.id ? prev : best!.id));
    };

    const obs = new IntersectionObserver(
      () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      },
      { threshold: [0, 0.1, 0.25, 0.35, 0.5, 0.65, 0.8, 1], root: null, rootMargin: "0px" },
    );

    nodes.forEach((el) => obs.observe(el));
    update();

    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, [observeIdsKey, filtered]);

  function navItemClass(id: string) {
    const active = activeId === id;
    return [
      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#555555] transition-colors duration-150 ease-in-out motion-reduce:transition-none",
      active ? "bg-[#1a1a2e] text-white" : "hover:bg-[#F5F0E8] hover:text-[#1a1a2e]",
    ].join(" ");
  }

  const mainStandardSections = filtered.filter((s) => s.access.kind !== "super_admin");
  const mainSuperSections = filtered.filter((s) => s.access.kind === "super_admin");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Help &amp; User Manual</h1>
        <p className="mt-1 text-sm text-[#888888]">
          A guide to using the Chromax-MCR admin dashboard. You only see sections relevant to your role.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4 rounded-xl bg-[#F5F0E8] p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {roles.map((r) => (
            <Badge key={r.id} variant="amber" size="md" className="border border-[#E8A020]/40">
              {r.name}
            </Badge>
          ))}
          {roles.length === 0 ? <span className="text-sm text-[#888888]">No roles assigned</span> : null}
        </div>
        <div className="text-sm text-[#555555] sm:text-right">
          {superUser ? (
            <p className="mb-1 font-medium text-[#633806]">
              <span aria-hidden>⭐ </span>Super Admin — full access
            </p>
          ) : null}
          <p>
            You have access to {sectionCount} section{sectionCount === 1 ? "" : "s"} of the dashboard.
          </p>
          {modulesWithGrants > 0 ? (
            <p className="mt-1 text-xs text-[#888888]">
              Your roles include explicit actions in {modulesWithGrants} permission module
              {modulesWithGrants === 1 ? "" : "s"}.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-64 lg:self-start">
          <nav aria-label="Help sections" className="space-y-4">
            <div>
              <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-widest text-[#888888]">
                Sections
              </p>
              <ul className="space-y-0.5">
                {navStandardItems.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={navItemClass(s.id)} onClick={() => scrollToId(s.id)}>
                      <span aria-hidden>{s.icon}</span>
                      {s.navLabel}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {navSuperItems.length > 0 ? (
              <div>
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-widest text-[#E8A020]">
                  Super Admin functions
                </p>
                <ul className="space-y-0.5 border-t border-[#E8E8E4] pt-3">
                  {navSuperItems.map((s) => (
                    <li key={s.id}>
                      <button type="button" className={navItemClass(s.id)} onClick={() => scrollToId(s.id)}>
                        <span aria-hidden>{s.icon}</span>
                        {s.navLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the manual..."
                className="w-full rounded-lg border border-transparent bg-[#F5F0E8] px-4 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#888888] focus:border-[#E8A020] focus:outline-none"
                aria-label="Search help sections"
              />
              {search ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#888888] hover:bg-black/5 hover:text-[#1a1a2e]"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 text-sm text-[#888888]">
              No results for &apos;{search.trim()}&apos;
            </p>
          ) : (
            <>
              {mainStandardSections.map((s) => (
                <SectionCard key={s.id} section={s} />
              ))}
              {mainSuperSections.length > 0 && mainStandardSections.length > 0 ? (
                <div className="my-8 border-t border-[#E8A020]/50 pt-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#E8A020]">
                    Super Admin functions
                  </p>
                </div>
              ) : null}
              {mainSuperSections.map((s) => (
                <SectionCard key={s.id} section={s} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
