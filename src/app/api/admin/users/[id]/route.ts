import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { adminUserPatchBodySchema } from "@/lib/schemas/admin-platform";
import { sendEmail } from "@/lib/email/sender";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

async function staffRoleCount(
  service: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<number> {
  const { count, error } = await service
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function customerExists(
  service: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await service.from("customers").select("id").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const parsed = adminUserPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { action } = parsed.data;
  const service = createServiceRoleClient();

  try {
    switch (action) {
      case "suspend": {
        const n = await staffRoleCount(service, id);
        if (n < 1) {
          return NextResponse.json({ error: "Target is not staff" }, { status: 422 });
        }
        const { error } = await service.auth.admin.updateUserById(id, {
          ban_duration: "876600h",
        } as Record<string, unknown>);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "user.suspended",
          section: "users",
          recordId: id,
          afterValues: { reason: parsed.data.reason ?? null },
          source: "dashboard",
        });
        break;
      }
      case "unsuspend": {
        const n = await staffRoleCount(service, id);
        if (n < 1) {
          return NextResponse.json({ error: "Target is not staff" }, { status: 422 });
        }
        const { error } = await service.auth.admin.updateUserById(id, {
          ban_duration: "none",
        } as Record<string, unknown>);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "user.unsuspended",
          section: "users",
          recordId: id,
          source: "dashboard",
        });
        break;
      }
      case "verify_email": {
        const { error } = await service.auth.admin.updateUserById(id, {
          email_confirm: true,
        } as Record<string, unknown>);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "user.email_verified",
          section: "users",
          recordId: id,
          source: "dashboard",
        });
        break;
      }
      case "force_password_reset": {
        const email = parsed.data.email!;
        const { data: gen, error: genErr } = await service.auth.admin.generateLink({
          type: "recovery",
          email,
        });
        if (genErr || !gen?.properties?.action_link) {
          return NextResponse.json(
            { error: genErr?.message ?? "Failed to generate reset link" },
            { status: 400 },
          );
        }
        await sendEmail({
          to: email,
          template: "password_reset",
          data: { resetUrl: gen.properties.action_link },
          notificationType: "password_reset",
        });
        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "user.password_reset_forced",
          section: "users",
          recordId: id,
          recordLabel: email,
          source: "dashboard",
        });
        break;
      }
      case "suspend_customer": {
        if ((await staffRoleCount(service, id)) > 0) {
          return NextResponse.json({ error: "Target is staff, not a customer" }, { status: 422 });
        }
        if (!(await customerExists(service, id))) {
          return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }
        const { error: upErr } = await service
          .from("customers")
          .update({
            suspended_at: new Date().toISOString(),
            suspended_by: ctx.user.id,
            suspension_reason: parsed.data.reason ?? null,
          })
          .eq("id", id);
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

        const { error: banErr } = await service.auth.admin.updateUserById(id, {
          ban_duration: "876600h",
        } as Record<string, unknown>);
        if (banErr) return NextResponse.json({ error: banErr.message }, { status: 400 });

        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "customer.suspended",
          section: "users",
          recordId: id,
          afterValues: { reason: parsed.data.reason ?? null },
          source: "dashboard",
        });
        break;
      }
      case "unsuspend_customer": {
        if ((await staffRoleCount(service, id)) > 0) {
          return NextResponse.json({ error: "Target is staff, not a customer" }, { status: 422 });
        }
        if (!(await customerExists(service, id))) {
          return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }
        const { error: upErr } = await service
          .from("customers")
          .update({
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
          })
          .eq("id", id);
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

        const { error: banErr } = await service.auth.admin.updateUserById(id, {
          ban_duration: "none",
        } as Record<string, unknown>);
        if (banErr) return NextResponse.json({ error: banErr.message }, { status: 400 });

        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "customer.unsuspended",
          section: "users",
          recordId: id,
          source: "dashboard",
        });
        break;
      }
      case "update_note": {
        const note = parsed.data.note;
        if (note === undefined) {
          return NextResponse.json({ error: "note is required" }, { status: 422 });
        }
        if ((await staffRoleCount(service, id)) > 0) {
          return NextResponse.json({ error: "Target is staff, not a customer" }, { status: 422 });
        }
        if (!(await customerExists(service, id))) {
          return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }
        const { error: upErr } = await service.from("customers").update({ internal_notes: note }).eq("id", id);
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
        await writeAuditLog(ctx.supabase, {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userRole: roleNamesCsv(ctx.roles),
          actionType: "customer.note_updated",
          section: "users",
          recordId: id,
          afterValues: { note },
          source: "dashboard",
        });
        break;
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true as const } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = new URL(request.url).searchParams.get("type");
  if (type !== "staff" && type !== "customer") {
    return NextResponse.json({ error: "Query param type must be staff or customer" }, { status: 422 });
  }

  if (id === ctx.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account from here." }, { status: 422 });
  }

  const service = createServiceRoleClient();

  try {
    if (type === "staff") {
      const n = await staffRoleCount(service, id);
      if (n < 1) {
        return NextResponse.json({ error: "Target is not staff" }, { status: 422 });
      }
      const { error: delUr } = await service.from("user_roles").delete().eq("user_id", id);
      if (delUr) return NextResponse.json({ error: delUr.message }, { status: 500 });
      const { error: delAuth } = await service.auth.admin.deleteUser(id);
      if (delAuth) return NextResponse.json({ error: delAuth.message }, { status: 400 });
      await writeAuditLog(ctx.supabase, {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: roleNamesCsv(ctx.roles),
        actionType: "user.deleted",
        section: "users",
        recordId: id,
        source: "dashboard",
      });
    } else {
      // customer
      // In production, consider soft-delete for GDPR compliance (keep anonymised order records).
      if ((await staffRoleCount(service, id)) > 0) {
        return NextResponse.json({ error: "Target is staff, not a customer" }, { status: 422 });
      }
      const { error: delOrd } = await service.from("orders").delete().eq("customer_id", id);
      if (delOrd) return NextResponse.json({ error: delOrd.message }, { status: 500 });
      const { error: delCust } = await service.from("customers").delete().eq("id", id);
      if (delCust) return NextResponse.json({ error: delCust.message }, { status: 500 });
      const { error: delUr } = await service.from("user_roles").delete().eq("user_id", id);
      if (delUr) return NextResponse.json({ error: delUr.message }, { status: 500 });
      const { error: delAuth } = await service.auth.admin.deleteUser(id);
      if (delAuth) return NextResponse.json({ error: delAuth.message }, { status: 400 });
      await writeAuditLog(ctx.supabase, {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: roleNamesCsv(ctx.roles),
        actionType: "customer.deleted",
        section: "users",
        recordId: id,
        source: "dashboard",
      });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { deleted: true as const } });
}
