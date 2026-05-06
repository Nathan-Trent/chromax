import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { erpSyncSettingsPatchSchema } from "@/lib/schemas/admin-erp-sync";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const { data: settings, error } = await ctx.supabase
    .from("erp_sync_settings")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { settings: settings ?? [] } });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = erpSyncSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { event_type, ...patchFields } = parsed.data;
  if (
    patchFields.auto_sync === undefined &&
    patchFields.undo_window_hours === undefined &&
    patchFields.is_active === undefined
  ) {
    return NextResponse.json({ error: "No updates provided" }, { status: 422 });
  }

  const updateRow: Record<string, unknown> = {
    updated_by: ctx.user.id,
    updated_at: new Date().toISOString(),
  };
  if (patchFields.auto_sync !== undefined) updateRow.auto_sync = patchFields.auto_sync;
  if (patchFields.undo_window_hours !== undefined) {
    updateRow.undo_window_hours = patchFields.undo_window_hours;
  }
  if (patchFields.is_active !== undefined) updateRow.is_active = patchFields.is_active;

  const { data: beforeRow } = await ctx.supabase
    .from("erp_sync_settings")
    .select("*")
    .eq("event_type", event_type)
    .maybeSingle();

  const { error: uErr } = await ctx.supabase
    .from("erp_sync_settings")
    .update(updateRow)
    .eq("event_type", event_type);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    actionType: "erp_sync.settings_updated",
    section: "erp_sync",
    recordId: event_type,
    recordLabel: beforeRow?.label != null ? String(beforeRow.label) : event_type,
    beforeValues: beforeRow ?? null,
    afterValues: updateRow,
    source: "dashboard",
  });

  return NextResponse.json({ data: { updated: true } });
}
