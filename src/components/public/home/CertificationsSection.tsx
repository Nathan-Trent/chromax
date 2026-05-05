import type { HomepageContent } from "@/lib/content/homepage";
import type { CertificationRow, CertificationType } from "@/types/certification";

export type CertificationsSectionProps = {
  content: Pick<HomepageContent, "certs_label" | "certs_heading">;
  certifications: CertificationRow[];
};

function iconForType(t: CertificationType): string {
  switch (t) {
    case "iso":
      return "🏆";
    case "export_licence":
      return "🌍";
    case "msds":
      return "🛡️";
    case "award":
      return "⭐";
    default:
      return "📋";
  }
}

const PLACEHOLDER_CERTS: CertificationRow[] = [
  {
    id: "ph-1",
    name: "ISO 9001:2015 Quality Management",
    cert_type: "iso",
    issuing_body: "Bureau Veritas",
    issue_date: null,
    expiry_date: null,
    document_url: null,
    product_id: null,
    display_order: 0,
    active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ph-2",
    name: "ISO 14001:2015 Environmental Management",
    cert_type: "iso",
    issuing_body: "Bureau Veritas",
    issue_date: null,
    expiry_date: null,
    document_url: null,
    product_id: null,
    display_order: 1,
    active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ph-3",
    name: "NEPC Export Licence",
    cert_type: "export_licence",
    issuing_body: "Nigerian Export Promotion Council",
    issue_date: null,
    expiry_date: null,
    document_url: null,
    product_id: null,
    display_order: 2,
    active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ph-4",
    name: "Product Safety Data Repository",
    cert_type: "msds",
    issuing_body: "Chromax-MCR Technical",
    issue_date: null,
    expiry_date: null,
    document_url: null,
    product_id: null,
    display_order: 3,
    active: true,
    created_at: "",
    updated_at: "",
  },
];

export function CertificationsSection({ content, certifications }: CertificationsSectionProps) {
  const list =
    certifications.length >= 4 ? certifications.slice(0, 4) : PLACEHOLDER_CERTS.slice(0, 4);

  return (
    <section className="bg-[#F5F0E8] py-16">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
            {content.certs_label}
          </p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
            {content.certs_heading}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {list.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-transparent bg-white p-6 text-center shadow-sm transition duration-200 hover:border-[#E8A020] hover:shadow-[0_8px_24px_rgba(232,160,32,0.15)] motion-reduce:transition-none"
            >
              <div className="mb-3 text-4xl" aria-hidden>
                {iconForType(c.cert_type)}
              </div>
              <h3 className="font-sans text-[13px] font-semibold text-[#1a1a2e]">{c.name}</h3>
              {c.issuing_body ? (
                <p className="mt-1 font-sans text-[12px] text-[#888888]">{c.issuing_body}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
