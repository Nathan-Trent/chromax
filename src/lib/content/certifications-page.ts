/** Public /certifications CMS shape — safe defaults when content_pages row missing or draft. */

export interface CertificationsPageContent {
  page_badge: string;
  page_heading: string;
  page_subtext: string;
  section_iso_heading: string;
  section_licence_heading: string;
  section_msds_heading: string;
  section_awards_heading: string;
  section_other_heading: string;
  download_label: string;
  no_doc_label: string;
  empty_title: string;
  empty_body: string;
}

export const CERTIFICATIONS_PAGE_DEFAULTS: CertificationsPageContent = {
  page_badge: "Certifications",
  page_heading: "Quality you can verify",
  page_subtext: "Every product we manufacture meets international quality and safety standards.",
  section_iso_heading: "ISO Certifications",
  section_licence_heading: "Export Licences",
  section_msds_heading: "Safety Data Sheets",
  section_awards_heading: "Awards & Recognition",
  section_other_heading: "Other Certifications",
  download_label: "Download PDF",
  no_doc_label: "Document coming soon",
  empty_title: "Certifications coming soon",
  empty_body: "Our certification documents are being uploaded. Check back soon.",
};

export function mergeCertificationsPageContent(
  raw: Record<string, unknown> | null | undefined,
): CertificationsPageContent {
  const out = { ...CERTIFICATIONS_PAGE_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(CERTIFICATIONS_PAGE_DEFAULTS) as (keyof CertificationsPageContent)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v;
    }
  }
  return out;
}
