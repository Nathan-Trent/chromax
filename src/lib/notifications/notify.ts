import { sendEmail } from "@/lib/email/sender";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function createNotification(options: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const service = createServiceRoleClient();
    const { error } = await service.from("notifications").insert({
      user_id: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ?? {},
    });
    if (error) console.warn("[notifications] insert failed:", error.message);
  } catch (e) {
    console.warn("[notifications] createNotification:", e);
  }
}

function roleHasErpSyncView(permissions: unknown): boolean {
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return false;
  }
  const es = (permissions as Record<string, unknown>).erp_sync;
  if (!es || typeof es !== "object" || Array.isArray(es)) {
    return false;
  }
  return (es as Record<string, unknown>).view === true;
}

async function listErpSyncNotifierUserIds(): Promise<string[]> {
  try {
    const service = createServiceRoleClient();
    const { data: roles } = await service.from("roles").select("id, permissions");
    const roleIds = (roles ?? [])
      .filter((r) => roleHasErpSyncView(r.permissions))
      .map((r) => r.id as string);

    const ids = new Set<string>();

    if (roleIds.length > 0) {
      const { data: ur } = await service.from("user_roles").select("user_id").in("role_id", roleIds);
      for (const row of ur ?? []) {
        ids.add(row.user_id as string);
      }
    }

    const { data: superRole, error: rErr } = await service
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .eq("is_system", true)
      .maybeSingle();
    if (!rErr && superRole?.id) {
      const { data: sur } = await service
        .from("user_roles")
        .select("user_id")
        .eq("role_id", superRole.id);
      for (const row of sur ?? []) {
        ids.add(row.user_id as string);
      }
    }

    return [...ids];
  } catch {
    return [];
  }
}

/**
 * Notify all users with `erp_sync.view` and all Super Admins (deduped). Never throws.
 */
export async function notifyERPSyncUsers(options: {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const ids = await listErpSyncNotifierUserIds();
    await Promise.all(
      ids.map((userId) =>
        createNotification({
          userId,
          type: options.type,
          title: options.title,
          message: options.message,
          data: options.data,
        }),
      ),
    );
  } catch {
    /* never throw */
  }
}

export type ERPSyncEmailPayload =
  | {
      kind: "pending_review";
      eventType: string;
      fieldChanged: string;
      productName: string | null;
      currentSummary: unknown;
      incomingSummary: unknown;
      pendingId: string;
    }
  | {
      kind: "auto_applied";
      eventType: string;
      fieldChanged: string;
      productName: string | null;
      currentSummary: unknown;
      incomingSummary: unknown;
      undoWindowHours: number;
    }
  | {
      kind: "actioned";
      action: "approved" | "rejected";
      eventType: string;
      fieldChanged: string;
      actorEmail: string;
      productName?: string | null;
      note?: string | null;
    };

/** ERP sync transactional emails; never throws. */
export async function notifyERPSyncUsersWithEmails(params: ERPSyncEmailPayload): Promise<void> {
  try {
    const service = createServiceRoleClient();
    const ids = await listErpSyncNotifierUserIds();
    const seenEmail = new Set<string>();
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

    for (const userId of ids) {
      const { data: auth, error: aErr } = await service.auth.admin.getUserById(userId);
      if (aErr || !auth.user?.email) continue;
      const email = auth.user.email;
      if (seenEmail.has(email)) continue;
      seenEmail.add(email);

      const meta = auth.user.user_metadata as Record<string, unknown> | undefined;
      const userName =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        email.split("@")[0] ||
        "there";

      if (params.kind === "pending_review") {
        void sendEmail({
          to: email,
          template: "erp_sync_pending_review",
          notificationType: "erp_sync_review",
          data: {
            userName,
            eventType: params.eventType,
            fieldChanged: params.fieldChanged,
            productName: params.productName ?? "—",
            currentValue: params.currentSummary,
            incomingValue: params.incomingSummary,
            dashboardUrl: `${baseUrl}/admin/erp-sync`,
            pendingId: params.pendingId,
          },
        });
      } else if (params.kind === "auto_applied") {
        void sendEmail({
          to: email,
          template: "erp_sync_auto_applied",
          notificationType: "erp_sync_auto_applied",
          data: {
            userName,
            eventType: params.eventType,
            fieldChanged: params.fieldChanged,
            productName: params.productName ?? "—",
            currentValue: params.currentSummary,
            incomingValue: params.incomingSummary,
            undoWindowHours: params.undoWindowHours,
            dashboardUrl: `${baseUrl}/admin/erp-sync`,
          },
        });
      } else {
        void sendEmail({
          to: email,
          template: "erp_sync_actioned",
          notificationType: "erp_sync_actioned",
          data: {
            userName,
            action: params.action,
            eventType: params.eventType,
            fieldChanged: params.fieldChanged,
            actorEmail: params.actorEmail,
            productName: params.productName ?? "—",
            note: params.note ?? "",
            dashboardUrl: `${baseUrl}/admin/erp-sync`,
          },
        });
      }
    }
  } catch {
    /* never throw */
  }
}

export async function notifySuperAdmins(options: {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const service = createServiceRoleClient();
    const { data: superRole, error: rErr } = await service
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .eq("is_system", true)
      .maybeSingle();
    if (rErr || !superRole?.id) {
      if (rErr) console.warn("[notifications] notifySuperAdmins role lookup:", rErr.message);
      return;
    }
    const { data: rows, error } = await service.from("user_roles").select("user_id").eq("role_id", superRole.id);
    if (error) {
      console.warn("[notifications] notifySuperAdmins query failed:", error.message);
      return;
    }
    const ids = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
    await Promise.all(
      ids.map((userId) =>
        createNotification({
          userId,
          type: options.type,
          title: options.title,
          message: options.message,
          data: options.data,
        }),
      ),
    );
  } catch (e) {
    console.warn("[notifications] notifySuperAdmins:", e);
  }
}
