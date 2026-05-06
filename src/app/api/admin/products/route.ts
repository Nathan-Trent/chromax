import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminProductCreateSchema } from "@/lib/schemas/admin-products";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/supabase/queries/products";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  if (!hasPermission(ctx.roles, "products", "create")) {
    return NextResponse.json({ error: "You don't have permission to create products" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Validation failed", details: msg },
      { status: 422 },
    );
  }

  const d = parsed.data;

  const insert = {
    name: d.name,
    slug: d.slug,
    category: d.category,
    status: d.status,
    short_desc: d.short_desc ?? null,
    description: d.description ?? null,
    price_ngn: d.price_ngn ?? null,
    price_usd: d.price_usd ?? null,
    price_gbp: d.price_gbp ?? null,
    requires_colour_selection: d.requires_colour_selection,
    is_featured: d.is_featured,
    stock: d.stock,
    low_threshold: d.low_threshold,
    tds_url: d.tds_url ?? null,
    msds_url: d.msds_url ?? null,
    seo_title: d.seo_title ?? null,
    seo_description: d.seo_description ?? null,
    seo_keywords: null as string[] | null,
    images: [],
    bulk_tiers: [],
    min_b2b_price_ngn: null as number | null,
    min_b2b_price_usd: null as number | null,
    min_b2b_price_gbp: null as number | null,
    erp_product_id: null as number | null,
    erp_product_name: null as string | null,
    erp_linked_at: null as string | null,
    erp_last_stock_sync: null as string | null,
    created_by: ctx.user.id,
  };

  const { data: product, error } = await ctx.supabase
    .from("products")
    .insert(insert)
    .select(PUBLIC_PRODUCT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "product.created",
    section: "products",
    recordId: product.id,
    recordLabel: product.name,
    afterValues: product,
    source: "dashboard",
  });

  return NextResponse.json({ data: { product } });
}
