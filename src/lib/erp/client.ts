import type { SupabaseClient } from "@supabase/supabase-js";

export interface ERPOrder {
  id: string;
  chromax_order_id: string | null;
  customer_email: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

function erpBase(): string | null {
  const base = process.env.ERP_BASE_URL?.trim();
  if (!base) {
    return null;
  }
  return base.replace(/\/$/, "");
}

async function erpFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response | null> {
  const base = erpBase();
  const token = process.env.ERP_API_TOKEN?.trim();
  if (!base || !token) {
    console.warn("[ERP client] ERP_BASE_URL or ERP_API_TOKEN not configured");
    return null;
  }

  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export type ERPHealthApiResponse =
  | { status: "not_configured" }
  | { status: "ok"; timestamp: string; [k: string]: unknown }
  | { status: "down"; error: string };

export async function getERPHealth(): Promise<ERPHealthApiResponse> {
  if (!erpBase() || !process.env.ERP_API_TOKEN?.trim()) {
    return { status: "not_configured" };
  }

  try {
    const res = await erpFetch("/api/frontsync/health", { method: "GET" });
    if (!res) {
      return { status: "not_configured" };
    }
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { status: "down", error: `HTTP ${res.status}${t ? `: ${t.slice(0, 200)}` : ""}` };
    }
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const timestamp =
      typeof json?.timestamp === "string"
        ? json.timestamp
        : new Date().toISOString();
    const { status: _ignore, ...erpRest } = json ?? {};
    void _ignore;
    return { status: "ok" as const, timestamp, ...erpRest };
  } catch (e) {
    return {
      status: "down",
      error: e instanceof Error ? e.message : "Health check failed",
    };
  }
}

export type ERPFrontProductHit = {
  erp_id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  sell_price: number;
};

function pickStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function pickNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function parseProductId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) return Number.parseInt(v.trim(), 10);
  return null;
}

function normalizeFrontProduct(row: Record<string, unknown>): ERPFrontProductHit | null {
  const erp_id = parseProductId(row.id ?? row.erp_id ?? row.product_id);
  if (erp_id == null) return null;
  const name = pickStr(row.name ?? row.product_name);
  if (!name) return null;
  return {
    erp_id: Math.trunc(erp_id),
    name,
    sku: pickStr(row.sku ?? row.code ?? row.product_code),
    category: pickStr(row.category ?? row.category_name ?? "—"),
    stock: Math.floor(pickNum(row.stock ?? row.quantity ?? row.qty, 0)),
    unit: pickStr(row.unit ?? row.uom ?? "units") || "units",
    sell_price: pickNum(row.sell_price ?? row.price ?? row.amount, 0),
  };
}

/**
 * Front Sync catalogue search (`GET /api/frontsync/products`).
 */
export async function searchERPProducts(q: string): Promise<{
  products: ERPFrontProductHit[];
  configured: boolean;
}> {
  if (!erpBase() || !process.env.ERP_API_TOKEN?.trim()) {
    return { products: [], configured: false };
  }
  const res = await erpFetch(
    `/api/frontsync/products?search=${encodeURIComponent(q)}&per_page=20`,
    { method: "GET" },
  );
  if (!res) {
    return { products: [], configured: false };
  }
  if (!res.ok) {
    console.warn("[ERP client] searchERPProducts failed:", res.status);
    return { products: [], configured: true };
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | unknown[] | null;
  let rows: unknown[] = [];
  if (Array.isArray(json)) {
    rows = json;
  } else if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) rows = o.data as unknown[];
    else if (Array.isArray(o.products)) rows = o.products as unknown[];
  }
  const products: ERPFrontProductHit[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const n = normalizeFrontProduct(r as Record<string, unknown>);
    if (n) products.push(n);
  }
  return { products, configured: true };
}

export async function getERPProductStock(
  erpProductId: string,
): Promise<{
  product_id: string;
  name: string;
  stock: number;
  low_threshold: number;
  unit: string;
  last_updated: string;
} | null> {
  const res = await erpFetch(
    `/api/frontsync/products/${encodeURIComponent(erpProductId)}/stock`,
    { method: "GET" },
  );
  if (!res) {
    return null;
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    console.warn("[ERP client] getERPProductStock failed:", res.status);
    return null;
  }
  return (await res.json().catch(() => null)) as
    | {
        product_id: string;
        name: string;
        stock: number;
        low_threshold: number;
        unit: string;
        last_updated: string;
      }
    | null;
}

export async function getERPProductStockBulk(
  erpProductIds: string[],
): Promise<Record<string, number>> {
  if (erpProductIds.length === 0 || !erpBase()) {
    return {};
  }
  const res = await erpFetch("/api/frontsync/products/stock/bulk", {
    method: "POST",
    body: JSON.stringify({ product_ids: erpProductIds }),
  });
  if (!res?.ok) {
    console.warn("[ERP client] getERPProductStockBulk failed:", res?.status);
    return {};
  }
  const json = (await res.json().catch(() => null)) as
    | { quantities?: Record<string, number> }
    | Record<string, number>
    | null;
  if (json && typeof json === "object" && "quantities" in json && json.quantities) {
    const q = json.quantities;
    return typeof q === "object" && q !== null ? (q as Record<string, number>) : {};
  }
  if (json && typeof json === "object") {
    return json as Record<string, number>;
  }
  return {};
}

export async function getERPOrders(filters?: {
  email?: string;
  status?: string;
  page?: number;
}): Promise<{ orders: ERPOrder[]; total: number }> {
  if (!erpBase()) {
    return { orders: [], total: 0 };
  }
  const params = new URLSearchParams();
  if (filters?.email) params.set("email", filters.email);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page != null) params.set("page", String(filters.page));
  const q = params.toString();
  const res = await erpFetch(`/api/frontsync/orders${q ? `?${q}` : ""}`, { method: "GET" });
  if (!res?.ok) {
    console.warn("[ERP client] getERPOrders failed:", res?.status);
    return { orders: [], total: 0 };
  }
  const json = (await res.json().catch(() => null)) as
    | { orders?: ERPOrder[]; total?: number }
    | null;
  return {
    orders: Array.isArray(json?.orders) ? json!.orders : [],
    total: typeof json?.total === "number" ? json.total : 0,
  };
}

/**
 * In-app alert for super admins: append-only audit entry (visible in audit log).
 */
export async function logStockLowThresholdAlert(
  service: SupabaseClient,
  productId: string | null,
  productName: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const { error } = await service.from("audit_log").insert({
    user_id: null,
    user_email: "erp@chromax-sync",
    user_role: "system",
    action_type: "erp.stock_low_threshold",
    section: "products",
    record_id: productId,
    record_label: productName,
    after_values: detail,
    source: "erp",
  });
  if (error) {
    console.error("[ERP inbound] audit log (low stock) failed:", error.message);
  }
}
