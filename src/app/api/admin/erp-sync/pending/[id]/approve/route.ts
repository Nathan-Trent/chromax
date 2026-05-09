import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { erpSyncReviewNoteSchema } from "@/lib/schemas/admin-erp-sync";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { applyErpSyncPendingChange } from "@/lib/erp/inbound-sync";
import { ERP_EVENTS } from "@/lib/erp/events";
import { notifyERPSyncUsers, notifyERPSyncUsersWithEmails } from "@/lib/notifications/notify";
import type { ERPSyncPendingRow } from "@/types/erp-sync";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

function asRow(r: Record<string, unknown>): ERPSyncPendingRow {
  return r as unknown as ERPSyncPendingRow;
}

function payloadStr(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "edit")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsedNote = erpSyncReviewNoteSchema.safeParse(body);
  if (!parsedNote.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsedNote.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const note = parsedNote.data.note;

  const service = createServiceRoleClient();
  const { data: raw, error: fErr } = await service
    .from("erp_sync_pending")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr || !raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = asRow(raw as Record<string, unknown>);
  if (item.status !== "pending") {
    return NextResponse.json({ error: "Item is not pending review" }, { status: 422 });
  }

  try {
    await applyErpSyncPendingChange(service, item);
  } catch (e) {
    console.error("[erp sync] approve apply failed", e);
    return NextResponse.json({ error: "Could not apply change" }, { status: 500 });
  }

  let nextPayload = { ...(item.payload ?? {}) } as Record<string, unknown>;
  if (item.field_changed === "order" && item.event_type === ERP_EVENTS.ORDER_CREATED_IN_ERP) {
    const inv = item.incoming_value as Record<string, unknown> | null;
    const rawOid =
      payloadStr(nextPayload, "erp_order_id") ??
      (inv?.erp_order_id != null ? String(inv.erp_order_id) : null);
    const oid = rawOid?.trim() || null;
    if (oid) {
      const { data: created } = await service
        .from("orders")
        .select("id")
        .eq("erp_order_id", oid)
        .maybeSingle();
      if (created?.id) {
        nextPayload = {
          ...nextPayload,
          created_order_id: created.id as string,
          erp_order_id: oid,
        };
      }
    }
  }

  const { error: uErr } = await service
    .from("erp_sync_pending")
    .update({
      status: "approved",
      reviewed_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note?.trim() || null,
      payload: nextPayload,
    })
    .eq("id", id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  const productLabel =
    payloadStr(nextPayload, "erp_product_name") ??
    payloadStr(nextPayload, "product_label") ??
    "record";

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    actionType: "erp_sync.approved",
    section: "erp_sync",
    recordId: id,
    recordLabel: productLabel,
    beforeValues: item.current_value,
    afterValues: item.incoming_value,
    source: "dashboard",
  });

  void notifyERPSyncUsers({
    type: "erp_sync_approved",
    title: "Sync change approved",
    message: `${ctx.user.email} approved ${item.field_changed ?? "sync"} for ${item.event_type}`,
    data: { pending_id: id },
  });

  void notifyERPSyncUsersWithEmails({
    kind: "actioned",
    action: "approved",
    eventType: item.event_type,
    fieldChanged: item.field_changed ?? "",
    actorEmail: ctx.user.email,
    productName: productLabel,
    note: note?.trim() || null,
  });

  return NextResponse.json({ data: { approved: true } });
}
