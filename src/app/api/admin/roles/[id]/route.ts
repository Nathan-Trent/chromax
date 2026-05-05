import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminRoleUpdateSchema } from "@/lib/schemas/admin-platform";
import type { Role } from "@/types/role";
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

  const parsed = adminRoleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { data: existing, error: fErr } = await ctx.supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.is_system) {
    return NextResponse.json({ error: "System roles cannot be edited" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
  if (parsed.data.permissions !== undefined) patch.permissions = parsed.data.permissions;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { data: role, error: uErr } = await ctx.supabase
    .from("roles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (uErr || !role) {
    return NextResponse.json({ error: uErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "roles.updated",
    section: "users",
    recordId: id,
    recordLabel: role.name,
    beforeValues: existing,
    afterValues: role,
    source: "dashboard",
  });

  return NextResponse.json({ data: { role: role as unknown as Role } });
}

export async function DELETE(
  _request: Request,
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

  const { data: existing, error: fErr } = await ctx.supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.is_system) {
    return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 403 });
  }

  const { count, error: cErr } = await ctx.supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id);

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }
  if (count && count > 0) {
    return NextResponse.json(
      { error: "Cannot delete a role that is still assigned to users" },
      { status: 422 },
    );
  }

  const { error: dErr } = await ctx.supabase.from("roles").delete().eq("id", id);
  if (dErr) {
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "roles.deleted",
    section: "users",
    recordId: id,
    recordLabel: existing.name,
    beforeValues: existing,
    source: "dashboard",
  });

  return NextResponse.json({ data: { deleted: true as const } });
}
