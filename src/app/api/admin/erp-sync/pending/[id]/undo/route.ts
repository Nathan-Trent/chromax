import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { fetchSyncSetting, undoErpSyncPendingChange } from "@/lib/erp/inbound-sync";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { ERPSyncPendingRow } from "@/types/erp-sync";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

function payloadStr(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "edit")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const { id } = await params;

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
  if (item.status !== "approved" && item.status !== "auto_applied") {
    return NextResponse.json({ error: "Only approved or auto-applied items can be undone" }, { status: 422 });
  }

  const setting = await fetchSyncSetting(service, item.event_type);
  const windowH = setting != null ? setting.undo_window_hours : 24;
  if (windowH <= 0) {
    return NextResponse.json({ error: "Undo window has expired" }, { status: 422 });
  }

  const reviewedAt = item.reviewed_at ? Date.parse(item.reviewed_at) : NaN;
  if (!Number.isFinite(reviewedAt)) {
    return NextResponse.json({ error: "Cannot determine undo window" }, { status: 422 });
  }

  const deadline = reviewedAt + windowH * 60 * 60 * 1000;
  if (Date.now() > deadline) {
    return NextResponse.json({ error: "Undo window has expired" }, { status: 422 });
  }

  try {
    await undoErpSyncPendingChange(service, item);
  } catch (e) {
    console.error("[erp sync] undo failed", e);
    return NextResponse.json({ error: "Could not undo change" }, { status: 500 });
  }

  const { error: uErr } = await service
    .from("erp_sync_pending")
    .update({
      status: "undone",
      undone_at: new Date().toISOString(),
      undone_by: ctx.user.id,
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
    actionType: "erp_sync.undone",
    section: "erp_sync",
    recordId: id,
    recordLabel: productLabel,
    beforeValues: item.incoming_value,
    afterValues: item.current_value,
    source: "dashboard",
  });

  return NextResponse.json({ data: { undone: true } });
}
