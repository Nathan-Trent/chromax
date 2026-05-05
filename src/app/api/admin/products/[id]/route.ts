import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { voidNotifyApprovalEmailsForWorkflow } from "@/lib/approvals/notify-approvers";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { adminProductUpdateSchema } from "@/lib/schemas/admin-products";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/supabase/queries/products";
import { NextResponse } from "next/server";

const PRICE_KEYS = ["price_ngn", "price_usd", "price_gbp"] as const;

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pricingChangedFromPatch(
  existing: Record<string, unknown>,
  patch: Record<string, unknown | undefined>,
): boolean {
  for (const k of PRICE_KEYS) {
    if (!(k in patch) || patch[k] === undefined) continue;
    const a = numOrNull(patch[k]);
    const b = numOrNull(existing[k]);
    if (a !== b) return true;
  }
  return false;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await context.params;

  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  if (!hasPermission(ctx.roles, "products", "edit")) {
    return NextResponse.json({ error: "You don't have permission to edit products" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminProductUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const patch = parsed.data as Record<string, unknown | undefined>;

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const canApprovePricing = hasPermission(ctx.roles, "products", "approve_pricing");
  const priceDiff = pricingChangedFromPatch(existing, patch);
  const needsApprovalGate = priceDiff && !canApprovePricing;

  const { data: workflow } = needsApprovalGate
    ? await ctx.supabase
        .from("approval_workflows")
        .select("id")
        .eq("action_type", "product.price_updated")
        .eq("is_active", true)
        .maybeSingle()
    : { data: null as { id: string } | null };

  const usePendingWorkflow = Boolean(needsApprovalGate && workflow);

  const beforePrices = {
    price_ngn: numOrNull(existing.price_ngn),
    price_usd: numOrNull(existing.price_usd),
    price_gbp: numOrNull(existing.price_gbp),
  };

  const afterPrices = {
    price_ngn:
      "price_ngn" in patch && patch.price_ngn !== undefined
        ? numOrNull(patch.price_ngn)
        : beforePrices.price_ngn,
    price_usd:
      "price_usd" in patch && patch.price_usd !== undefined
        ? numOrNull(patch.price_usd)
        : beforePrices.price_usd,
    price_gbp:
      "price_gbp" in patch && patch.price_gbp !== undefined
        ? numOrNull(patch.price_gbp)
        : beforePrices.price_gbp,
  };

  const updatePayload: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    if (usePendingWorkflow && PRICE_KEYS.includes(key as (typeof PRICE_KEYS)[number])) {
      continue;
    }
    updatePayload[key] = val;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: upErr } = await ctx.supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId);

    if (upErr) {
      if (upErr.code === "23505") {
        return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  if (usePendingWorkflow && workflow) {
    const { data: pendingRow, error: pendErr } = await ctx.supabase
      .from("pending_changes")
      .insert({
        workflow_id: workflow.id,
        action_type: "product.price_updated",
        section: "products",
        record_id: productId,
        record_label: String(existing.name),
        submitted_by: ctx.user.id,
        before_values: beforePrices,
        after_values: afterPrices,
        status: "pending",
      })
      .select("id")
      .single();

    if (pendErr) {
      return NextResponse.json({ error: pendErr.message }, { status: 500 });
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "product.price_updated.pending",
      section: "products",
      recordId: productId,
      recordLabel: String(existing.name),
      beforeValues: beforePrices,
      afterValues: afterPrices,
      source: "dashboard",
      pendingChangeId: pendingRow.id,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    voidNotifyApprovalEmailsForWorkflow(workflow.id, {
      actionType: "product.price_updated",
      recordLabel: String(existing.name),
      submittedByEmail: ctx.user.email,
      dashboardUrl: `${appUrl.replace(/\/$/, "")}/admin/workflows`,
    });

    return NextResponse.json({
      data: { pending: true as const, change_id: pendingRow.id },
    });
  }

  const { data: product, error: readErr } = await ctx.supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("id", productId)
    .single();

  if (readErr || !product) {
    return NextResponse.json({ error: readErr?.message ?? "Failed to load product" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "product.updated",
    section: "products",
    recordId: productId,
    recordLabel: product.name,
    beforeValues: existing,
    afterValues: product,
    source: "dashboard",
  });

  const appliedPriceChange =
    numOrNull(product.price_ngn) !== beforePrices.price_ngn ||
    numOrNull(product.price_usd) !== beforePrices.price_usd ||
    numOrNull(product.price_gbp) !== beforePrices.price_gbp;

  if (appliedPriceChange) {
    await queueERPEvent(
      ERP_EVENTS.PRODUCT_PRICE_UPDATED,
      {
        product_id: productId,
        slug: product.slug,
        erp_product_id: product.erp_product_id,
        price_ngn: product.price_ngn,
        price_usd: product.price_usd,
        price_gbp: product.price_gbp,
      },
      productId,
      ctx.user.email,
    );
  }

  return NextResponse.json({ data: { product } });
}
