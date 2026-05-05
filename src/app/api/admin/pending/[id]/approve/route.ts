import { sendApprovalActioned, sendB2BOfferResponse } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { canApprovePendingChange } from "@/lib/auth/can-approve-pending";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { applyPendingChange } from "@/lib/workflows/apply-pending-change";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/supabase/queries/products";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { PendingChangeRow } from "@/types/admin-workflows";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function revalidateAfterContentApproval() {
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/content", "layout");
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error: pErr } = await ctx.supabase
    .from("pending_changes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  if (!pending) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = pending as unknown as PendingChangeRow;
  if (row.status !== "pending") {
    return NextResponse.json({ error: "This change is no longer pending" }, { status: 422 });
  }

  let approverRoleId: string | null = null;
  if (row.workflow_id) {
    const { data: wf } = await ctx.supabase
      .from("approval_workflows")
      .select("approver_role_id")
      .eq("id", row.workflow_id)
      .maybeSingle();
    approverRoleId = (wf?.approver_role_id as string | null) ?? null;
  }

  if (!canApprovePendingChange(ctx, approverRoleId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applied = await applyPendingChange(ctx.supabase, row, ctx.user.id);
  if (!applied.ok) {
    return NextResponse.json({ error: applied.error }, { status: 422 });
  }

  if (row.action_type === "content.page_updated") {
    revalidateAfterContentApproval();
  }

  const now = new Date().toISOString();
  const { error: uErr } = await ctx.supabase
    .from("pending_changes")
    .update({
      status: "approved",
      approver_id: ctx.user.id,
      actioned_at: now,
    })
    .eq("id", id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "pending_change.approved",
    section: row.section,
    recordId: row.record_id,
    recordLabel: row.record_label,
    beforeValues: row.before_values,
    afterValues: row.after_values,
    source: "dashboard",
    pendingChangeId: id,
  });

  if (row.action_type === "product.price_updated" && row.record_id) {
    const { data: prod } = await ctx.supabase
      .from("products")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("id", row.record_id)
      .maybeSingle();
    if (prod) {
      await queueERPEvent(
        ERP_EVENTS.PRODUCT_PRICE_UPDATED,
        {
          product_id: prod.id,
          slug: prod.slug,
          erp_product_id: prod.erp_product_id,
          price_ngn: prod.price_ngn,
          price_usd: prod.price_usd,
          price_gbp: prod.price_gbp,
        },
        prod.id,
        ctx.user.email,
      );
    }
  }

  try {
    const service = createServiceRoleClient();
    const { data: authData } = await service.auth.admin.getUserById(row.submitted_by as string);
    const email = authData.user?.email;
    if (email) {
      const meta = authData.user?.user_metadata as Record<string, unknown> | undefined;
      const name =
        typeof meta?.full_name === "string" && meta.full_name ? meta.full_name : email.split("@")[0] ?? "User";
      void sendApprovalActioned(
        String(row.record_label ?? "Record"),
        String(row.action_type ?? "change"),
        email,
        name,
        "approved",
      );
    }
  } catch {
    /* non-blocking */
  }

  if (row.action_type === "b2b.counter_sent" && row.record_id) {
    try {
      const { data: offer } = await ctx.supabase
        .from("b2b_offers")
        .select("reference, buyer_name, buyer_email, product_name, currency")
        .eq("id", row.record_id)
        .maybeSingle();
      if (offer) {
        const after = row.after_values as Record<string, unknown> | null;
        const counterPrice =
          after?.counter_price !== undefined && after?.counter_price !== null
            ? Number(after.counter_price)
            : NaN;
        const msg = after?.message;
        const message = typeof msg === "string" ? msg : undefined;
        if (Number.isFinite(counterPrice)) {
          void sendB2BOfferResponse(
            {
              reference: offer.reference,
              buyer_name: offer.buyer_name,
              buyer_email: offer.buyer_email,
              product_name: offer.product_name,
              currency: offer.currency,
            },
            "countered",
            counterPrice,
            message ?? undefined,
          );
        }
      }
    } catch {
      /* non-blocking */
    }
  }

  return NextResponse.json({ data: { approved: true as const } });
}
