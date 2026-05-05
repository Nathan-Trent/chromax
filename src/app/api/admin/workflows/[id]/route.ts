import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminWorkflowPatchBodySchema } from "@/lib/schemas/admin-platform";
import type { ApprovalWorkflowRow } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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

  const parsed = adminWorkflowPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { data: existing, error: fErr } = await ctx.supabase
    .from("approval_workflows")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { ...parsed.data };
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { data: row, error: uErr } = await ctx.supabase
    .from("approval_workflows")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (uErr || !row) {
    return NextResponse.json({ error: uErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "workflows.updated",
    section: "workflows",
    recordId: id,
    recordLabel: row.action_type,
    beforeValues: existing,
    afterValues: row,
    source: "dashboard",
  });

  return NextResponse.json({ data: { workflow: row as unknown as ApprovalWorkflowRow } });
}
