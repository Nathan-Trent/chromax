import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import {
  erpSyncLinkBodySchema,
  erpSyncUnlinkBodySchema,
} from "@/lib/schemas/admin-erp-sync";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "edit")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = erpSyncLinkBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { dashboard_product_id, erp_product_id, erp_product_name } = parsed.data;

  const { data: product, error: gErr } = await ctx.supabase
    .from("products")
    .select("id, name")
    .eq("id", dashboard_product_id)
    .maybeSingle();
  if (gErr || !product?.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { error: uErr } = await ctx.supabase
    .from("products")
    .update({
      erp_product_id,
      erp_product_name,
      erp_linked_at: new Date().toISOString(),
    })
    .eq("id", dashboard_product_id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    actionType: "erp.product_linked",
    section: "products",
    recordId: dashboard_product_id,
    recordLabel: product.name as string,
    afterValues: { erp_product_id, erp_product_name },
    source: "dashboard",
  });

  return NextResponse.json({ data: { linked: true } });
}

export async function DELETE(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "edit")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = erpSyncUnlinkBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { dashboard_product_id } = parsed.data;

  const { data: product, error: gErr } = await ctx.supabase
    .from("products")
    .select("id, name")
    .eq("id", dashboard_product_id)
    .maybeSingle();
  if (gErr || !product?.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { error: uErr } = await ctx.supabase
    .from("products")
    .update({
      erp_product_id: null,
      erp_product_name: null,
      erp_linked_at: null,
      erp_last_stock_sync: null,
    })
    .eq("id", dashboard_product_id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    actionType: "erp.product_unlinked",
    section: "products",
    recordId: dashboard_product_id,
    recordLabel: product.name as string,
    beforeValues: { linked: true },
    afterValues: { linked: false },
    source: "dashboard",
  });

  return NextResponse.json({ data: { unlinked: true } });
}
