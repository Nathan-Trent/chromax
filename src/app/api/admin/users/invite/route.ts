import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminInviteUserSchema } from "@/lib/schemas/admin-platform";
import { sendStaffInvite } from "@/lib/email";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

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

  const parsed = adminInviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { email, role_id: roleId } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptPath = `${appUrl.replace(/\/$/, "")}/admin/accept-invite`;

  /*
   * Supabase may still send its default invite email depending on your project
   * settings. To avoid duplicate emails, clear or disable the built-in
   * “Invite user” template under Supabase Dashboard → Auth → Email Templates.
   */

  const { email: inviterEmail } = ctx.user;
  const service = createServiceRoleClient();

  const { data: invited, error: invErr } = await service.auth.admin.inviteUserByEmail(email, {
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

  let assignedRoleName = "Staff";

  if (roleId) {
    const { data: roleRow } = await service.from("roles").select("name").eq("id", roleId).maybeSingle();
    if (roleRow?.name) assignedRoleName = String(roleRow.name);
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "users.invited",
    section: "users",
    recordId: newUserId,
    recordLabel: email,
    afterValues: { role_id: roleId ?? null },
    source: "dashboard",
  });

  void sendStaffInvite({
    toEmail: email,
    inviterName: inviterEmail.split("@")[0] ?? "Admin",
    inviterEmail,
    roleName: assignedRoleName,
    acceptUrl: acceptPath,
  });

  void notifySuperAdmins({
    type: NOTIFICATION_TYPES.STAFF_INVITED,
    title: "Staff member invited",
    message: `Invitation sent to ${email} as ${assignedRoleName}`,
  });

  return NextResponse.json({ data: { invited: true as const } });
}
