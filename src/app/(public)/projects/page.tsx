import { PageHeader } from "@/components/public/PageHeader";
import { ProjectFilters } from "@/components/public/ProjectFilters";
import { ProjectsListingGrid } from "@/components/public/ProjectsListingGrid";
import { mergeProjectsPageContent } from "@/lib/content/projects-page";
import { getLiveContentPage } from "@/lib/supabase/queries/content-public";
import { getPublicProjects, getPublicProjectSectors } from "@/lib/supabase/queries/projects-public";
import { Suspense } from "react";

type SearchProps = {
  sector?: string;
};

async function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="bg-[#F5F0E8] py-20">
      <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
        <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#1a1a2e]">{title}</p>
        <p className="mx-auto mt-3 max-w-md font-sans text-[15px] text-[#666666]">{body}</p>
      </div>
    </section>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchProps>;
}) {
  const sp = await searchParams;
  const sectorFilter = sp.sector?.trim() || undefined;

  const [projects, sectors, cmsRow] = await Promise.all([
    getPublicProjects(sectorFilter),
    getPublicProjectSectors(),
    getLiveContentPage("projects"),
  ]);

  const cms = mergeProjectsPageContent(
    cmsRow?.content as Record<string, unknown> | undefined,
  );

  const showFilters = sectors.length > 0;
  const isEmpty = projects.length === 0;

  return (
    <>
      <PageHeader
        variant="charcoal"
        badge={cms.page_badge}
        heading={cms.page_heading}
        subtext={cms.page_subtext}
      />

      {showFilters ? (
        <Suspense
          fallback={<div className="sticky top-16 z-30 h-[52px] border-b border-[#E0DED4] bg-white" />}
        >
          <ProjectFilters sectors={sectors} />
        </Suspense>
      ) : null}

      {isEmpty ? (
        <EmptyState title={cms.empty_title} body={cms.empty_body} />
      ) : (
        <ProjectsListingGrid projects={projects} cardCtaLabel={cms.card_cta_label} />
      )}
    </>
  );
}
