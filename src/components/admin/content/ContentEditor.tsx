"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { useAlertDialog } from "@/components/ui/useAlertDialog";
import { mergeAboutContent, type AboutContent } from "@/lib/content/about";
import { mergeCertificationsPageContent, type CertificationsPageContent } from "@/lib/content/certifications-page";
import { mergeContactPageContent, type ContactPageContent } from "@/lib/content/contact-page";
import { mergeFooterContent, type FooterContent } from "@/lib/content/footer";
import { mergeHomepageContent, type HomepageContent } from "@/lib/content/homepage";
import { mergeProjectsPageContent, type ProjectsPageContent } from "@/lib/content/projects-page";
import type { ContentPageStatus } from "@/types/content-page";
import { useRouter } from "next/navigation";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

export interface ContentEditorProps {
  pageKey: string;
  initialContent: Record<string, unknown>;
  initialStatus: ContentPageStatus;
}

const STATUS_OPTS: { value: ContentPageStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
];

type HpFieldDef = { key: keyof HomepageContent; label: string; multiline?: boolean };

type HpSectionDef = { id: string; title: string; defaultOpen?: boolean; fields: HpFieldDef[] };

const HP_SECTIONS: HpSectionDef[] = [
  {
    id: "hero",
    title: "Hero",
    defaultOpen: true,
    fields: [
      { key: "hero_heading", label: "Heading" },
      { key: "hero_subheading", label: "Subheading", multiline: true },
      { key: "hero_cta_primary", label: "CTA primary label" },
      { key: "hero_cta_secondary", label: "CTA secondary label" },
      { key: "hero_badge", label: "Badge" },
      { key: "hero_trust_1", label: "Hero trust signal 1" },
      { key: "hero_trust_2", label: "Hero trust signal 2" },
      { key: "hero_trust_3", label: "Hero trust signal 3" },
      { key: "hero_trust_4", label: "Hero trust signal 4" },
    ],
  },
  {
    id: "trust",
    title: "Trust bar",
    fields: [
      { key: "trust_stat_1_number", label: "Stat 1 number" },
      { key: "trust_stat_1_label", label: "Stat 1 label" },
      { key: "trust_stat_2_number", label: "Stat 2 number" },
      { key: "trust_stat_2_label", label: "Stat 2 label" },
      { key: "trust_stat_3_number", label: "Stat 3 number" },
      { key: "trust_stat_3_label", label: "Stat 3 label" },
      { key: "trust_stat_4_number", label: "Stat 4 number" },
      { key: "trust_stat_4_label", label: "Stat 4 label" },
    ],
  },
  {
    id: "categories",
    title: "Categories",
    fields: [
      { key: "categories_label", label: "Section label" },
      { key: "categories_heading", label: "Heading" },
      { key: "categories_subtext", label: "Subtext", multiline: true },
    ],
  },
  {
    id: "category_cards",
    title: "Category cards",
    fields: [
      { key: "cat_industrial_name", label: "Industrial — name" },
      { key: "cat_industrial_desc", label: "Industrial — description", multiline: true },
      { key: "cat_industrial_emoji", label: "Industrial — emoji" },
      { key: "cat_marine_name", label: "Marine — name" },
      { key: "cat_marine_desc", label: "Marine — description", multiline: true },
      { key: "cat_marine_emoji", label: "Marine — emoji" },
      { key: "cat_automotive_name", label: "Automotive — name" },
      { key: "cat_automotive_desc", label: "Automotive — description", multiline: true },
      { key: "cat_automotive_emoji", label: "Automotive — emoji" },
      { key: "cat_architectural_name", label: "Architectural — name" },
      { key: "cat_architectural_desc", label: "Architectural — description", multiline: true },
      { key: "cat_architectural_emoji", label: "Architectural — emoji" },
      { key: "cat_custom_name", label: "Custom — name" },
      { key: "cat_custom_desc", label: "Custom — description", multiline: true },
      { key: "cat_custom_emoji", label: "Custom — emoji" },
    ],
  },
  {
    id: "products",
    title: "Featured products (section)",
    fields: [
      { key: "products_label", label: "Section label" },
      { key: "products_heading", label: "Heading" },
      { key: "products_subtext", label: "Subtext", multiline: true },
    ],
  },
  {
    id: "about",
    title: "About",
    fields: [
      { key: "about_label", label: "Section label" },
      { key: "about_heading", label: "Heading", multiline: true },
      { key: "about_body_1", label: "Body paragraph 1", multiline: true },
      { key: "about_body_2", label: "Body paragraph 2", multiline: true },
      { key: "about_stat_1_number", label: "Stat 1 number" },
      { key: "about_stat_1_label", label: "Stat 1 label" },
      { key: "about_stat_2_number", label: "Stat 2 number" },
      { key: "about_stat_2_label", label: "Stat 2 label" },
      { key: "about_cta", label: "CTA label" },
      { key: "about_feature_1", label: "Feature 1", multiline: true },
      { key: "about_feature_2", label: "Feature 2", multiline: true },
      { key: "about_feature_3", label: "Feature 3", multiline: true },
      { key: "about_feature_4", label: "Feature 4", multiline: true },
    ],
  },
  {
    id: "colourlab",
    title: "Colour Lab",
    fields: [
      { key: "colourlab_label", label: "Section label" },
      { key: "colourlab_heading", label: "Heading", multiline: true },
      { key: "colourlab_body", label: "Body", multiline: true },
      { key: "colourlab_cta", label: "CTA label" },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    fields: [
      { key: "projects_label", label: "Section label" },
      { key: "projects_heading", label: "Heading", multiline: true },
    ],
  },
  {
    id: "certs",
    title: "Certifications",
    fields: [
      { key: "certs_label", label: "Section label" },
      { key: "certs_heading", label: "Heading", multiline: true },
    ],
  },
  {
    id: "testimonials",
    title: "Testimonials",
    fields: [
      { key: "testimonials_label", label: "Section label" },
      { key: "testimonials_heading", label: "Heading", multiline: true },
      { key: "testimonial_1_quote", label: "Testimonial 1 quote", multiline: true },
      { key: "testimonial_1_author", label: "Testimonial 1 author" },
      { key: "testimonial_1_company", label: "Testimonial 1 company" },
      { key: "testimonial_1_country", label: "Testimonial 1 country / flag" },
      { key: "testimonial_2_quote", label: "Testimonial 2 quote", multiline: true },
      { key: "testimonial_2_author", label: "Testimonial 2 author" },
      { key: "testimonial_2_company", label: "Testimonial 2 company" },
      { key: "testimonial_2_country", label: "Testimonial 2 country / flag" },
    ],
  },
  {
    id: "cta",
    title: "Final CTA",
    fields: [
      { key: "cta_heading", label: "Heading", multiline: true },
      { key: "cta_subtext", label: "Subtext", multiline: true },
      { key: "cta_primary", label: "Primary button" },
      { key: "cta_secondary", label: "Secondary button" },
    ],
  },
];

const area =
  "w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333] placeholder:text-[#999] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]";

type AboutFieldDef = { key: keyof AboutContent; label: string; multiline?: boolean };

type AboutSectionDef = { id: string; title: string; defaultOpen?: boolean; fields: AboutFieldDef[] };

const ABOUT_EDITOR_SECTIONS: AboutSectionDef[] = [
  {
    id: "ab_hero",
    title: "Hero",
    defaultOpen: true,
    fields: [
      { key: "about_hero_badge", label: "Badge" },
      { key: "about_hero_heading", label: "Heading" },
      { key: "about_hero_subtext", label: "Subtext", multiline: true },
    ],
  },
  {
    id: "ab_story",
    title: "Our story",
    fields: [
      { key: "story_p1", label: "Paragraph 1", multiline: true },
      { key: "story_p2", label: "Paragraph 2", multiline: true },
      { key: "story_p3", label: "Paragraph 3", multiline: true },
    ],
  },
  {
    id: "ab_stats",
    title: "Stats",
    fields: [
      { key: "about_stat_1_number", label: "Stat 1 number" },
      { key: "about_stat_1_label", label: "Stat 1 label" },
      { key: "about_stat_2_number", label: "Stat 2 number" },
      { key: "about_stat_2_label", label: "Stat 2 label" },
      { key: "about_stat_3_number", label: "Stat 3 number" },
      { key: "about_stat_3_label", label: "Stat 3 label" },
      { key: "about_stat_4_number", label: "Stat 4 number" },
      { key: "about_stat_4_label", label: "Stat 4 label" },
    ],
  },
  {
    id: "ab_features",
    title: "Features",
    fields: [
      { key: "about_feature_1", label: "Feature 1", multiline: true },
      { key: "about_feature_2", label: "Feature 2", multiline: true },
      { key: "about_feature_3", label: "Feature 3", multiline: true },
      { key: "about_feature_4", label: "Feature 4", multiline: true },
    ],
  },
  {
    id: "ab_process",
    title: "Manufacturing process",
    fields: [
      { key: "about_process_heading", label: "Section heading" },
      { key: "about_process_1_title", label: "Step 1 title" },
      { key: "about_process_1_desc", label: "Step 1 description", multiline: true },
      { key: "about_process_2_title", label: "Step 2 title" },
      { key: "about_process_2_desc", label: "Step 2 description", multiline: true },
      { key: "about_process_3_title", label: "Step 3 title" },
      { key: "about_process_3_desc", label: "Step 3 description", multiline: true },
      { key: "about_process_4_title", label: "Step 4 title" },
      { key: "about_process_4_desc", label: "Step 4 description", multiline: true },
    ],
  },
  {
    id: "ab_cta",
    title: "Closing CTA",
    fields: [
      { key: "about_cta_heading", label: "Heading" },
      { key: "about_cta_subtext", label: "Subtext", multiline: true },
      { key: "about_cta_primary", label: "Primary button" },
      { key: "about_cta_secondary", label: "Secondary button" },
    ],
  },
];

function AboutPageEditor({
  aboutPage,
  setAboutPage,
}: {
  aboutPage: AboutContent;
  setAboutPage: Dispatch<SetStateAction<AboutContent>>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ABOUT_EDITOR_SECTIONS.map((s) => [s.id, Boolean(s.defaultOpen)])),
  );

  return (
    <div className="space-y-2">
      {ABOUT_EDITOR_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-lg border border-[#E8E8E4]">
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]"
          >
            {section.title}
            <span aria-hidden>{open[section.id] ? "−" : "+"}</span>
          </button>
          {open[section.id] ? (
            <div className="space-y-4 border-t border-[#E8E8E4] px-4 py-4">
              {section.fields.map((f) =>
                f.multiline ? (
                  <div key={String(f.key)}>
                    <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                      {f.label}
                    </label>
                    <textarea
                      rows={f.key.includes("story") || f.key.includes("desc") ? 4 : 3}
                      className={area}
                      value={aboutPage[f.key]}
                      onChange={(e) =>
                        setAboutPage((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <Input
                    key={String(f.key)}
                    label={f.label}
                    value={aboutPage[f.key]}
                    onChange={(e) => setAboutPage((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type FooterFieldDef = { key: keyof FooterContent; label: string; multiline?: boolean };

type FooterSectionDef = { id: string; title: string; defaultOpen?: boolean; fields: FooterFieldDef[] };

const FOOTER_EDITOR_SECTIONS: FooterSectionDef[] = [
  {
    id: "ft_brand",
    title: "Brand",
    defaultOpen: true,
    fields: [
      { key: "tagline", label: "Tagline", multiline: true },
      { key: "address_line", label: "Address line" },
      { key: "bottom_tagline", label: "Bottom tagline" },
    ],
  },
  {
    id: "ft_regions",
    title: "Regions",
    fields: [{ key: "regions_line", label: "Regions line" }],
  },
  {
    id: "ft_columns",
    title: "Column headings",
    fields: [
      { key: "products_column_heading", label: "Products column" },
      { key: "company_column_heading", label: "Company column" },
    ],
  },
  {
    id: "ft_copyright",
    title: "Copyright",
    fields: [{ key: "copyright_suffix", label: "Copyright suffix" }],
  },
];

function FooterPageEditor({
  footerPage,
  setFooterPage,
}: {
  footerPage: FooterContent;
  setFooterPage: Dispatch<SetStateAction<FooterContent>>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FOOTER_EDITOR_SECTIONS.map((s) => [s.id, Boolean(s.defaultOpen)])),
  );

  return (
    <div className="space-y-2">
      {FOOTER_EDITOR_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-lg border border-[#E8E8E4]">
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]"
          >
            {section.title}
            <span aria-hidden>{open[section.id] ? "−" : "+"}</span>
          </button>
          {open[section.id] ? (
            <div className="space-y-4 border-t border-[#E8E8E4] px-4 py-4">
              {section.fields.map((f) =>
                f.multiline ? (
                  <div key={String(f.key)}>
                    <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                      {f.label}
                    </label>
                    <textarea
                      rows={3}
                      className={area}
                      value={footerPage[f.key]}
                      onChange={(e) =>
                        setFooterPage((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <Input
                    key={String(f.key)}
                    label={f.label}
                    value={footerPage[f.key]}
                    onChange={(e) =>
                      setFooterPage((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                  />
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type ContactFieldDef = { key: keyof ContactPageContent; label: string; multiline?: boolean; email?: boolean };

type ContactSectionDef = { id: string; title: string; defaultOpen?: boolean; fields: ContactFieldDef[] };

const CONTACT_EDITOR_SECTIONS: ContactSectionDef[] = [
  {
    id: "ct_header",
    title: "Page header",
    defaultOpen: true,
    fields: [
      { key: "contact_page_badge", label: "Badge" },
      { key: "contact_page_heading", label: "Heading" },
      { key: "contact_page_subtext", label: "Subtext", multiline: true },
    ],
  },
  {
    id: "ct_details",
    title: "Contact details",
    fields: [
      { key: "address", label: "Address" },
      { key: "email", label: "Email", email: true },
      { key: "whatsapp", label: "WhatsApp number" },
    ],
  },
  {
    id: "ct_serving",
    title: "Serving",
    fields: [
      { key: "contact_serving_heading", label: "Heading" },
      { key: "contact_regions", label: "Regions line", multiline: true },
    ],
  },
  {
    id: "ct_intl",
    title: "International enquiries",
    fields: [
      { key: "contact_intl_heading", label: "Heading" },
      { key: "contact_intl_body", label: "Body", multiline: true },
    ],
  },
];

function ContactPageEditor({
  contactPage,
  setContactPage,
}: {
  contactPage: ContactPageContent;
  setContactPage: Dispatch<SetStateAction<ContactPageContent>>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONTACT_EDITOR_SECTIONS.map((s) => [s.id, Boolean(s.defaultOpen)])),
  );

  return (
    <div className="space-y-2">
      {CONTACT_EDITOR_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-lg border border-[#E8E8E4]">
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]"
          >
            {section.title}
            <span aria-hidden>{open[section.id] ? "−" : "+"}</span>
          </button>
          {open[section.id] ? (
            <div className="space-y-4 border-t border-[#E8E8E4] px-4 py-4">
              {section.fields.map((f) =>
                f.multiline ? (
                  <div key={String(f.key)}>
                    <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                      {f.label}
                    </label>
                    <textarea
                      rows={f.key === "contact_page_subtext" || f.key === "contact_intl_body" ? 4 : 3}
                      className={area}
                      value={contactPage[f.key]}
                      onChange={(e) =>
                        setContactPage((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <Input
                    key={String(f.key)}
                    label={f.label}
                    type={f.email ? "email" : undefined}
                    value={contactPage[f.key]}
                    onChange={(e) =>
                      setContactPage((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                  />
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function HomepageEditor({
  hp,
  setHp,
}: {
  hp: HomepageContent;
  setHp: Dispatch<SetStateAction<HomepageContent>>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(HP_SECTIONS.map((s) => [s.id, Boolean(s.defaultOpen)])),
  );

  return (
    <div className="space-y-2">
      {HP_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-lg border border-[#E8E8E4]">
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]"
          >
            {section.title}
            <span aria-hidden>{open[section.id] ? "−" : "+"}</span>
          </button>
          {open[section.id] ? (
            <div className="space-y-4 border-t border-[#E8E8E4] px-4 py-4">
              {section.fields.map((f) =>
                f.multiline ? (
                  <div key={String(f.key)}>
                    <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                      {f.label}
                    </label>
                    <textarea
                      rows={
                        f.key.includes("quote") ||
                        f.key.includes("body") ||
                        String(f.key).includes("desc")
                          ? 4
                          : 3
                      }
                      className={area}
                      value={hp[f.key]}
                      onChange={(e) => setHp((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ) : (
                  <Input
                    key={String(f.key)}
                    label={f.label}
                    value={hp[f.key]}
                    onChange={(e) => setHp((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ContentEditor({ pageKey, initialContent, initialStatus }: ContentEditorProps) {
  const router = useRouter();
  const { confirm, DialogComponent } = useAlertDialog();
  const [status, setStatus] = useState<ContentPageStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [hp, setHp] = useState<HomepageContent>(() => mergeHomepageContent(initialContent));

  const [aboutPage, setAboutPage] = useState(() => mergeAboutContent(initialContent));

  const [footerPage, setFooterPage] = useState(() => mergeFooterContent(initialContent));

  const [contactPage, setContactPage] = useState(() => mergeContactPageContent(initialContent));

  const [projPage, setProjPage] = useState(() => mergeProjectsPageContent(initialContent));
  const [certPage, setCertPage] = useState(() => mergeCertificationsPageContent(initialContent));

  const [jsonRaw, setJsonRaw] = useState(() =>
    JSON.stringify(initialContent && Object.keys(initialContent).length ? initialContent : {}, null, 2),
  );

  const initialJsonRaw = useMemo(
    () =>
      JSON.stringify(initialContent && Object.keys(initialContent).length ? initialContent : {}, null, 2),
    [initialContent],
  );

  const mode = useMemo(() => {
    if (pageKey === "homepage") return "homepage" as const;
    if (pageKey === "about") return "about" as const;
    if (pageKey === "contact") return "contact" as const;
    if (pageKey === "footer") return "footer" as const;
    if (pageKey === "projects") return "projects" as const;
    if (pageKey === "certifications") return "certifications" as const;
    return "generic" as const;
  }, [pageKey]);

  function buildContent(): Record<string, unknown> {
    if (mode === "homepage") {
      const trimmed = { ...hp };
      for (const k of Object.keys(trimmed) as (keyof HomepageContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    if (mode === "about") {
      const trimmed = { ...aboutPage };
      for (const k of Object.keys(trimmed) as (keyof AboutContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    if (mode === "footer") {
      const trimmed = { ...footerPage };
      for (const k of Object.keys(trimmed) as (keyof FooterContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    if (mode === "contact") {
      const trimmed = { ...contactPage };
      for (const k of Object.keys(trimmed) as (keyof ContactPageContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    if (mode === "projects") {
      const trimmed = { ...projPage };
      for (const k of Object.keys(trimmed) as (keyof ProjectsPageContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    if (mode === "certifications") {
      const trimmed = { ...certPage };
      for (const k of Object.keys(trimmed) as (keyof CertificationsPageContent)[]) {
        trimmed[k] = trimmed[k].trim();
      }
      return { ...initialContent, ...trimmed };
    }
    try {
      const parsed = JSON.parse(jsonRaw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Content must be a JSON object.");
      }
      return parsed;
    } catch (e) {
      throw e instanceof Error ? e : new Error("Invalid JSON");
    }
  }

  const initialSnapshot = useMemo((): Record<string, unknown> => {
    if (pageKey === "homepage") {
      const m = mergeHomepageContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof HomepageContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    if (pageKey === "about") {
      const m = mergeAboutContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof AboutContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    if (pageKey === "footer") {
      const m = mergeFooterContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof FooterContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    if (pageKey === "contact") {
      const m = mergeContactPageContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof ContactPageContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    if (pageKey === "projects") {
      const m = mergeProjectsPageContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof ProjectsPageContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    if (pageKey === "certifications") {
      const m = mergeCertificationsPageContent(initialContent);
      const t = { ...m };
      for (const k of Object.keys(t) as (keyof CertificationsPageContent)[]) {
        t[k] = t[k].trim();
      }
      return { ...initialContent, ...t };
    }
    const raw = initialContent && Object.keys(initialContent).length ? initialContent : {};
    return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  }, [pageKey, initialContent]);

  const isDirty = useMemo(() => {
    if (status !== initialStatus) return true;
    if (mode === "generic") {
      return jsonRaw.trim() !== initialJsonRaw.trim();
    }
    try {
      return JSON.stringify(buildContent()) !== JSON.stringify(initialSnapshot);
    } catch {
      return true;
    }
  }, [
    status,
    initialStatus,
    mode,
    jsonRaw,
    initialJsonRaw,
    initialSnapshot,
    hp,
    aboutPage,
    footerPage,
    contactPage,
    projPage,
    certPage,
    initialContent,
  ]);

  async function save() {
    setErr(null);
    setInfo(null);
    setSuccess(null);
    let content: Record<string, unknown>;
    try {
      content = buildContent();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid content");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(pageKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status }),
      });
      const json = (await res.json()) as { data?: { pending?: boolean; page?: unknown }; error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Save failed");
        return;
      }
      if (json.data?.pending === true) {
        setInfo("Changes submitted for approval. They will go live once approved.");
        router.refresh();
        return;
      }
      setSuccess("Content saved successfully.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}
      {success ? (
        <Toast
          variant="success"
          message={success}
          duration={3000}
          onDismiss={() => setSuccess(null)}
        />
      ) : null}
      {info ? (
        <Toast variant="info" message={info} duration={4000} onDismiss={() => setInfo(null)} />
      ) : null}

      {isDirty ? (
        <div className="rounded-xl border border-[#BA7517]/40 bg-[#FAEEDA]/50 px-4 py-3 font-sans text-sm text-[#633806]">
          You have unsaved changes on this page. Save to avoid losing edits.
        </div>
      ) : null}

      <section className="rounded-xl bg-white p-6">
        <Select
          label="Status"
          options={STATUS_OPTS.map((o) => ({ value: o.value, label: o.label }))}
          value={status}
          onChange={(e) =>
            void (async () => {
              const next = e.target.value as ContentPageStatus;
              if (next === status) return;
              if (isDirty) {
                const proceed = await confirm({
                  title: "Unsaved changes",
                  message:
                    "You have unsaved edits. Change status anyway? Remember to click Save afterward.",
                  confirmLabel: "Change status",
                  cancelLabel: "Cancel",
                  confirmVariant: "navy",
                  icon: "warning",
                });
                if (!proceed) return;
              }
              setStatus(next);
            })()
          }
        />
      </section>

      <section className="rounded-xl bg-white p-6">
        {mode === "homepage" ? <HomepageEditor hp={hp} setHp={setHp} /> : null}

        {mode === "about" ? (
          <AboutPageEditor aboutPage={aboutPage} setAboutPage={setAboutPage} />
        ) : null}

        {mode === "footer" ? (
          <FooterPageEditor footerPage={footerPage} setFooterPage={setFooterPage} />
        ) : null}

        {mode === "contact" ? (
          <ContactPageEditor contactPage={contactPage} setContactPage={setContactPage} />
        ) : null}

        {mode === "projects" ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Page header
              </p>
              <Input
                label="Badge"
                value={projPage.page_badge}
                onChange={(e) => setProjPage((p) => ({ ...p, page_badge: e.target.value }))}
              />
              <Input
                label="Heading"
                value={projPage.page_heading}
                onChange={(e) => setProjPage((p) => ({ ...p, page_heading: e.target.value }))}
              />
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Subtext</label>
                <textarea
                  value={projPage.page_subtext}
                  onChange={(e) => setProjPage((p) => ({ ...p, page_subtext: e.target.value }))}
                  rows={3}
                  className={area}
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Project cards
              </p>
              <Input
                label="Card CTA label"
                value={projPage.card_cta_label}
                onChange={(e) => setProjPage((p) => ({ ...p, card_cta_label: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Empty state
              </p>
              <Input
                label="Title"
                value={projPage.empty_title}
                onChange={(e) => setProjPage((p) => ({ ...p, empty_title: e.target.value }))}
              />
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Body</label>
                <textarea
                  value={projPage.empty_body}
                  onChange={(e) => setProjPage((p) => ({ ...p, empty_body: e.target.value }))}
                  rows={3}
                  className={area}
                />
              </div>
            </div>
          </div>
        ) : null}

        {mode === "certifications" ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Page header
              </p>
              <Input
                label="Badge"
                value={certPage.page_badge}
                onChange={(e) => setCertPage((p) => ({ ...p, page_badge: e.target.value }))}
              />
              <Input
                label="Heading"
                value={certPage.page_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, page_heading: e.target.value }))}
              />
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Subtext</label>
                <textarea
                  value={certPage.page_subtext}
                  onChange={(e) => setCertPage((p) => ({ ...p, page_subtext: e.target.value }))}
                  rows={3}
                  className={area}
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Section headings
              </p>
              <Input
                label="ISO section"
                value={certPage.section_iso_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, section_iso_heading: e.target.value }))}
              />
              <Input
                label="Export licences section"
                value={certPage.section_licence_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, section_licence_heading: e.target.value }))}
              />
              <Input
                label="MSDS section"
                value={certPage.section_msds_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, section_msds_heading: e.target.value }))}
              />
              <Input
                label="Awards section"
                value={certPage.section_awards_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, section_awards_heading: e.target.value }))}
              />
              <Input
                label="Other section"
                value={certPage.section_other_heading}
                onChange={(e) => setCertPage((p) => ({ ...p, section_other_heading: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Labels
              </p>
              <Input
                label="Download link label"
                value={certPage.download_label}
                onChange={(e) => setCertPage((p) => ({ ...p, download_label: e.target.value }))}
              />
              <Input
                label="No document label"
                value={certPage.no_doc_label}
                onChange={(e) => setCertPage((p) => ({ ...p, no_doc_label: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Empty state
              </p>
              <Input
                label="Title"
                value={certPage.empty_title}
                onChange={(e) => setCertPage((p) => ({ ...p, empty_title: e.target.value }))}
              />
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Body</label>
                <textarea
                  value={certPage.empty_body}
                  onChange={(e) => setCertPage((p) => ({ ...p, empty_body: e.target.value }))}
                  rows={3}
                  className={area}
                />
              </div>
            </div>
          </div>
        ) : null}

        {mode === "generic" ? (
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Content (JSON object)
            </label>
            <textarea value={jsonRaw} onChange={(e) => setJsonRaw(e.target.value)} rows={18} className={area} />
          </div>
        ) : null}
      </section>

      <div className="flex justify-end">
        <Button type="button" loading={loading} disabled={loading} onClick={() => void save()}>
          Save
        </Button>
      </div>
    </div>
  );
}
