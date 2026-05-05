import { sendApprovalActioned } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { canApprovePendingChange } from "@/lib/auth/can-approve-pending";
import { adminPendingRejectSchema } from "@/lib/schemas/admin-platform";
import type { PendingChangeRow } from "@/types/admin-workflows";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = adminPendingRejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
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

  const now = new Date().toISOString();
  const comment = parsed.data.comment?.trim() || null;

  const { error: uErr } = await ctx.supabase
    .from("pending_changes")
    .update({
      status: "rejected",
      approver_id: ctx.user.id,
      approver_comment: comment,
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
    actionType: "pending_change.rejected",
    section: row.section,
    recordId: row.record_id,
    recordLabel: row.record_label,
    afterValues: { comment },
    source: "dashboard",
    pendingChangeId: id,
  });

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
        "rejected",
        comment ?? undefined,
      );
    }
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ data: { rejected: true as const } });
}
