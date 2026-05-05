import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminWorkflowUpsertSchema } from "@/lib/schemas/admin-platform";
import type { ApprovalWorkflowRow } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

function normalizeActionType(raw: string): string {
  if (raw === "order.cancelled") return "order.cancel_requested";
  return raw;
}

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await ctx.supabase.from("approval_workflows").select("*").order("action_type");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: { workflows: (data ?? []) as unknown as ApprovalWorkflowRow[] },
  });
}

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminWorkflowUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const action_type = normalizeActionType(parsed.data.action_type);

  const { data: row, error } = await ctx.supabase
    .from("approval_workflows")
    .insert({
      action_type,
      label: parsed.data.label,
      approver_role_id: parsed.data.approver_role_id,
      notification_channels: parsed.data.notification_channels,
      draft_until_approved: parsed.data.draft_until_approved,
      is_active: parsed.data.is_active,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A workflow for this action already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "workflows.created",
    section: "workflows",
    recordId: row.id,
    recordLabel: action_type,
    afterValues: row,
    source: "dashboard",
  });

  return NextResponse.json({ data: { workflow: row as unknown as ApprovalWorkflowRow } });
}
