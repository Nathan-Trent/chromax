"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { useAlertDialog } from "@/components/ui/useAlertDialog";
import { mergeHomepageContent, type HomepageContent } from "@/lib/content/homepage";
import type { ContentPageStatus } from "@/types/content-page";
import { useRouter } from "next/navigation";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

export interface ContentEditorProps {
  pageKey: string;
  initialContent: Record<string, unknown>;
  initialStatus: ContentPageStatus;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
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
                      rows={f.key.includes("quote") || f.key.includes("body") ? 4 : 3}
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

  const [story1, setStory1] = useState(str(initialContent.story_p1));
  const [story2, setStory2] = useState(str(initialContent.story_p2));
  const [story3, setStory3] = useState(str(initialContent.story_p3));

  const [address, setAddress] = useState(str(initialContent.address));
  const [email, setEmail] = useState(str(initialContent.email));
  const [whatsapp, setWhatsapp] = useState(str(initialContent.whatsapp));

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
      return {
        ...initialContent,
        story_p1: story1.trim(),
        story_p2: story2.trim(),
        story_p3: story3.trim(),
      };
    }
    if (mode === "contact") {
      return {
        ...initialContent,
        address: address.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
      };
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
      return {
        ...initialContent,
        story_p1: str(initialContent.story_p1).trim(),
        story_p2: str(initialContent.story_p2).trim(),
        story_p3: str(initialContent.story_p3).trim(),
      };
    }
    if (pageKey === "contact") {
      return {
        ...initialContent,
        address: str(initialContent.address).trim(),
        email: str(initialContent.email).trim(),
        whatsapp: str(initialContent.whatsapp).trim(),
      };
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
    story1,
    story2,
    story3,
    address,
    email,
    whatsapp,
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
          <div className="space-y-4">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Company story
            </p>
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Paragraph 1</label>
              <textarea value={story1} onChange={(e) => setStory1(e.target.value)} rows={4} className={area} />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Paragraph 2</label>
              <textarea value={story2} onChange={(e) => setStory2(e.target.value)} rows={4} className={area} />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Paragraph 3</label>
              <textarea value={story3} onChange={(e) => setStory3(e.target.value)} rows={4} className={area} />
            </div>
          </div>
        ) : null}

        {mode === "contact" ? (
          <div className="space-y-4">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Contact details
            </p>
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
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
