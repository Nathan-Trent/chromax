"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import type { Product } from "@/lib/supabase/queries/products";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_OPTS = [
  { value: "industrial", label: "Industrial" },
  { value: "marine", label: "Marine" },
  { value: "automotive", label: "Automotive" },
  { value: "architectural", label: "Architectural" },
  { value: "custom", label: "Custom" },
];

const STATUS_OPTS = [
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
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none",
        on ? "bg-[#1a1a2e]" : "bg-[#E0DED4]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 left-1 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 motion-reduce:transition-none",
          on ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export interface ProductFormProps {
  product?: Product | null;
  mode: "create" | "edit";
}

type Category = Product["category"];
type Status = Product["status"];

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const slugTouched = useRef(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [category, setCategory] = useState<Category>(product?.category ?? "industrial");
  const [shortDesc, setShortDesc] = useState(product?.short_desc ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<Status>(product?.status ?? "draft");
  const [priceNgn, setPriceNgn] = useState(
    product?.price_ngn != null ? String(product.price_ngn) : "",
  );
  const [priceUsd, setPriceUsd] = useState(
    product?.price_usd != null ? String(product.price_usd) : "",
  );
  const [priceGbp, setPriceGbp] = useState(
    product?.price_gbp != null ? String(product.price_gbp) : "",
  );
  const [requiresColour, setRequiresColour] = useState(
    product?.requires_colour_selection ?? false,
  );
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [lowThreshold, setLowThreshold] = useState(String(product?.low_threshold ?? 20));
  const [tdsUrl, setTdsUrl] = useState(product?.tds_url ?? "");
  const [msdsUrl, setMsdsUrl] = useState(product?.msds_url ?? "");
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "");

  useEffect(() => {
    if (mode !== "create" || slugTouched.current) return;
    setSlug(slugify(name));
  }, [name, mode]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  function parseOptNumber(raw: string): number | null {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  function buildPayload(): Record<string, unknown> {
    return {
      name: name.trim(),
      slug: slug.trim(),
      category,
      short_desc: shortDesc.trim() || null,
      description: description.trim() || null,
      status,
      price_ngn: parseOptNumber(priceNgn),
      price_usd: parseOptNumber(priceUsd),
      price_gbp: parseOptNumber(priceGbp),
      requires_colour_selection: requiresColour,
      is_featured: isFeatured,
      stock: Number.parseInt(stock, 10) || 0,
      low_threshold: Number.parseInt(lowThreshold, 10) || 20,
      tds_url: tdsUrl.trim() || null,
      msds_url: msdsUrl.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };
  }

  async function submit(override?: { status?: Status }) {
    setError(null);
    setSuccess(null);
    const payload = buildPayload();
    if (override?.status) {
      payload.status = override.status;
    }

    if (!payload.name || !payload.slug) {
      setError("Name and slug are required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { data?: { product: Product }; error?: string };
        if (!res.ok) {
          setError(json.error ?? "Could not create product");
          return;
        }
        if (json.data?.product) {
          window.location.assign(`/admin/products/${json.data.product.id}`);
        }
      } else if (product) {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as {
          data?: { product?: Product; pending?: boolean; change_id?: string };
          error?: string;
        };
        if (!res.ok) {
          setError(json.error ?? "Could not save product");
          return;
        }
        if (json.data?.pending === true) {
          setInfo(
            "Price change submitted for Chief Accountant approval. Other changes have been saved.",
          );
          router.refresh();
          return;
        }
        setSuccess("Product saved successfully.");
        setInfo(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const areaBase =
    "w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333333] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]";

  return (
    <div className="pb-28">
      {error ? (
        <div className="mb-4">
          <Toast variant="error" message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}
      {info ? (
        <div className="mb-6">
          <Toast variant="info" message={info} onDismiss={() => setInfo(null)} />
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <Toast variant="success" message={success} onDismiss={() => setSuccess(null)} />
        </div>
      ) : null}

      <section className="mb-4 rounded-xl bg-white p-6">
        <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Basic information
        </p>
        <div className="space-y-4">
          <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => {
                slugTouched.current = true;
                setSlug(e.target.value);
              }}
              required
            />
            <p className="mt-1 font-sans text-xs text-[#888]">Preview: /products/{slug || "…"}</p>
          </div>
          <Select
            label="Category"
            options={CATEGORY_OPTS}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          />
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Short description
              <span className="ml-2 font-normal text-[#888]">{shortDesc.length}/150</span>
            </label>
            <textarea
              value={shortDesc}
              maxLength={150}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={3}
              className={areaBase}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
              Full description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={areaBase}
            />
          </div>
          <Select
            label="Status"
            options={STATUS_OPTS}
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          />
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-6">
        <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Pricing
        </p>
        <p className="mb-4 rounded p-2 font-sans text-xs text-[#BA7517] bg-[#FAEEDA]">
          Price changes require Chief Accountant approval before going live.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Price NGN (₦)"
            type="number"
            value={priceNgn}
            onChange={(e) => setPriceNgn(e.target.value)}
          />
          <Input
            label="Price USD ($)"
            type="number"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
          />
          <Input
            label="Price GBP (£)"
            type="number"
            value={priceGbp}
            onChange={(e) => setPriceGbp(e.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Toggle id="req-colour" on={requiresColour} onToggle={() => setRequiresColour(!requiresColour)} />
            <div>
              <label htmlFor="req-colour" className="font-sans text-[13px] font-medium text-[#333]">
                Requires colour selection
              </label>
              <p className="mt-0.5 font-sans text-xs text-[#888]">
                Customer must select a colour swatch before adding to cart
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Toggle id="featured" on={isFeatured} onToggle={() => setIsFeatured(!isFeatured)} />
            <div>
              <label htmlFor="featured" className="font-sans text-[13px] font-medium text-[#333]">
                Featured on homepage
              </label>
              <p className="mt-0.5 font-sans text-xs text-[#888]">
                Live products with this on appear in the homepage featured grid (up to four).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-6">
        <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Inventory
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Stock quantity"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            helper="Synced from ERP — update here will be overwritten on next ERP sync"
          />
          <Input
            label="Low stock threshold"
            type="number"
            value={lowThreshold}
            onChange={(e) => setLowThreshold(e.target.value)}
          />
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-6">
        <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Documentation
        </p>
        <div className="space-y-4">
          <Input
            label="TDS URL"
            value={tdsUrl}
            onChange={(e) => setTdsUrl(e.target.value)}
            placeholder="https://... or upload via Supabase storage"
            helper="Technical Data Sheet PDF link"
          />
          <Input
            label="MSDS URL"
            value={msdsUrl}
            onChange={(e) => setMsdsUrl(e.target.value)}
            placeholder="https://..."
            helper="Material Safety Data Sheet PDF link"
          />
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-6">
        <button
          type="button"
          onClick={() => setSeoOpen(!seoOpen)}
          className="mb-4 flex w-full items-center justify-between text-left font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]"
        >
          SEO
          <span aria-hidden>{seoOpen ? "−" : "+"}</span>
        </button>
        {seoOpen ? (
          <div className="space-y-4">
            <Input label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                SEO description
                <span className="ml-2 font-normal text-[#888]">{seoDescription.length}/160</span>
              </label>
              <textarea
                value={seoDescription}
                maxLength={160}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className={areaBase}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col gap-2 border-t border-[#E8E8E4] bg-white p-4 sm:flex-row sm:flex-wrap sm:justify-end lg:left-[240px]">
        <Button
          type="button"
          variant="outline"
          loading={loading}
          disabled={loading}
          className="min-h-11 w-full justify-center sm:w-auto"
          onClick={() => void submit({ status: "draft" })}
        >
          Save as draft
        </Button>
        {mode === "edit" ? (
          <Button
            type="button"
            loading={loading}
            disabled={loading}
            className="min-h-11 w-full justify-center sm:w-auto"
            onClick={() => void submit()}
          >
            Save changes
          </Button>
        ) : null}
        {mode === "create" && status !== "live" ? (
          <Button
            type="button"
            loading={loading}
            disabled={loading}
            className="min-h-11 w-full justify-center sm:w-auto"
            onClick={() => void submit()}
          >
            Create product
          </Button>
        ) : null}
        {status === "live" ? (
          <Button
            type="button"
            loading={loading}
            disabled={loading}
            className="min-h-11 w-full justify-center sm:w-auto"
            onClick={() => void submit({ status: "live" })}
          >
            {mode === "create" ? "Publish" : "Publish"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
