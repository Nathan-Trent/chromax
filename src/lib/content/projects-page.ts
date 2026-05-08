/** Public /projects listing CMS shape — safe defaults when content_pages row missing or draft. */

export interface ProjectsPageContent {
  page_badge: string;
  page_heading: string;
  page_subtext: string;
  card_cta_label: string;
  empty_title: string;
  empty_body: string;
}

export const PROJECTS_PAGE_DEFAULTS: ProjectsPageContent = {
  page_badge: "Projects",
  page_heading: "Protecting structures across Nigeria",
  page_subtext:
    "Real projects. Real performance. Browse our completed case studies and installations.",
  card_cta_label: "View case study",
  empty_title: "No projects yet",
  empty_body: "Check back soon for our latest case studies.",
};

export function mergeProjectsPageContent(
  raw: Record<string, unknown> | null | undefined,
): ProjectsPageContent {
  const out = { ...PROJECTS_PAGE_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(PROJECTS_PAGE_DEFAULTS) as (keyof ProjectsPageContent)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v;
    }
  }
  return out;
}
