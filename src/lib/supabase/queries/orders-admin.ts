import { createClient } from "@/lib/supabase/server";
import type { AdminOrderRow, OrderCurrency, OrderStatus } from "@/types/order";

const ORDER_COLUMNS = [
  "id",
  "reference",
  "customer_id",
  "customer_email",
  "customer_name",
  "customer_phone",
  "items",
  "subtotal",
  "shipping_cost",
  "total",
  "currency",
  "status",
  "payment_status",
  "payment_method",
  "payment_ref",
  "tracking_number",
  "courier",
  "shipping_address",
  "notes",
  "source",
  "erp_synced_at",
  "erp_order_id",
  "dispatched_at",
  "delivered_at",
  "cancelled_at",
  "cancellation_reason",
  "refund_amount",
  "created_at",
  "updated_at",
].join(", ");

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type AdminOrderListFilter = {
  status?: OrderStatus | "all";
  currency?: OrderCurrency | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export async function getAdminOrders(
  filters: AdminOrderListFilter,
): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  let query = supabase.from("orders").select(ORDER_COLUMNS, { count: "exact" });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.currency && filters.currency !== "all") {
    query = query.eq("currency", filters.currency);
  }

  if (filters.search?.trim()) {
    const raw = escapeIlikePattern(filters.search.trim());
    const p = `%${raw}%`;
    query = query.or(
      `reference.ilike.${p},customer_name.ilike.${p},customer_email.ilike.${p}`,
    );
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getAdminOrders failed: ${error.message}`);
  }

  return {
    orders: (data ?? []) as unknown as AdminOrderRow[],
    total: count ?? 0,
  };
}

export async function getAdminOrderById(id: string): Promise<AdminOrderRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getAdminOrderById failed: ${error.message}`);
  }

  return data ? (data as unknown as AdminOrderRow) : null;
}

export async function getLatestAuditSourceForRecord(
  recordId: string,
): Promise<"dashboard" | "erp" | "ai" | "system" | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("source")
    .eq("record_id", recordId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.source) return null;
  const s = data.source as string;
  if (s === "dashboard" || s === "erp" || s === "ai" || s === "system") return s;
  return null;
}

export async function hasPendingOrderCancellation(
  orderId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_changes")
    .select("id")
    .eq("section", "orders")
    .eq("record_id", orderId)
    .eq("action_type", "order.cancel_requested")
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function getCustomerAccountType(
  customerId: string | null,
): Promise<"retail" | "trade" | null> {
  if (!customerId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("account_type")
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data?.account_type) return null;
  if (data.account_type === "retail" || data.account_type === "trade") {
    return data.account_type;
  }
  return null;
}
