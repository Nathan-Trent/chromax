import { PageHeader } from "@/components/public/PageHeader";
import { mergeCertificationsPageContent } from "@/lib/content/certifications-page";
import { getLiveContentPage } from "@/lib/supabase/queries/content-public";
import {
  CERTIFICATION_DISPLAY_GROUPS,
  getCertificationsByType,
  type CertificationDisplayGroup,
  type PublicCertification,
} from "@/lib/supabase/queries/certifications-public";

function utcToday(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function parseDateOnlyUtc(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

function formatLongDateUtc(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function validityBadge(expiryDate: string | null): { text: string; className: string } {
  if (!expiryDate?.trim()) {
    return {
      text: "Valid",
      className: "bg-[#1D9E75]/15 text-[#1D9E75]",
    };
  }

  const exp = parseDateOnlyUtc(expiryDate);
  if (!exp) {
    return {
      text: "Valid",
      className: "bg-[#1D9E75]/15 text-[#1D9E75]",
    };
  }

  const today = utcToday();
  const msPerDay = 86400000;
  const daysLeft = Math.floor((exp.getTime() - today.getTime()) / msPerDay);
  const formatted = formatLongDateUtc(exp);

  if (daysLeft < 0) {
    return {
      text: `Expired ${formatted}`,
      className: "bg-[#A32D2D]/15 text-[#A32D2D]",
    };
  }
  if (daysLeft <= 90) {
    return {
      text: `Expires ${formatted}`,
      className: "bg-[#BA7517]/15 text-[#BA7517]",
    };
  }
  return {
    text: `Valid until ${formatted}`,
    className: "bg-[#1D9E75]/15 text-[#1D9E75]",
  };
}

function stripColour(group: CertificationDisplayGroup): string {
  switch (group) {
    case "ISO":
      return "#E8A020";
    case "Export Licence":
      return "#185FA5";
    case "MSDS":
      return "#0F6E56";
    case "Award":
      return "#534AB7";
    default:
      return "#888888";
  }
}

function typeIcon(group: CertificationDisplayGroup): string {
  switch (group) {
    case "ISO":
      return "🏆";
    case "Export Licence":
      return "🌍";
    case "MSDS":
      return "🛡️";
    case "Award":
      return "⭐";
    default:
      return "📋";
  }
}

function sectionHeading(group: CertificationDisplayGroup, cms: ReturnType<typeof mergeCertificationsPageContent>): string {
  switch (group) {
    case "ISO":
      return cms.section_iso_heading;
    case "Export Licence":
      return cms.section_licence_heading;
    case "MSDS":
      return cms.section_msds_heading;
    case "Award":
      return cms.section_awards_heading;
    default:
      return cms.section_other_heading;
  }
}

function CertificationCard({
  cert,
  group,
  downloadLabel,
  noDocLabel,
}: {
  cert: PublicCertification;
  group: CertificationDisplayGroup;
  downloadLabel: string;
  noDocLabel: string;
}) {
  const strip = stripColour(group);
  const badge = validityBadge(cert.expiry_date);
  const icon = typeIcon(group);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-[#E8A020] hover:shadow-[0_12px_28px_rgba(232,160,32,0.18)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: strip }} aria-hidden />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 text-4xl" aria-hidden>
          {icon}
        </div>
        <h3 className="font-[family-name:var(--font-fraunces)] text-base font-semibold text-[#1a1a2e]">{cert.name}</h3>
        {cert.issuing_body ? (
          <p className="mt-1 font-sans text-[13px] text-[#666666]">{cert.issuing_body}</p>
        ) : null}
        <div className="mt-4">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 font-sans text-[11px] font-medium ${badge.className}`}
          >
            {badge.text}
          </span>
        </div>
        <div className="mt-auto pt-6">
          {cert.document_url?.trim() ? (
            <a
              href={cert.document_url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-sans text-sm font-medium text-[#E8A020] transition duration-150 hover:underline motion-reduce:transition-none"
            >
              {downloadLabel}
            </a>
          ) : (
            <p className="font-sans text-sm text-[#888888]">{noDocLabel}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function CertificationsPage() {
  const [certsByType, cmsRow] = await Promise.all([
    getCertificationsByType(),
    getLiveContentPage("certifications"),
  ]);

  const cms = mergeCertificationsPageContent(
    cmsRow?.content as Record<string, unknown> | undefined,
  );

  const hasAny = Object.keys(certsByType).length > 0;

  return (
    <>
      <PageHeader badge={cms.page_badge} heading={cms.page_heading} subtext={cms.page_subtext} />

      <div className="bg-[#F5F0E8] py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {!hasAny ? (
            <div className="mx-auto max-w-lg rounded-xl border border-[#E8E8E4] bg-white px-6 py-14 text-center shadow-sm">
              <div className="text-5xl" aria-hidden>
                🏆
              </div>
              <p className="mt-6 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#1a1a2e]">
                {cms.empty_title}
              </p>
              <p className="mt-3 font-sans text-[15px] leading-relaxed text-[#666666]">{cms.empty_body}</p>
            </div>
          ) : (
            <div className="space-y-16">
              {CERTIFICATION_DISPLAY_GROUPS.map((group) => {
                const list = certsByType[group];
                if (!list?.length) return null;
                return (
                  <section key={group}>
                    <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-2xl font-semibold text-[#1a1a2e]">
                      {sectionHeading(group, cms)}
                    </h2>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                      {list.map((cert) => (
                        <CertificationCard
                          key={cert.id}
                          cert={cert}
                          group={group}
                          downloadLabel={cms.download_label}
                          noDocLabel={cms.no_doc_label}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
