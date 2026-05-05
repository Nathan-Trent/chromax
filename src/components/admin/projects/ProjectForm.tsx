"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import type { ProjectRow, ProjectSector, ProjectStatus } from "@/types/project";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SECTOR_OPTS: { value: ProjectSector; label: string }[] = [
  { value: "offshore", label: "Offshore" },
  { value: "construction", label: "Construction" },
  { value: "automotive", label: "Automotive" },
  { value: "marine", label: "Marine" },
  { value: "infrastructure", label: "Infrastructure" },
];

const STATUS_OPTS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
];

function Toggle({ on, onToggle, id }: { on: boolean; onToggle: () => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={[
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-[#1a1a2e]" : "bg-[#E0DED4]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 left-1 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150",
          on ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export interface ProjectFormProps {
  project?: ProjectRow | null;
  mode: "create" | "edit";
}

export function ProjectForm({ project, mode }: ProjectFormProps) {
  const router = useRouter();
  const slugTouched = useRef(mode === "edit");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [sector, setSector] = useState<ProjectSector>(
    (project?.sector as ProjectSector) ?? "marine",
  );
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [location, setLocation] = useState(project?.location ?? "");
  const [shortDesc, setShortDesc] = useState(project?.description ?? "");
  const [body, setBody] = useState(project?.body_html ?? "");
  const [caseStudy, setCaseStudy] = useState(project?.is_case_study ?? false);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "draft");

  useEffect(() => {
    if (mode !== "create" || slugTouched.current) return;
    setSlug(slugify(title));
  }, [title, mode]);

  const area =
    "w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]";

  async function submit() {
    setErr(null);
    setSuccess(null);
    if (!title.trim() || !slug.trim()) {
      setErr("Title and slug are required.");
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      sector,
      client_name: clientName.trim() || null,
      location: location.trim() || null,
      description: shortDesc.trim() || null,
      body_html: body.trim() || null,
      is_case_study: caseStudy,
      status,
    };

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { data?: { project?: ProjectRow }; error?: string };
        if (!res.ok) {
          setErr(json.error ?? "Create failed");
          return;
        }
        if (json.data?.project?.id) {
          router.replace(`/admin/projects/${json.data.project.id}`);
          router.refresh();
        }
      } else if (project) {
        const res = await fetch(`/api/admin/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setErr(json.error ?? "Update failed");
          return;
        }
        setSuccess("Saved successfully.");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}
      {success ? (
        <Toast variant="success" message={success} onDismiss={() => setSuccess(null)} />
      ) : null}

      <section className="rounded-xl bg-white p-6">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => {
              slugTouched.current = true;
              setSlug(e.target.value);
            }}
            required
          />
          <Select
            label="Sector"
            options={SECTOR_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            value={sector}
            onChange={(e) => setSector(e.target.value as ProjectSector)}
          />
          <Input label="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Short description <span className="font-normal text-[#888]">{shortDesc.length}/200</span>
            </label>
            <textarea
              value={shortDesc}
              maxLength={200}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={3}
              className={area}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">Full body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={area} />
          </div>
          <div className="flex items-start gap-3">
            <Toggle id="case" on={caseStudy} onToggle={() => setCaseStudy(!caseStudy)} />
            <div>
              <label htmlFor="case" className="font-sans text-[13px] font-medium text-[#333]">
                Is case study
              </label>
            </div>
          </div>
          <Select
            label="Status"
            options={STATUS_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          />
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end border-t border-[#E8E8E4] bg-white p-4 lg:left-[240px]">
        <Button type="button" loading={loading} disabled={loading} onClick={() => void submit()}>
          {mode === "create" ? "Create project" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
