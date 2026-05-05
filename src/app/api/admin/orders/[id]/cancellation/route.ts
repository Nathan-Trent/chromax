import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { voidNotifyApprovalEmailsForWorkflow } from "@/lib/approvals/notify-approvers";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { orderCancellationSchema } from "@/lib/schemas/admin-orders";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = orderCancellationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { action } = parsed.data;

  const { data: order, error: fetchErr } = await ctx.supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "delivered" || order.status === "cancelled") {
    return NextResponse.json({ error: "Order cannot be cancelled from this status" }, { status: 422 });
  }

  if (action === "request") {
    if (!hasPermission(ctx.roles, "orders", "cancel_request")) {
      return NextResponse.json({ error: "You don't have permission to request cancellation" }, { status: 403 });
    }

    const { data: existingP } = await ctx.supabase
      .from("pending_changes")
      .select("id")
      .eq("section", "orders")
      .eq("record_id", orderId)
      .eq("action_type", "order.cancel_requested")
      .eq("status", "pending")
      .maybeSingle();

    if (existingP) {
      return NextResponse.json({ error: "A cancellation request is already pending" }, { status: 409 });
    }

    const { data: workflow } = await ctx.supabase
      .from("approval_workflows")
      .select("id")
      .eq("action_type", "order.cancel_requested")
      .eq("is_active", true)
      .maybeSingle();

    const { data: pendingRow, error: insErr } = await ctx.supabase
      .from("pending_changes")
      .insert({
        workflow_id: workflow?.id ?? null,
        action_type: "order.cancel_requested",
        section: "orders",
        record_id: orderId,
        record_label: order.reference,
        submitted_by: ctx.user.id,
        before_values: { status: order.status },
        after_values: { requested_cancel: true },
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (workflow?.id) {
      voidNotifyApprovalEmailsForWorkflow(workflow.id, {
        actionType: "order.cancel_requested",
        recordLabel: order.reference,
        submittedByEmail: ctx.user.email,
        dashboardUrl: `${appUrl.replace(/\/$/, "")}/admin/workflows`,
      });
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "order.cancel_requested",
      section: "orders",
      recordId: orderId,
      recordLabel: order.reference,
      afterValues: { pending_change_id: pendingRow?.id },
      source: "dashboard",
      pendingChangeId: pendingRow?.id ?? null,
    });

    console.log("[order-email stub] notify accountant — cancellation requested", {
      order: order.reference,
      requestedBy: ctx.user.email,
    });

    return NextResponse.json({ data: { pending: true, change_id: pendingRow?.id } });
  }

  if (!hasPermission(ctx.roles, "orders", "cancel_approve")) {
    return NextResponse.json({ error: "You don't have permission to approve cancellation" }, { status: 403 });
  }

  const { data: pending, error: pErr } = await ctx.supabase
    .from("pending_changes")
    .select("*")
    .eq("section", "orders")
    .eq("record_id", orderId)
    .eq("action_type", "order.cancel_requested")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  if (!pending) {
    return NextResponse.json({ error: "No pending cancellation request for this order" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { data: updatedOrder, error: updErr } = await ctx.supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancellation_reason: "Approved from dashboard",
    })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  await ctx.supabase
    .from("pending_changes")
    .update({
      status: "approved",
      approver_id: ctx.user.id,
      actioned_at: now,
    })
    .eq("id", pending.id);

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "order.cancel_approved",
    section: "orders",
    recordId: orderId,
    recordLabel: order.reference,
    beforeValues: { status: order.status },
    afterValues: { status: "cancelled" },
    source: "dashboard",
    pendingChangeId: pending.id,
  });

  await queueERPEvent(
    ERP_EVENTS.ORDER_CANCELLED,
    {
      order_id: orderId,
      reference: order.reference,
      previous_status: order.status,
      erp_order_id: order.erp_order_id,
    },
    orderId,
    ctx.user.email,
  );

  console.log("[order-email stub] order cancelled", {
    to: order.customer_email,
    reference: order.reference,
  });

  return NextResponse.json({ data: { order: updatedOrder } });
}
