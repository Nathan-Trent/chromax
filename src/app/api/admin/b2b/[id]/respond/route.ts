import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { voidNotifyApprovalEmailsForWorkflow } from "@/lib/approvals/notify-approvers";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { sendB2BOfferResponse } from "@/lib/email";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { b2bRespondSchema } from "@/lib/schemas/admin-b2b";
import type { B2BThreadEntry } from "@/types/b2b-offer";
import { NextResponse } from "next/server";

const RESPOND_STATUSES = ["pending", "reviewing", "countered"] as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "b2b", "respond")) {
    return NextResponse.json({ error: "You don't have permission to respond to offers" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = b2bRespondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const action = parsed.data;

  const { data: offer, error: fetchErr } = await ctx.supabase
    .from("b2b_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  if (!(RESPOND_STATUSES as readonly string[]).includes(offer.status as string)) {
    return NextResponse.json({ error: "This offer cannot be responded to in its current status" }, { status: 422 });
  }

  const thread = Array.isArray(offer.thread) ? [...(offer.thread as B2BThreadEntry[])] : [];
  const ts = new Date().toISOString();

  if (action.action === "accept") {
    const entry: B2BThreadEntry = {
      from: "chromax",
      price: Number(offer.offered_price),
      message: "Offer accepted",
      timestamp: ts,
      by: ctx.user.email,
    };
    thread.push(entry);

    const { data: updated, error: updErr } = await ctx.supabase
      .from("b2b_offers")
      .update({
        status: "accepted",
        accepted_at: ts,
        responded_at: ts,
        thread,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updErr || !updated) {
      return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "b2b.offer_accepted",
      section: "b2b",
      recordId: id,
      recordLabel: offer.reference,
      beforeValues: { status: offer.status },
      afterValues: { status: "accepted" },
      source: "dashboard",
    });

    await queueERPEvent(
      ERP_EVENTS.B2B_OFFER_ACCEPTED,
      {
        offer_id: id,
        reference: offer.reference,
        buyer_email: offer.buyer_email,
        product_id: offer.product_id,
      },
      id,
      ctx.user.email,
    );

    void sendB2BOfferResponse(
      {
        reference: offer.reference,
        buyer_name: offer.buyer_name,
        buyer_email: offer.buyer_email,
        product_name: offer.product_name,
        currency: offer.currency,
      },
      "accepted",
    );

    return NextResponse.json({ data: { offer: updated } });
  }

  if (action.action === "decline") {
    const entry: B2BThreadEntry = {
      from: "chromax",
      price: null,
      message: action.message?.trim() || "Offer declined",
      timestamp: ts,
      by: ctx.user.email,
    };
    thread.push(entry);

    const { data: updated, error: updErr } = await ctx.supabase
      .from("b2b_offers")
      .update({
        status: "declined",
        responded_at: ts,
        thread,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updErr || !updated) {
      return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "b2b.offer_declined",
      section: "b2b",
      recordId: id,
      recordLabel: offer.reference,
      beforeValues: { status: offer.status },
      afterValues: { status: "declined" },
      source: "dashboard",
    });

    void sendB2BOfferResponse(
      {
        reference: offer.reference,
        buyer_name: offer.buyer_name,
        buyer_email: offer.buyer_email,
        product_name: offer.product_name,
        currency: offer.currency,
      },
      "declined",
      undefined,
      action.message?.trim() || undefined,
    );

    return NextResponse.json({ data: { offer: updated } });
  }

  if (action.action !== "counter") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 422 });
  }

  const counterPrice = action.counter_price;
  const canApprove = hasPermission(ctx.roles, "b2b", "approve");

  const { data: workflow } = await ctx.supabase
    .from("approval_workflows")
    .select("id")
    .eq("action_type", "b2b.counter_sent")
    .eq("is_active", true)
    .maybeSingle();

  const needsPending = Boolean(workflow) && !canApprove;

  if (needsPending && workflow) {
    const { data: pendingRow, error: pendErr } = await ctx.supabase
      .from("pending_changes")
      .insert({
        workflow_id: workflow.id,
        action_type: "b2b.counter_sent",
        section: "b2b",
        record_id: id,
        record_label: offer.reference,
        submitted_by: ctx.user.id,
        before_values: { status: offer.status, thread: offer.thread },
        after_values: {
          counter_price: counterPrice,
          message: action.message ?? null,
        },
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (pendErr || !pendingRow) {
      return NextResponse.json({ error: pendErr?.message ?? "Could not create pending change" }, { status: 500 });
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "b2b.counter_pending",
      section: "b2b",
      recordId: id,
      recordLabel: offer.reference,
      afterValues: { pending_change_id: pendingRow.id, counter_price: counterPrice },
      source: "dashboard",
      pendingChangeId: pendingRow.id,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    voidNotifyApprovalEmailsForWorkflow(workflow.id, {
      actionType: "b2b.counter_sent",
      recordLabel: offer.reference,
      submittedByEmail: ctx.user.email,
      dashboardUrl: `${appUrl.replace(/\/$/, "")}/admin/workflows`,
    });

    return NextResponse.json({ data: { pending: true as const, change_id: pendingRow.id } });
  }

  const entry: B2BThreadEntry = {
    from: "chromax",
    price: counterPrice,
    message: action.message?.trim() || "Counter-offer",
    timestamp: ts,
    by: ctx.user.email,
  };
  thread.push(entry);

  const { data: updated, error: updErr } = await ctx.supabase
    .from("b2b_offers")
    .update({
      status: "countered",
      responded_at: ts,
      thread,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updErr || !updated) {
    return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "b2b.counter_sent",
    section: "b2b",
    recordId: id,
    recordLabel: offer.reference,
    beforeValues: { status: offer.status },
    afterValues: { status: "countered", counter_price: counterPrice },
    source: "dashboard",
  });

  await queueERPEvent(
    ERP_EVENTS.B2B_OFFER_COUNTER_SENT,
    {
      offer_id: id,
      reference: offer.reference,
      buyer_email: offer.buyer_email,
      counter_price: counterPrice,
    },
    id,
    ctx.user.email,
  );

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
    action.message?.trim() || undefined,
  );

  return NextResponse.json({ data: { offer: updated } });
}
