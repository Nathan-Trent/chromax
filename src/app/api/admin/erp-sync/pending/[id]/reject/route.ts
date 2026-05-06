import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { erpSyncReviewNoteSchema } from "@/lib/schemas/admin-erp-sync";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { notifyERPSyncUsers, notifyERPSyncUsersWithEmails } from "@/lib/notifications/notify";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

import type { ERPSyncPendingRow } from "@/types/erp-sync";

type RouteParams = { params: Promise<{ id: string }> };

function payloadStr(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

export async function POST(request: Request, { params }: RouteParams) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "view")) {
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

  const item = raw as unknown as ERPSyncPendingRow;
  if (item.status !== "pending") {
    return NextResponse.json({ error: "Item is not pending review" }, { status: 422 });
  }

  const { error: uErr } = await service
    .from("erp_sync_pending")
    .update({
      status: "rejected",
      reviewed_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note?.trim() || null,
    })
    .eq("id", id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  const productLabel =
    payloadStr(item.payload, "erp_product_name") ??
    payloadStr(item.payload, "product_label") ??
    "record";

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    actionType: "erp_sync.rejected",
    section: "erp_sync",
    recordId: id,
    recordLabel: productLabel,
    beforeValues: item.current_value,
    afterValues: item.incoming_value,
    source: "dashboard",
  });

  void notifyERPSyncUsers({
    type: "erp_sync_rejected",
    title: "Sync change rejected",
    message: `${ctx.user.email} rejected ${item.field_changed ?? "sync"} for ${item.event_type}`,
    data: { pending_id: id },
  });

  void notifyERPSyncUsersWithEmails({
    kind: "actioned",
    action: "rejected",
    eventType: item.event_type,
    fieldChanged: item.field_changed ?? "",
    actorEmail: ctx.user.email,
    productName: productLabel,
    note: note?.trim() || null,
  });

  return NextResponse.json({ data: { rejected: true } });
}
