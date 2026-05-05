import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminOrdersListQuerySchema } from "@/lib/schemas/admin-orders";
import { getAdminOrders } from "@/lib/supabase/queries/orders-admin";
import type { OrderCurrency, OrderStatus } from "@/types/order";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "orders", "view")) {
    return NextResponse.json({ error: "You don't have permission to view orders" }, { status: 403 });
  }

  const url = new URL(request.url);
  const raw = {
    status: url.searchParams.get("status") ?? undefined,
    currency: url.searchParams.get("currency") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = adminOrdersListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const q = parsed.data;
  const status =
    q.status === "new" ||
    q.status === "confirmed" ||
    q.status === "packed" ||
    q.status === "dispatched" ||
    q.status === "delivered" ||
    q.status === "cancelled"
      ? (q.status as OrderStatus)
      : "all";
  const currency =
    q.currency === "NGN" || q.currency === "USD" || q.currency === "GBP"
      ? (q.currency as OrderCurrency)
      : "all";

  const { orders, total } = await getAdminOrders({
    status,
    currency,
    search: q.search,
    page: q.page,
    limit: q.limit,
  });

  return NextResponse.json({ data: { orders, total } });
}
