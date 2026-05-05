import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminUserResendInviteBodySchema } from "@/lib/schemas/admin-platform";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: staleUserId } = await context.params;
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

  const parsed = adminUserResendInviteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { email, role_id: roleId } = parsed.data;
  const service = createServiceRoleClient();

  const { data: existing, error: loadErr } = await service.auth.admin.getUserById(staleUserId);
  if (loadErr || !existing.user) {
    return NextResponse.json({ error: loadErr?.message ?? "User not found" }, { status: 404 });
  }
  const existingEmail = existing.user.email ?? "";
  if (existingEmail.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Email does not match invitation record" }, { status: 422 });
  }

  await service.from("user_roles").delete().eq("user_id", staleUserId);

  const { error: delErr } = await service.auth.admin.deleteUser(staleUserId);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptPath = `${appUrl.replace(/\/$/, "")}/admin/accept-invite`;

  const { data: invited, error: invErr } = await service.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: acceptPath,
  });

  if (invErr || !invited.user) {
    return NextResponse.json({ error: invErr?.message ?? "Invite failed" }, { status: 400 });
  }

  const newUserId = invited.user.id;

  if (roleId) {
    const { error: urErr } = await ctx.supabase.from("user_roles").insert({
      user_id: newUserId,
      role_id: roleId,
      assigned_by: ctx.user.id,
    });
    if (urErr) {
      return NextResponse.json({ error: urErr.message }, { status: 500 });
    }
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "user.invite_resent",
    section: "users",
    recordId: newUserId,
    recordLabel: email.trim(),
    afterValues: { role_id: roleId ?? null, previous_auth_user_id: staleUserId },
    source: "dashboard",
  });

  return NextResponse.json({ data: { resent: true as const } });
}
