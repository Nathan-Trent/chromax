"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import type { BlogPostRow, BlogPostStatus, BlogPostType } from "@/types/blog-post";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface BlogPostFormProps {
  post?: BlogPostRow | null;
  mode: "create" | "edit";
}

const TYPE_OPTS: { value: BlogPostType; label: string }[] = [
  { value: "blog", label: "Blog" },
  { value: "guide", label: "Guide" },
];

const STATUS_OPTS: { value: BlogPostStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
];

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocal(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export function BlogPostForm({ post, mode }: BlogPostFormProps) {
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

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [postType, setPostType] = useState<BlogPostType>(post?.post_type ?? "blog");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [bodyHtml, setBodyHtml] = useState(post?.body_html ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? "");
  const [status, setStatus] = useState<BlogPostStatus>(post?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocal(post?.published_at) || (mode === "create" ? toDatetimeLocal(new Date().toISOString()) : ""),
  );
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(post?.seo_description ?? "");

  useEffect(() => {
    if (mode !== "create" || slugTouched.current) return;
    setSlug(slugify(title));
  }, [title, mode]);

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
      post_type: postType,
      excerpt: excerpt.trim() || null,
      body_html: bodyHtml.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      status,
      published_at: fromDatetimeLocal(publishedAt),
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
    };

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { data?: { post?: BlogPostRow }; error?: string };
        if (!res.ok) {
          setErr(json.error ?? "Create failed");
          return;
        }
        if (json.data?.post?.id) {
          router.replace(`/admin/blog/${json.data.post.id}`);
          router.refresh();
        }
      } else if (post) {
        const res = await fetch(`/api/admin/blog/${post.id}`, {
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

  const area =
    "w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]";

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
            label="Post type"
            options={TYPE_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            value={postType}
            onChange={(e) => setPostType(e.target.value as BlogPostType)}
          />
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Excerpt <span className="font-normal text-[#888]">{excerpt.length}/200</span>
            </label>
            <textarea
              value={excerpt}
              maxLength={200}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className={area}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Body content (HTML for now)
            </label>
            <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={14} className={area} />
          </div>
          <Input
            label="Cover image URL"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
          <Select
            label="Status"
            options={STATUS_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
          />
          <Input
            label="Published at"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
          <Input label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">SEO description</label>
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={area} />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end border-t border-[#E8E8E4] bg-white p-4 lg:left-[240px]">
        <Button type="button" loading={loading} disabled={loading} onClick={() => void submit()}>
          {mode === "create" ? "Create post" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
