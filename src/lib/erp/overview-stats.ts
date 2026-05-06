import type { SupabaseClient } from "@supabase/supabase-js";

export type ErpOverviewStats = {
  pendingReviews: number;
  autoAppliedToday: number;
  approvedToday: number;
  rejectedToday: number;
  linkedProducts: number;
  totalProducts: number;
};

export async function getErpOverviewStats(supabase: SupabaseClient): Promise<ErpOverviewStats> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const iso = start.toISOString();

  const [p, auto, ap, rej, link, tot] = await Promise.all([
    supabase
      .from("erp_sync_pending")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("erp_sync_pending")
      .select("*", { count: "exact", head: true })
      .eq("auto_applied", true)
      .gte("created_at", iso),
    supabase
      .from("erp_sync_pending")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("reviewed_at", iso),
    supabase
      .from("erp_sync_pending")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected")
      .gte("reviewed_at", iso),
    supabase.from("products").select("*", { count: "exact", head: true }).not("erp_product_id", "is", null),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  return {
    pendingReviews: p.count ?? 0,
    autoAppliedToday: auto.count ?? 0,
    approvedToday: ap.count ?? 0,
    rejectedToday: rej.count ?? 0,
    linkedProducts: link.count ?? 0,
    totalProducts: tot.count ?? 0,
  };
}
