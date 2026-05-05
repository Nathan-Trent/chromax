import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminUserRolesBodySchema } from "@/lib/schemas/admin-platform";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await context.params;
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

  const parsed = adminUserRolesBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { role_ids: roleIds } = parsed.data;

  const { data: superRow } = await ctx.supabase
    .from("roles")
    .select("id")
    .eq("name", "Super Admin")
    .eq("is_system", true)
    .maybeSingle();

  const superAdminId = superRow?.id as string | undefined;

  if (
    superAdminId &&
    roleIds.includes(superAdminId) &&
    targetUserId !== ctx.user.id
  ) {
    return NextResponse.json(
      { error: "Super Admin cannot be assigned via the dashboard." },
      { status: 422 },
    );
  }

  const effectiveRoleIds = [...roleIds];
  if (
    superAdminId &&
    targetUserId === ctx.user.id &&
    isSuperAdmin(ctx.roles) &&
    !effectiveRoleIds.includes(superAdminId)
  ) {
    effectiveRoleIds.push(superAdminId);
  }

  if (targetUserId === ctx.user.id && superAdminId && !effectiveRoleIds.includes(superAdminId)) {
    return NextResponse.json(
      { error: "You cannot remove the Super Admin role from yourself." },
      { status: 422 },
    );
  }

  const { error: delErr } = await ctx.supabase.from("user_roles").delete().eq("user_id", targetUserId);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  if (effectiveRoleIds.length > 0) {
    const rows = effectiveRoleIds.map((role_id) => ({
      user_id: targetUserId,
      role_id,
      assigned_by: ctx.user.id,
    }));
    const { error: insErr } = await ctx.supabase.from("user_roles").insert(rows);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "users.roles_updated",
    section: "users",
    recordId: targetUserId,
    afterValues: { role_ids: effectiveRoleIds },
    source: "dashboard",
  });

  return NextResponse.json({ data: { updated: true as const } });
}
