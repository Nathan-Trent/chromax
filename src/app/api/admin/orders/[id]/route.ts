import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { sendOrderStatusUpdate } from "@/lib/email";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { isForwardTransition } from "@/lib/orders/order-flow";
import { adminOrderStatusPatchSchema } from "@/lib/schemas/admin-orders";
import type { OrderStatus } from "@/types/order";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "orders", "view")) {
    return NextResponse.json({ error: "You don't have permission to view orders" }, { status: 403 });
  }

  const { data: order, error } = await ctx.supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { order } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "orders", "fulfil")) {
    return NextResponse.json({ error: "You don't have permission to update order status" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminOrderStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { status: newStatus, tracking_number, courier } = parsed.data;

  if (newStatus === "cancelled") {
    return NextResponse.json(
      { error: "Use the cancellation approval flow to cancel an order" },
      { status: 422 },
    );
  }

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const prevStatus = existing.status as string;
  if (prevStatus === "cancelled" || prevStatus === "delivered") {
    return NextResponse.json({ error: "Order cannot be updated from this status" }, { status: 422 });
  }

  if (!isForwardTransition(prevStatus as OrderStatus, newStatus)) {
    return NextResponse.json(
      { error: `Invalid status transition: ${prevStatus} → ${newStatus}` },
      { status: 422 },
    );
  }

  if (newStatus === "dispatched") {
    const tn = tracking_number?.trim() ?? (existing.tracking_number as string | null)?.trim();
    if (!tn) {
      return NextResponse.json(
        { error: "Tracking number is required to mark as dispatched" },
        { status: 422 },
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
  };

  if (tracking_number !== undefined) {
    updatePayload.tracking_number = tracking_number?.trim() || null;
  } else if (newStatus === "dispatched" && existing.tracking_number) {
    updatePayload.tracking_number = String(existing.tracking_number).trim();
  }

  if (courier !== undefined) {
    updatePayload.courier = courier?.trim() || null;
  }

  if (newStatus === "dispatched") {
    updatePayload.dispatched_at = new Date().toISOString();
  }
  if (newStatus === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { data: order, error: updErr } = await ctx.supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "order.status_updated",
    section: "orders",
    recordId: order.id,
    recordLabel: order.reference,
    beforeValues: { status: prevStatus },
    afterValues: { status: newStatus, tracking_number: order.tracking_number, courier: order.courier },
    source: "dashboard",
  });

  await queueERPEvent(
    ERP_EVENTS.ORDER_STATUS_UPDATED,
    {
      order_id: order.id,
      reference: order.reference,
      new_status: newStatus,
      previous_status: prevStatus,
      tracking_number: order.tracking_number,
      courier: order.courier,
      erp_order_id: order.erp_order_id,
    },
    order.id,
    ctx.user.email,
  );

  if (prevStatus !== newStatus) {
    void sendOrderStatusUpdate({
      reference: order.reference,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      status: newStatus,
      tracking_number: order.tracking_number as string | null | undefined,
      courier: order.courier as string | null | undefined,
    });
  }

  return NextResponse.json({ data: { order } });
}
