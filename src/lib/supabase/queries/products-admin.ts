import { createClient } from "@/lib/supabase/server";
import type { Product, ProductCategory } from "@/lib/supabase/queries/products";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/supabase/queries/products";

const ADMIN_LIST_COLUMNS = PUBLIC_PRODUCT_COLUMNS;

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type AdminProductListFilter = {
  category?: ProductCategory;
  status?: "draft" | "live" | "archived";
  search?: string;
  page?: number;
  limit?: number;
};

export async function getAdminProducts(
  filters: AdminProductListFilter,
): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  let query = supabase.from("products").select(ADMIN_LIST_COLUMNS, { count: "exact" });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const raw = filters.search.trim().replace(/,/g, " ");
    const p = `%${escapeIlikePattern(raw)}%`;
    query = query.or(
      `name.ilike.${p},slug.ilike.${p},description.ilike.${p},short_desc.ilike.${p}`,
    );
  }

  query = query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getAdminProducts failed: ${error.message}`);
  }

  return {
    products: (data ?? []) as Product[],
    total: count ?? 0,
  };
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getAdminProductById failed: ${error.message}`);
  }

  if (!data) return null;

  return data as Product;
}

export type LiveProductOption = { id: string; name: string; slug: string };

export async function getLiveProductsForSelect(): Promise<LiveProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("status", "live")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getLiveProductsForSelect failed: ${error.message}`);
  }

  return (data ?? []) as LiveProductOption[];
}

export type ColourSwatchRow = {
  id: string;
  name: string;
  hex: string;
  product_code: string;
  category: "automotive" | "marine" | "architectural" | "industrial";
  product_id: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  linked_product_name: string | null;
};

export async function getAdminSwatchesWithProducts(): Promise<ColourSwatchRow[]> {
  const supabase = await createClient();

  const { data: swatches, error } = await supabase
    .from("colour_swatches")
    .select("id, name, hex, product_code, category, product_id, display_order, active, created_at, updated_at")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getAdminSwatchesWithProducts failed: ${error.message}`);
  }

  const rows = swatches ?? [];
  const productIds = [...new Set(rows.map((r) => r.product_id).filter((id): id is string => Boolean(id)))];

  let nameMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: prods, error: pErr } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);
    if (!pErr && prods) {
      nameMap = Object.fromEntries(prods.map((p) => [p.id as string, p.name as string]));
    }
  }

  return rows.map((row) => ({
    ...(row as Omit<ColourSwatchRow, "linked_product_name">),
    linked_product_name: row.product_id ? nameMap[row.product_id] ?? null : null,
  }));
}
