import { PageHeader } from "@/components/public/PageHeader";
import { projectSectorHex, projectSectorLabel } from "@/lib/public/project-sector-display";
import { getPublicProjectBySlug } from "@/lib/supabase/queries/projects-public";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function ProjectBody({ body }: { body: string | null }) {
  if (!body?.trim()) return null;
  const t = body.trim();
  if (/<[a-z][\s\S]*>/i.test(t)) {
    return (
      <div
        className="project-body-html max-w-none font-sans text-[15px] leading-relaxed text-[#555555] [&_a]:text-[#185FA5] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-[#1a1a2e]"
        dangerouslySetInnerHTML={{ __html: t }}
      />
    );
  }
  return (
    <div className="space-y-4 font-sans text-[15px] leading-relaxed text-[#555555]">
      {t.split(/\n\s*\n+/).map((para, i) => (
        <p key={i}>{para.trim()}</p>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  if (!project) {
    return { title: "Project | Chromax-MCR" };
  }
  return {
    title: `${project.title} | Chromax-MCR`,
    description: project.short_description ?? undefined,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  if (!project) {
    notFound();
  }
  if (!project.is_case_study) {
    redirect("/projects");
  }

  const accent = projectSectorHex(project.sector);
  const sectorLbl = projectSectorLabel(project.sector);

  return (
    <>
      <PageHeader
        variant="charcoal"
        badge={sectorLbl}
        heading={project.title}
      />

      <div className="bg-[#F5F0E8] py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              {project.short_description?.trim() ? (
                <p className="mb-8 border-l-4 border-[#E8A020] pl-4 font-sans text-[15px] leading-relaxed text-[#555555]">
                  {project.short_description.trim()}
                </p>
              ) : null}

              <div className="mb-10">
                <h2 className="font-[family-name:var(--font-fraunces)] mb-4 text-xl font-semibold text-[#1a1a2e]">
                  Overview
                </h2>
                {project.body?.trim() ? (
                  <ProjectBody body={project.body} />
                ) : (
                  <p className="font-sans text-[15px] text-[#888888]">More detail coming soon.</p>
                )}
              </div>

              <div className="rounded-xl border border-[#E8E8E4] bg-white p-6 shadow-sm">
                <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
                  Project details
                </p>
                <dl className="mt-4 space-y-3 font-sans text-[14px] text-[#555555]">
                  {project.client_name ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-[#AAAAAA]">
                        Client
                      </dt>
                      <dd className="mt-1 font-medium text-[#1a1a2e]">{project.client_name}</dd>
                    </div>
                  ) : null}
                  {project.location ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-[#AAAAAA]">
                        Location
                      </dt>
                      <dd className="mt-1 font-medium text-[#1a1a2e]">{project.location}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div
                className="rounded-xl border border-[#E8E8E4] bg-white p-6 shadow-sm transition duration-200 hover:border-[#E8A020] motion-reduce:transition-none"
              >
                <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
                  Sector
                </p>
                <span
                  className="mt-3 inline-block rounded-md px-3 py-1.5 font-sans text-[12px] font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  {sectorLbl}
                </span>
              </div>

              <Link
                href="/projects"
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#E0DED4] bg-white px-5 py-2.5 font-sans text-[13px] font-medium text-[#1a1a2e] transition duration-150 hover:border-[#1a1a2e] motion-reduce:transition-none"
              >
                ← Back to projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
