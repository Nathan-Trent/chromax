"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { showConfirm } from "@/components/ui/GlobalAlertDialog";
import type { Product } from "@/lib/supabase/queries/products";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Server-checked: ERP health returned OK within a short timeout. */
  erpConnected?: boolean;
  /** User has erp_sync.view */
  canErpView?: boolean;
}

type Category = Product["category"];
type Status = Product["status"];

type ErpSearchHit = {
  erp_id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  sell_price: number;
};

export function ProductForm({
  product,
  mode,
  erpConnected = false,
  canErpView = false,
}: ProductFormProps) {
  const router = useRouter();
  const slugTouched = useRef(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const [erpQuery, setErpQuery] = useState("");
  const [erpHits, setErpHits] = useState<ErpSearchHit[]>([]);
  const [erpSearchLoading, setErpSearchLoading] = useState(false);
  const [erpDropdownOpen, setErpDropdownOpen] = useState(false);
  const [erpLinkBusy, setErpLinkBusy] = useState(false);
  const erpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const runErpSearch = useCallback(async (term: string) => {
    if (!erpConnected || !canErpView || mode !== "edit" || !product?.id) return;
    setErpSearchLoading(true);
    try {
      const res = await fetch(
        `/api/admin/erp-sync/products/search?q=${encodeURIComponent(term)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as {
        data?: { products: ErpSearchHit[] };
        error?: string;
      };
      if (!res.ok) {
        setErpHits([]);
        return;
      }
      setErpHits(json.data?.products ?? []);
    } finally {
      setErpSearchLoading(false);
    }
  }, [canErpView, erpConnected, mode, product?.id]);

  useEffect(() => {
    if (!erpConnected || !canErpView || mode !== "edit" || !product?.id) return;
    const t = erpQuery.trim();
    if (erpDebounceRef.current) {
      clearTimeout(erpDebounceRef.current);
    }
    if (t.length < 2) {
      setErpHits([]);
      return;
    }
    erpDebounceRef.current = setTimeout(() => {
      void runErpSearch(t);
    }, 400);
    return () => {
      if (erpDebounceRef.current) {
        clearTimeout(erpDebounceRef.current);
      }
    };
  }, [erpQuery, erpConnected, canErpView, mode, product?.id, runErpSearch]);

  function fmtErpDate(isoT: string | null | undefined): string {
    if (!isoT) return "Never";
    try {
      return new Date(isoT).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoT;
    }
  }

  function fmtErpMoney(n: number): string {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return String(n);
    }
  }

  async function linkToErp(hit: ErpSearchHit) {
    if (!product?.id) return;
    const ok = await showConfirm({
      title: "Link product to ERP?",
      message: `Link “${product.name}” to “${hit.name}”?`,
      confirmLabel: "Link product",
      cancelLabel: "Cancel",
      confirmVariant: "teal",
      icon: "info",
    });
    if (!ok) return;
    setErpLinkBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/erp-sync/products/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard_product_id: product.id,
          erp_product_id: hit.erp_id,
          erp_product_name: hit.name,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not link product");
        return;
      }
      setSuccess("Product linked to ERP successfully");
      setErpDropdownOpen(false);
      setErpQuery("");
      setErpHits([]);
      router.refresh();
    } finally {
      setErpLinkBusy(false);
    }
  }

  async function unlinkErp() {
    if (!product?.id) return;
    const ok = await showConfirm({
      title: "Unlink from ERP?",
      message:
        "Unlink this product from the ERP? Stock sync will stop for this product.",
      confirmLabel: "Unlink",
      cancelLabel: "Cancel",
      confirmVariant: "danger",
      icon: "warning",
    });
    if (!ok) return;
    setErpLinkBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/erp-sync/products/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_product_id: product.id }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not unlink");
        return;
      }
      setSuccess("Product unlinked from ERP.");
      router.refresh();
    } finally {
      setErpLinkBusy(false);
    }
  }



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

  async function archiveProduct() {
    if (!product) return;
    const ok = await showConfirm({
      title: "Archive product",
      message: `Archive “${product.name}”? It will be removed from the storefront and marked as archived.`,
      confirmLabel: "Archive product",
      cancelLabel: "Keep live",
      confirmVariant: "danger",
      icon: "warning",
    });
    if (!ok) return;
    setError(null);
    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not archive product");
        return;
      }
      setSuccess("Product archived.");
      router.push("/admin/products");
      router.refresh();
    } finally {
      setArchiveLoading(false);
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
          <Toast
            variant="success"
            message={success}
            duration={3000}
            onDismiss={() => setSuccess(null)}
          />
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

      {erpConnected && canErpView ? (
        <section className="mb-4 rounded-xl bg-white p-6">
          <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#E8A020]">
            ERP Product Link
          </p>
          {mode === "create" || !product?.id ? (
            <p className="font-sans text-sm text-[#555555]">
              Save the product first (draft or publish) — then you can link it to an ERP catalogue item here.
            </p>
          ) : product.erp_product_id != null ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal">Linked</Badge>
              </div>
              <p className="font-sans text-sm text-[#555555]">
                Linked to:{" "}
                <span className="font-medium text-[#1a1a2e]">
                  {product.erp_product_name ?? "—"}
                </span>
              </p>
              <p className="font-mono text-xs text-[#888888]">
                ERP Product ID: {product.erp_product_id}
              </p>
              <p className="font-sans text-sm text-[#555555]">
                Last stock sync:{" "}
                <span className="text-[#1a1a2e]">
                  {fmtErpDate(product.erp_last_stock_sync ?? null)}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={erpLinkBusy}
                disabled={erpLinkBusy}
                className="border-[#993C1D] text-[#993C1D] hover:bg-[#993C1D]/10"
                onClick={() => void unlinkErp()}
              >
                Unlink
              </Button>
            </div>
          ) : (
            <div className="relative">
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                Search ERP products
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]"
                  aria-hidden
                />
                <input
                  type="search"
                  autoComplete="off"
                  placeholder="Type to search ERP products..."
                  value={erpQuery}
                  onChange={(e) => {
                    setErpQuery(e.target.value);
                    setErpDropdownOpen(true);
                  }}
                  onFocus={() => setErpDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setErpDropdownOpen(false), 150);
                  }}
                  className="w-full rounded-lg border border-[#D0D0CA] bg-white py-2.5 pl-10 pr-3 font-sans text-sm text-[#333333] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
                />
                {erpSearchLoading ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" color="navy" />
                  </span>
                ) : null}
              </div>
              {erpDropdownOpen && erpHits.length > 0 ? (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#E8E8E4] bg-white shadow-xl">
                  {erpHits.map((hit) => (
                    <button
                      key={hit.erp_id}
                      type="button"
                      className="w-full cursor-pointer border-b border-[#F0EDE6] p-3 text-left last:border-b-0 hover:bg-[#F5F0E8]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void linkToErp(hit)}
                    >
                      <p className="font-sans text-[14px] font-medium text-[#1a1a2e]">
                        {hit.name}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-3 font-sans text-xs text-[#888888]">
                        <span>SKU: {hit.sku || "—"}</span>
                        <span>
                          Stock: {hit.stock} {hit.unit}
                        </span>
                        <span>Price: {fmtErpMoney(hit.sell_price)}</span>
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {mode === "edit" && product && product.status !== "archived" ? (
        <section className="mb-28 rounded-xl border border-[#993C1D]/30 bg-white p-6">
          <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#993C1D]">
            Danger zone
          </p>
          <p className="mb-4 font-sans text-sm text-[#555]">
            Archive this product if it should no longer appear in the catalogue.
          </p>
          <Button
            type="button"
            variant="outline"
            loading={archiveLoading}
            disabled={archiveLoading || loading}
            className="border-[#993C1D] text-[#5C240F]"
            onClick={() => void archiveProduct()}
          >
            Archive product
          </Button>
        </section>
      ) : null}

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
