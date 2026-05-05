import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type AuditLogInsert = {
  userId: string;
  userEmail: string;
  userRole?: string;
  actionType: string;
  section: string;
  recordId?: string | null;
  recordLabel?: string | null;
  beforeValues?: unknown;
  afterValues?: unknown;
  source?: "dashboard" | "erp" | "ai" | "system";
  pendingChangeId?: string | null;
};

export async function writeAuditLog(
  supabase: SupabaseServer,
  entry: AuditLogInsert,
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    user_id: entry.userId,
    user_email: entry.userEmail,
    user_role: entry.userRole ?? null,
    action_type: entry.actionType,
    section: entry.section,
    record_id: entry.recordId ?? null,
    record_label: entry.recordLabel ?? null,
    before_values: entry.beforeValues ?? null,
    after_values: entry.afterValues ?? null,
    source: entry.source ?? "dashboard",
    pending_change_id: entry.pendingChangeId ?? null,
  });

  if (error) {
    console.error("[audit_log] insert failed:", error.message);
  }
}
