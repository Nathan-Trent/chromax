import { createClient } from "@/lib/supabase/server";
import type { AdminB2BOfferRow, B2BOfferCurrency, B2BOfferStatus } from "@/types/b2b-offer";

const B2B_COLUMNS = [
  "id",
  "reference",
  "buyer_email",
  "buyer_name",
  "buyer_company",
  "buyer_country",
  "buyer_phone",
  "product_id",
  "product_name",
  "product_code",
  "quantity",
  "offered_price",
  "currency",
  "list_price",
  "min_price",
  "status",
  "thread",
  "auto_counter_at",
  "responded_at",
  "accepted_at",
  "order_id",
  "assigned_to",
  "internal_notes",
  "created_at",
  "updated_at",
].join(", ");

export type AdminB2BListFilter = {
  status?: B2BOfferStatus | "all";
  currency?: B2BOfferCurrency | "all";
};

export async function getAdminB2bOffers(
  filters: AdminB2BListFilter,
): Promise<AdminB2BOfferRow[]> {
  const supabase = await createClient();

  let query = supabase.from("b2b_offers").select(B2B_COLUMNS);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.currency && filters.currency !== "all") {
    query = query.eq("currency", filters.currency);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`getAdminB2bOffers failed: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeOffer(row as unknown as Record<string, unknown>));
}

export async function getAdminB2bOfferById(id: string): Promise<AdminB2BOfferRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("b2b_offers")
    .select(B2B_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getAdminB2bOfferById failed: ${error.message}`);
  }

  return data ? normalizeOffer(data as unknown as Record<string, unknown>) : null;
}

function normalizeOffer(row: Record<string, unknown>): AdminB2BOfferRow {
  const thread = Array.isArray(row.thread) ? row.thread : [];
  return {
    ...(row as unknown as AdminB2BOfferRow),
    thread: thread as AdminB2BOfferRow["thread"],
  };
}

export type B2BAdminStats = {
  pendingCount: number;
  reviewingCount: number;
  pipelineByCurrency: Partial<Record<B2BOfferCurrency, number>>;
  acceptedThisMonthCount: number;
};

export async function getB2bAdminStats(): Promise<B2BAdminStats> {
  const supabase = await createClient();

  const pipelineStatuses = ["pending", "reviewing", "countered"] as const;

  const [pendingRes, reviewingRes, pipelineRes, acceptedRes] = await Promise.all([
    supabase
      .from("b2b_offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("b2b_offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "reviewing"),
    supabase
      .from("b2b_offers")
      .select("offered_price, currency")
      .in("status", [...pipelineStatuses]),
    supabase
      .from("b2b_offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .gte("accepted_at", startOfMonthISO()),
  ]);

  const pipelineByCurrency: Partial<Record<B2BOfferCurrency, number>> = {};
  const pipelineRows =
    (pipelineRes.data as { offered_price: number; currency: B2BOfferCurrency }[] | null) ?? [];
  for (const r of pipelineRows) {
    const c = r.currency;
    pipelineByCurrency[c] = (pipelineByCurrency[c] ?? 0) + Number(r.offered_price);
  }

  return {
    pendingCount: pendingRes.count ?? 0,
    reviewingCount: reviewingRes.count ?? 0,
    pipelineByCurrency,
    acceptedThisMonthCount: acceptedRes.count ?? 0,
  };
}

function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
