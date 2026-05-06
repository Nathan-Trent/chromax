import { ErpSyncHub } from "@/components/admin/erp/ErpSyncHub";
import type { ErpSyncLogRow, ErpSyncStats } from "@/components/admin/erp/ErpSyncLogClient";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { getERPHealth } from "@/lib/erp/client";
import { getErpOverviewStats } from "@/lib/erp/overview-stats";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminErpSyncPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(`roles ( id, name, description, permissions, is_system )`)
    .eq("user_id", user.id);
  const roles = parseUserRoleRows(userRoleRows ?? []);

  if (!hasPermission(roles, "erp_sync", "view")) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">ERP Sync</h1>
        <p className="font-sans text-[#888888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const erpConnected = await Promise.race([
    getERPHealth()
      .then((h) => h.status === "ok")
      .catch(() => false),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 3000);
    }),
  ]);

  const [logsRes, totalRes, successRes, failedRes, lastRes, overview] = await Promise.all([
    supabase.from("erp_sync_log").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("erp_sync_log").select("*", { count: "exact", head: true }),
    supabase.from("erp_sync_log").select("*", { count: "exact", head: true }).eq("status", "success"),
    supabase
      .from("erp_sync_log")
      .select("*", { count: "exact", head: true })
      .in("status", ["failed", "dead_letter"]),
    supabase
      .from("erp_sync_log")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getErpOverviewStats(supabase),
  ]);

  const total = totalRes.count ?? 0;
  const success = successRes.count ?? 0;
  const failed = failedRes.count ?? 0;
  const successRate = total > 0 ? Math.round((success / total) * 1000) / 10 : 0;

  let initialRows = (logsRes.data ?? []) as ErpSyncLogRow[];
  const logIds = [...new Set(initialRows.map((r) => r.id))];
  if (logIds.length > 0) {
    const { data: pend } = await supabase
      .from("erp_sync_pending")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(800);
    const pendRows = pend ?? [];
    const pendingByLog = new Map<string, (typeof pendRows)[number]>();
    for (const p of pendRows) {
      const pay = p.payload as Record<string, unknown> | null;
      const lid = pay?.webhook_log_id;
      if (typeof lid === "string" && logIds.includes(lid) && !pendingByLog.has(lid)) {
        pendingByLog.set(lid, p);
      }
    }
    initialRows = initialRows.map((r) => ({
      ...r,
      erp_sync_pending: pendingByLog.get(r.id) ?? null,
    }));
  }

  const initialStats: ErpSyncStats = {
    total,
    successRate,
    failed,
    lastSync: (lastRes.data?.created_at as string | undefined) ?? null,
  };

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">ERP Sync</h1>
      <p className="mt-1 max-w-2xl font-sans text-sm text-[#888888]">
        Monitor the connection between the dashboard and the Front Sync ERP module.
      </p>

      <div className="mt-8">
        <ErpSyncHub
          erpConnected={erpConnected}
          isSuperAdmin={isSuperAdmin(roles)}
          overview={overview}
          initialRows={initialRows}
          initialStats={initialStats}
        />
      </div>
    </div>
  );
}
