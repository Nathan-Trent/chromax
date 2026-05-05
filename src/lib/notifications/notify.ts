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
