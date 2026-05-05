import { createClient } from "@/lib/supabase/server";

// TODO: Admin CMS must include a toggle for requires_colour_selection when creating/editing
// products. Default is false.

/** Columns exposed to non-admin contexts — never includes min_b2b_price_* (see chromax-data-models.md). */
export const PUBLIC_PRODUCT_COLUMNS =
  "id,name,slug,description,short_desc,category,images,price_ngn,price_usd,price_gbp,bulk_tiers,stock,low_threshold,tds_url,msds_url,seo_title,seo_description,seo_keywords,status,is_featured,requires_colour_selection,erp_product_id,created_by,created_at,updated_at" as const;

export type ProductCategory =
  | "industrial"
  | "marine"
  | "automotive"
  | "architectural"
  | "custom";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  category: ProductCategory;
  images: { url: string; alt: string; is_primary: boolean }[];
  price_ngn: number | null;
  price_usd: number | null;
  price_gbp: number | null;
  bulk_tiers: {
    min_qty: number;
    price_ngn: number;
    price_usd: number;
    price_gbp: number;
  }[];
  stock: number;
  low_threshold: number;
  tds_url: string | null;
  msds_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  status: "draft" | "live" | "archived";
  is_featured: boolean;
  requires_colour_selection: boolean;
  erp_product_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const SORTABLE_COLUMNS = new Set([
  "created_at",
  "name",
  "price_ngn",
  "price_usd",
  "price_gbp",
]);

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function mapProductRow(row: Record<string, unknown>): Product {
  return row as unknown as Product;
}

export async function getProducts(filters?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
  const offset = (page - 1) * limit;

  const sortKey = filters?.sort && SORTABLE_COLUMNS.has(filters.sort) ? filters.sort : "created_at";
  const ascending = sortKey === "name";

  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS, { count: "exact" })
    .eq("status", "live");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search?.trim()) {
    const raw = filters.search.trim().replace(/,/g, " ");
    const p = `%${escapeIlikePattern(raw)}%`;
    query = query.or(
      `name.ilike.${p},slug.ilike.${p},description.ilike.${p},short_desc.ilike.${p}`,
    );
  }

  query = query.order(sortKey, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getProducts failed: ${error.message}`);
  }

  return {
    products: (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error) {
    throw new Error(`getProductBySlug failed for slug "${slug}": ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProductRow(data as Record<string, unknown>);
}

export async function getProductStock(productId: string): Promise<{
  stock: number;
  low_threshold: number;
  in_stock: boolean;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("stock, low_threshold")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`getProductStock failed for id "${productId}": ${error.message}`);
  }

  if (!data) {
    throw new Error(`getProductStock: no product found with id "${productId}"`);
  }

  const stock = Number(data.stock);
  const low_threshold = Number(data.low_threshold);

  return {
    stock,
    low_threshold,
    in_stock: stock > 0,
  };
}
